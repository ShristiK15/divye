import { prisma } from '@divye/database';
import { generateSlug, ensureUniqueSlug } from '@divye/shared';
import { AppError, ErrorCodes } from '../../utils/app-error';
import type {
  CategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.types';

function buildTree(
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
  }>,
  parentId: string | null = null
): CategoryTreeNode[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      ...c,
      children: buildTree(categories, c.id),
    }));
}

export const categoriesService = {
  async getTree(): Promise<CategoryTreeNode[]> {
    // TODO: cache this response
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return buildTree(categories);
  },

  async getBySlug(slug: string): Promise<CategoryTreeNode> {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404, ErrorCodes.NOT_FOUND);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      children: category.children.map((c) => ({ ...c, children: [] })),
    };
  },

  async create(dto: CreateCategoryDto): Promise<CategoryTreeNode> {
    const baseSlug = dto.slug ?? generateSlug(dto.name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.category.findUnique({ where: { slug: s } });
      return existing !== null;
    });

    if (dto.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new AppError('Parent category not found', 404, ErrorCodes.NOT_FOUND);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder,
      },
    });

    return { ...category, children: [] };
  },

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryTreeNode> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404, ErrorCodes.NOT_FOUND);
    }

    let slug = dto.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await ensureUniqueSlug(dto.slug, async (s) => {
        const found = await prisma.category.findUnique({ where: { slug: s } });
        return found !== null && found.id !== id;
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });

    return { ...category, children: [] };
  },

  async deactivate(id: string): Promise<void> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
