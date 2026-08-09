import { productRepository } from "../repositories/product.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { ProductListParams } from "../repositories/product.repository.js";
import type { CreateProductInput } from "../validators/product.validator.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

function serializeProduct(product: {
  sellingPrice: { toString(): string };
  vendorCost?: unknown;
} & Record<string, unknown>) {
  const { vendorCost: _vendorCost, ...rest } = product;
  return { ...rest, sellingPrice: toString(product.sellingPrice) };
}

export const productService = {
  async list(params: ProductListParams) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      productRepository.count(params),
      productRepository.list(params),
    ]);

    return buildPagination(items.map(serializeProduct), total, { page, limit });
  },

  async getById(productId: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return serializeProduct(product);
  },

  async create(input: CreateProductInput) {
    const existing = await productRepository.findBySlug(input.slug);
    if (existing) {
      throw new AppError("A product with this slug already exists", 409);
    }

    const product = await productRepository.create({
      ...input,
      description: input.description || null,
      status: input.status ?? "ACTIVE",
    });

    return serializeProduct(product);
  },

  async update(productId: string, input: Partial<CreateProductInput>) {
    const existing = await productRepository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await productRepository.findBySlug(input.slug);
      if (slugTaken && slugTaken.id !== productId) {
        throw new AppError("A product with this slug already exists", 409);
      }
    }

    const product = await productRepository.update(productId, {
      ...input,
      description: input.description ?? existing.description,
    });

    return serializeProduct(product);
  },

  async remove(productId: string) {
    const existing = await productRepository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }
    await productRepository.delete(productId);
  },
};
