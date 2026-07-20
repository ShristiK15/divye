import { prisma } from '@divye/database';
import type { UpdateContactDetailsDto } from './contact.types';

const SETTINGS_ID = 1;

export const contactService = {
    async updateDetails(dto: UpdateContactDetailsDto) {
        return prisma.appSettings.update({
            where: { id: SETTINGS_ID },
            data: dto,
        });
    },
};