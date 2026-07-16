import { prisma } from '@divye/database';
import { AppError, ErrorCodes } from '../../utils/app-error';
import type { CreateCarrierDto } from './carriers.types';

export const carriersService = {
  async listActive() {
    return prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { label: 'asc' },
    });
  },

  async listAll() {
    // admin view — includes inactive, for management screens
    return prisma.carrier.findMany({ orderBy: { label: 'asc' } });
  },

  async create(dto: CreateCarrierDto) {
    return prisma.carrier.create({
      data: {
        label: dto.label.trim(),
        trackingUrlTemplate: dto.trackingUrlTemplate || null,
        isSystem: false,
      },
    });
  },

  async deactivate(id: string) {
    const carrier = await prisma.carrier.findUnique({ where: { id } });
    if (!carrier) throw new AppError('Carrier not found', 404, ErrorCodes.NOT_FOUND);
    if (carrier.isSystem) {
      throw new AppError('System carriers cannot be deactivated', 400, ErrorCodes.BAD_REQUEST);
    }
    return prisma.carrier.update({ where: { id }, data: { isActive: false } });
  },
};