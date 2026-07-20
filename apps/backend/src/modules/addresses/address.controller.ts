import type { Request, Response, NextFunction } from 'express';
import * as addressService from './address.service';
import { successResponse } from '../../utils/response';
import type {
    CreateAddressDto,
    UpdateAddressDto,
} from './address.types';

export const listAddressesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const addresses = await addressService.listAddresses(req.user!.id);
        res.status(200).json(successResponse(addresses, 'Addresses retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

export const getAddressHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const address = await addressService.getAddressById(req.user!.id, req.params.id);
        res.status(200).json(successResponse(address, 'Address retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

export const createAddressHandler = async (
    req: Request<Record<string, never>, unknown, CreateAddressDto>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const address = await addressService.createAddress(req.user!.id, req.body);
        res.status(201).json(successResponse(address, 'Address created successfully'));
    } catch (error) {
        next(error);
    }
};

export const updateAddressHandler = async (
    req: Request<{ id: string }, unknown, UpdateAddressDto>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const address = await addressService.updateAddress(req.user!.id, req.params.id, req.body);
        res.status(200).json(successResponse(address, 'Address updated successfully'));
    } catch (error) {
        next(error);
    }
};

export const deleteAddressHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await addressService.deleteAddress(req.user!.id, req.params.id);
        res.status(200).json(successResponse(null, 'Address deleted successfully'));
    } catch (error) {
        next(error);
    }
};

export const setDefaultAddressHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const address = await addressService.setDefaultAddress(req.user!.id, req.params.id);
        res.status(200).json(successResponse(address, 'Default address updated successfully'));
    } catch (error) {
        next(error);
    }
};