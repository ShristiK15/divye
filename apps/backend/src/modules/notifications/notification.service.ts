import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

type OrderLike = {
  orderNumber: string;
  totalAmount: { toString(): string };
  status: string;
};

type UserLike = {
  email: string;
  name: string;
  phone?: string | null;
};

type VariantLike = {
  sku: string;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
};

type ProductLike = {
  name: string;
};

class NotificationService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      logger.error('Failed to send email', { to, subject, error });
    }
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    try {
      const url = `https://control.msg91.com/api/v5/flow/`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: env.MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: 'default',
          short_url: '0',
          recipients: [{ mobiles: `91${phone}`, var: message }],
        }),
      });
    } catch (error) {
      logger.error('Failed to send SMS', { phone, error });
    }
  }

  private async sendWhatsApp(phone: string, templateName: string, params: string[]): Promise<void> {
    try {
      const url = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: params.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        }),
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { phone, templateName, error });
    }
  }

  async sendOrderConfirmation(order: OrderLike, user: UserLike): Promise<void> {
    const html = `
      <h2>Order Confirmed - ${order.orderNumber}</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for your order! Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
      <p>Total Amount: ₹${order.totalAmount.toString()}</p>
      <p>We'll notify you when your order ships.</p>
      <p>— Divye Electronics Solutions</p>
    `;

    await this.sendEmail(user.email, `Order Confirmed - ${order.orderNumber}`, html);

    if (user.phone) {
      this.sendSms(user.phone, `Order ${order.orderNumber} confirmed. Total: Rs.${order.totalAmount.toString()}`).catch(() => {});
      this.sendWhatsApp(user.phone, 'order_confirmation', [order.orderNumber, order.totalAmount.toString()]).catch(() => {});
    }
  }

  async sendOrderShipped(order: OrderLike, user: UserLike, trackingId: string): Promise<void> {
    const html = `
      <h2>Order Shipped - ${order.orderNumber}</h2>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been shipped.</p>
      <p>Tracking ID: <strong>${trackingId}</strong></p>
      <p>— Divye Electronics Solutions</p>
    `;

    await this.sendEmail(user.email, `Order Shipped - ${order.orderNumber}`, html);

    if (user.phone) {
      this.sendSms(user.phone, `Order ${order.orderNumber} shipped. Tracking: ${trackingId}`).catch(() => {});
    }
  }

  async sendOrderDelivered(order: OrderLike, user: UserLike): Promise<void> {
    const html = `
      <h2>Order Delivered - ${order.orderNumber}</h2>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been delivered. We hope you enjoy your purchase!</p>
      <p>— Divye Electronics Solutions</p>
    `;

    await this.sendEmail(user.email, `Order Delivered - ${order.orderNumber}`, html);
  }

  async sendOrderCancelled(order: OrderLike, user: UserLike): Promise<void> {
    const html = `
      <h2>Order Cancelled - ${order.orderNumber}</h2>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
      <p>— Divye Electronics Solutions</p>
    `;

    await this.sendEmail(user.email, `Order Cancelled - ${order.orderNumber}`, html);
  }

  async sendLowStockAlert(variant: VariantLike, product: ProductLike): Promise<void> {
    const html = `
      <h2>Low Stock Alert</h2>
      <p>Product: <strong>${product.name}</strong> (${variant.name})</p>
      <p>SKU: ${variant.sku}</p>
      <p>Current Stock: ${variant.stockQty} (Threshold: ${variant.lowStockThreshold})</p>
    `;

    await this.sendEmail(env.ADMIN_EMAIL, `Low Stock: ${variant.sku}`, html);
  }

  async sendEmailVerification(user: UserLike, token: string): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <h2>Verify Your Email</h2>
      <p>Hi ${user.name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `;

    await this.sendEmail(user.email, 'Verify your email - Divye Electronics', html);
  }

  async sendPasswordReset(user: UserLike, otp: string): Promise<void> {
    const html = `
      <h2>Password Reset</h2>
      <p>Hi ${user.name},</p>
      <p>Your password reset OTP is: <strong>${otp}</strong></p>
      <p>This OTP expires in 15 minutes.</p>
    `;

    await this.sendEmail(user.email, 'Password Reset OTP - Divye Electronics', html);

    if (user.phone) {
      this.sendSms(user.phone, `Your Divye Electronics password reset OTP is ${otp}`).catch(() => {});
    }
  }

  async sendRestockNotification(
    variant: VariantLike,
    subscribers: UserLike[]
  ): Promise<void> {
    for (const subscriber of subscribers) {
      const html = `
        <h2>Back in Stock!</h2>
        <p>Hi ${subscriber.name},</p>
        <p><strong>${variant.name}</strong> is back in stock.</p>
        <p>— Divye Electronics Solutions</p>
      `;
      await this.sendEmail(subscriber.email, `${variant.name} is back in stock!`, html);
    }
  }
}

export const notificationService = new NotificationService();
