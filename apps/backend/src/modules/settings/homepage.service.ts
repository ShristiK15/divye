import { prisma } from '@divye/database';
import { cloudinary } from '../../config/cloudinary';
import { AppError, ErrorCodes } from '../../utils/app-error';

// Admin-configurable homepage content, organized as one namespace per
// section. Hero images today; banners / featured categories / promo text
// etc. get their own namespace here later. If a section grows large enough
// to want its own file, pull its namespace out and re-export it below —
// callers keep using `homepageService.<section>.*` either way.

const heroImages = {
  /**
   * Public-safe list, ordered for display. Excludes Cloudinary publicId,
   * which is only needed internally for deletion.
   */
  async list() {
    const images = await prisma.heroImage.findMany({ orderBy: { sortOrder: 'asc' } });
    return images.map(({ id, url, altText, sortOrder }) => ({ id, url, altText, sortOrder }));
  },

  /**
   * Admin-only: uploads one or more hero images to Cloudinary and inserts
   * a row per image. New images are appended after the current max
   * sortOrder, so existing ordering is left untouched. Each insert is its
   * own row — concurrent uploads can't clobber each other the way a
   * shared JSON array would.
   */
  async add(files: Express.Multer.File[]) {
    if (!files.length) {
      throw new AppError('No image files were provided', 400, ErrorCodes.BAD_REQUEST);
    }

    const maxOrderResult = await prisma.heroImage.aggregate({ _max: { sortOrder: true } });
    const startOrder = (maxOrderResult._max.sortOrder ?? -1) + 1;

    const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer)));

    return prisma.$transaction(
      uploaded.map((result, i) =>
        prisma.heroImage.create({
          data: {
            url: result.url,
            publicId: result.publicId,
            altText: '',
            sortOrder: startOrder + i,
          },
        })
      )
    );
  },

  /**
   * Admin-only: removes a hero image both from Cloudinary and from the DB.
   */
  async remove(imageId: string) {
    const target = await prisma.heroImage.findUnique({ where: { id: imageId } });
    if (!target) {
      throw new AppError('Hero image not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.heroImage.delete({ where: { id: imageId } });

    // Best-effort cleanup — don't fail the request if Cloudinary deletion
    // errors (e.g. already removed manually); the DB row is already gone.
    await cloudinary.uploader.destroy(target.publicId).catch(() => undefined);

    return prisma.heroImage.findMany({ orderBy: { sortOrder: 'asc' } });
  },

  /**
   * Admin-only: reorders hero images. `order` must contain every existing
   * hero image id exactly once.
   */
  async reorder(order: string[]) {
    const existing = await prisma.heroImage.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((img) => img.id));

    if (order.length !== existingIds.size || !order.every((id) => existingIds.has(id))) {
      throw new AppError(
        'order must contain every existing hero image id exactly once',
        400,
        ErrorCodes.BAD_REQUEST
      );
    }

    await prisma.$transaction(
      order.map((id, index) =>
        prisma.heroImage.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return prisma.heroImage.findMany({ orderBy: { sortOrder: 'asc' } });
  },

  /**
   * Admin-only: updates the alt text for a single hero image.
   */
  async updateAlt(imageId: string, altText: string) {
    const existing = await prisma.heroImage.findUnique({ where: { id: imageId } });
    if (!existing) {
      throw new AppError('Hero image not found', 404, ErrorCodes.NOT_FOUND);
    }

    return prisma.heroImage.update({ where: { id: imageId }, data: { altText } });
  },
};

// Uploads a single in-memory file buffer (from multer memoryStorage, e.g.
// uploadMultiple in upload.middleware.ts) to Cloudinary. Shared helper —
// other sections (e.g. banners) can reuse this once they need image
// uploads too.
function uploadBuffer(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hero-images', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// --- Future sections --------------------------------------------------
// const banners = { list, add, remove, reorder, ... };
// const featuredCategories = { list, set, ... };

export const homepageService = {
  heroImages,
  // banners,
  // featuredCategories,
};