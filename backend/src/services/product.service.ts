import { prisma } from "../config/database.js";
import { productRepository } from "../repositories/product.repository.js";
import { createAuditLog } from "./audit.service.js";
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
  secretKey?: unknown;
} & Record<string, unknown>) {
  const { vendorCost: _vendorCost, secretKey: _secretKey, ...rest } = product;
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
    if (!product || product.deletedAt) {
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

  async remove(productId: string, adminId: string) {
    const existing = await productRepository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }
    if (existing.deletedAt) {
      throw new AppError("Product has already been deleted", 409);
    }

    const [orderItems, purchasedNumbers, importedNumbers] = await Promise.all([
      prisma.orderItem.count({ where: { productId } }),
      prisma.purchasedNumber.count({ where: { productId } }),
      prisma.productNumber.count({ where: { productId } }),
    ]);

    // A product with no history can be removed outright. Once anything has
    // been sold the record must stay for order/refund accounting, so hide it
    // instead of deleting its numbers and financial references.
    if (orderItems === 0 && purchasedNumbers === 0 && importedNumbers === 0) {
      await productRepository.delete(productId);
      await createAuditLog(prisma, {
        adminId,
        action: "PRODUCT_DELETE",
        entityType: "Product",
        entityId: productId,
        newValue: { softDelete: false },
      });
      return { softDelete: false };
    }

    await productRepository.update(productId, {
      deletedAt: new Date(),
      status: "INACTIVE",
      availableStock: 0,
      // Free the unique name/slug so the product can be re-created.
      name: `deleted_${productId}`,
      slug: `deleted-${productId}`,
    });

    await createAuditLog(prisma, {
      adminId,
      action: "PRODUCT_DELETE",
      entityType: "Product",
      entityId: productId,
      newValue: { softDelete: true, name: existing.name },
    });

    return { softDelete: true };
  },
};
