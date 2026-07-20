import { prisma } from '@divye/database';;
import { AppError, ErrorCodes } from '../../utils/app-error';
import { mapPrismaError } from '../../utils/prisma-error';
import type { Prisma } from '@prisma/client';

export const MAX_ADDRESSES_PER_USER = 5;

type CreateAddressInput = Omit<Prisma.AddressCreateInput, 'user' | 'userId'> & {
    isDefault?: boolean;
};
type UpdateAddressInput = Partial<CreateAddressInput>;

export async function listAddresses(userId: string) {
    return prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
}

export async function getAddressById(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
    });
    if (!address) throw new AppError('Address not found', 400, ErrorCodes.NOT_FOUND);
    return address;
}

export async function createAddress(userId: string, data: CreateAddressInput) {
    return prisma.$transaction(async (tx) => {
        const existingCount = await tx.address.count({ where: { userId } });

        if (existingCount >= MAX_ADDRESSES_PER_USER) {
            throw new AppError(
                'You can save up to ${MAX_ADDRESSES_PER_USER} addresses. Delete one to add a new address.', 400, ErrorCodes.BAD_REQUEST,
            );
        }

        // First address is always default, regardless of what client sent
        const shouldBeDefault = data.isDefault === true || existingCount === 0;

        if (shouldBeDefault) {
            await tx.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return tx.address.create({
            data: { ...data, userId, isDefault: shouldBeDefault },
        });
    });
}

export async function updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressInput
) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) throw new AppError('Address not found', 400, ErrorCodes.NOT_FOUND);

        // Don't let the last/only default be un-set with nothing to replace it
        if (data.isDefault === false && existing.isDefault) {
            throw new AppError(
                'Set a different address as default before unsetting this one', 400, ErrorCodes.BAD_REQUEST
            );
        }

        if (data.isDefault === true && !existing.isDefault) {
            await tx.address.updateMany({
                where: { userId, isDefault: true, NOT: { id: addressId } },
                data: { isDefault: false },
            });
        }

        return tx.address.update({
            where: { id: addressId },
            data,
        });
    });
}

export async function deleteAddress(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) throw new AppError('Address not found', 400, ErrorCodes.BAD_REQUEST);

        try {
            await tx.address.delete({ where: { id: addressId } });
        } catch (err) {
            // If Order.addressId is Restrict, this is P2003 -> map to a clean 409
            throw mapPrismaError(err);
        }

        // Promote the most recent remaining address to default, if one existed
        if (existing.isDefault) {
            const next = await tx.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (next) {
                await tx.address.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }
    });
}

export async function setDefaultAddress(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) throw new AppError('Address not found', 400, ErrorCodes.BAD_REQUEST);

        if (existing.isDefault) return existing; // no-op

        await tx.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });

        return tx.address.update({
            where: { id: addressId },
            data: { isDefault: true },
        });
    });
}