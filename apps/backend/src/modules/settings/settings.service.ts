import { prisma } from '@divye/database';
import { parseDecimal } from '@divye/shared';
import Decimal from 'decimal.js';
import type { UpdateAppSettingsDto } from './settings.types';

const SETTINGS_ID = 1;

// Fallback defaults used only if the settings row has never been created.
// Adjust to Divye's actual policy — these are placeholders.
const DEFAULT_FREE_SHIPPING_THRESHOLD = 999;
const DEFAULT_FLAT_SHIPPING_CHARGE = 49;
const DEFAULT_COD_ENABLED = true;
const DEFAULT_COD_MIN_ORDER_VALUE = 0;
const DEFAULT_COD_MAX_ORDER_VALUE = null; // no upper limit by default

export interface CodEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export const settingsService = {
  async getSettings() {
    const existing = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (existing) return existing;

    // Lazily seed on first read so a fresh environment doesn't need a manual
    // seed step just to make checkout work.
    return prisma.appSettings.create({
      data: {
        id: SETTINGS_ID,
        freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
        flatShippingCharge: DEFAULT_FLAT_SHIPPING_CHARGE,
        codEnabled: DEFAULT_COD_ENABLED,
        codMinOrderValue: DEFAULT_COD_MIN_ORDER_VALUE,
        codMaxOrderValue: DEFAULT_COD_MAX_ORDER_VALUE,
      },
    });
  },

  async updateSettings(dto: UpdateAppSettingsDto) {
    return prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...dto },
      update: { ...dto },
    });
  },

  /**
   * Pure function: given a settings row and a post-discount subtotal, returns
   * the shipping charge. Takes settings as a param (rather than fetching
   * internally) so callers that need both shipping and COD checks can fetch
   * the settings row once and reuse it.
   */
  computeShippingCharge(
    settings: { freeShippingThreshold: unknown; flatShippingCharge: unknown },
    subtotal: Decimal
  ): Decimal {
    const threshold = parseDecimal(settings.freeShippingThreshold as never);
    const flatCharge = parseDecimal(settings.flatShippingCharge as never);
    return subtotal.gte(threshold) ? new Decimal(0) : flatCharge;
  },

  /**
   * Pure function: given a settings row and the order's total amount,
   * returns whether COD is currently allowed for this order. Does not throw —
   * callers decide how to surface `reason` (e.g. wrap in an AppError).
   */
  checkCodEligibility(
    settings: { codEnabled: boolean; codMinOrderValue: unknown; codMaxOrderValue: unknown },
    totalAmount: Decimal
  ): CodEligibilityResult {
    if (!settings.codEnabled) {
      return { eligible: false, reason: 'Cash on Delivery is currently unavailable' };
    }

    const min = parseDecimal(settings.codMinOrderValue as never);
    if (totalAmount.lt(min)) {
      return {
        eligible: false,
        reason: `Cash on Delivery is available only for orders above ₹${min.toFixed(2)}`,
      };
    }

    if (settings.codMaxOrderValue !== null && settings.codMaxOrderValue !== undefined) {
      const max = parseDecimal(settings.codMaxOrderValue as never);
      if (totalAmount.gt(max)) {
        return {
          eligible: false,
          reason: `Cash on Delivery is available only for orders up to ₹${max.toFixed(2)}`,
        };
      }
    }

    return { eligible: true };
  },

  /**
   * Convenience wrapper for callers that only need the shipping charge and
   * don't already have a settings row in hand.
   */
  async calculateShippingCharge(subtotal: Decimal): Promise<Decimal> {
    const settings = await this.getSettings();
    return this.computeShippingCharge(settings, subtotal);
  },

  /**
   * Customer-facing subset of settings — used by the storefront checkout
   * page to show/hide the COD option and the free-shipping threshold
   * *before* the customer submits an order, rather than only finding out
   * via a 400 from placeOrder. No auth required to call this.
   */
  async getPublicSettings() {
    const settings = await this.getSettings();
    return {
      freeShippingThreshold: settings.freeShippingThreshold,
      flatShippingCharge: settings.flatShippingCharge,
      codEnabled: settings.codEnabled,
      codMinOrderValue: settings.codMinOrderValue,
      codMaxOrderValue: settings.codMaxOrderValue,
    };
  },
};