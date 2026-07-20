import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { wishlistService } from './wishlist.service';
import type { WishlistQuery, MoveToCartDto } from './wishlist.types';


export const add = async (
    req: Request<{ productId: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await wishlistService.add(req.user!.id, req.params.productId);
        res.status(201).json(successResponse(result, 'Added to wishlist'));
    } catch (error) {
        next(error);
    }
};

export const remove = async (
    req: Request<{ productId: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await wishlistService.remove(req.user!.id, req.params.productId);
        res.status(200).json(successResponse(null, 'Removed from wishlist'));
    } catch (error) {
        next(error);
    }
};

export const toggle = async (
    req: Request<{ productId: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await wishlistService.toggle(req.user!.id, req.params.productId);
        res.status(200).json(successResponse(result, result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist'));
    } catch (error) {
        next(error);
    }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await wishlistService.list(req.user!.id, req.query as unknown as WishlistQuery);
        res.status(200).json(paginatedResponse(result.items, result.meta));
    } catch (error) {
        next(error);
    }
};

export const moveToCart = async (
    req: Request<{ productId: string }, {}, MoveToCartDto>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await wishlistService.moveToCart(
            req.user!.id,
            req.params.productId,
            req.body
        );

        res
            .status(200)
            .json(successResponse(result, 'Moved to cart'));
    } catch (error) {
        next(error);
    }
};