import { Prisma } from "@prisma/client";
import { logger } from "../config/logger.js";
import { productRepository } from "../repositories/product.repository.js";
import { liveStockService, type LiveStockProduct } from "./live-stock.service.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { ProductListParams } from "../repositories/product.repository.js";
import type { CreateProductInput, UpdatePricingInput } from "../validators/product.validator.js";

function toLiveStockProduct(product: {
  id: string;
  vendor: string;
  service: string;
  countryCode: string;
  vendorCountryId: string | null;
  vendorProviderId: string | null;
  vendorId: string | null;
  vip: string | null;
  needsSync: boolean;
}): LiveStockProduct {
  return {
    id: product.id,
    vendor: product.vendor,
    service: product.service,
    countryCode: product.countryCode,
    vendorCountryId: product.vendorCountryId,
    vendorProviderId: product.vendorProviderId,
    vendorId: product.vendorId,
    vip: product.vip,
    needsSync: product.needsSync,
  };
}

function toString(value: { toString(): string }): string {
  return value.toString();
}

function serializeProduct(product: {
  sellingPrice: { toString(): string };
  vendorCost?: unknown;
  secretKey?: unknown;
  vendorProviderId?: unknown;
} & Record<string, unknown>): Record<string, unknown> & { sellingPrice: string } {
  const { vendorCost: _vendorCost, secretKey: _secretKey, vendorProviderId: _vendorProviderId, ...rest } = product;
  return { ...rest, sellingPrice: toString(product.sellingPrice) };
}

function normalizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...input };
  for (const key of ["vendorId", "secretKey", "vip", "description", "vendorCountryId", "countryDialCode", "vendorProviderId"]) {
    if (normalized[key] === "") {
      normalized[key] = null;
    }
  }

  const vendor = String(normalized.vendor ?? "SMSBOWER");
  if (vendor === "SMSBOWER") {
    const countryCode = String(normalized.countryCode ?? "").trim();
    const vendorCountryId = normalized.vendorCountryId
      ? String(normalized.vendorCountryId).trim()
      : /^\d+$/.test(countryCode)
        ? countryCode
        : "";
    normalized.vendorCountryId = vendorCountryId || null;
    if (/^\+[0-9]{1,4}$/.test(countryCode) && !normalized.countryDialCode) {
      normalized.countryDialCode = countryCode;
    }
  }

  return normalized;
}

export const productService = {
  async list(params: ProductListParams) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      productRepository.count({ ...params, status: params.status ?? "ACTIVE" }),
      productRepository.list({ ...params, status: params.status ?? "ACTIVE" }),
    ]);

    const liveStock = await liveStockService.getLiveStockMap(
      items.map(toLiveStockProduct)
    );
    const serialized = items.map((product) => {
      const item = serializeProduct(product);
      const live = liveStock.get(product.id);
      if (live !== undefined) {
        item.availableStock = live;
      }
      return item;
    });

    return buildPagination(serialized, total, { page, limit });
  },

  async getById(productId: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    const item = serializeProduct(product);
    const live = await liveStockService.getLiveStock(toLiveStockProduct(product));
    if (live !== null) {
      item.availableStock = live;
    }
    return item;
  },

  async create(input: CreateProductInput) {
    const existing = await productRepository.findBySlug(input.slug);
    if (existing) {
      throw new AppError("A product with this slug already exists", 409);
    }

    const nameTaken = await productRepository.findByName(input.name);
    if (nameTaken) {
      throw new AppError("A product with this name already exists", 409);
    }

    const product = await productRepository.create({
      ...(normalizeInput(input) as CreateProductInput),
      description: input.description || null,
      status: input.status ?? "ACTIVE",
    });

    logger.info(
      `[product:create] id=${product.id} vendor=${product.vendor} service=${product.service} country=${product.country} countryCode=${product.countryCode} availableStock=${product.availableStock}`
    );

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

    if (input.name && input.name !== existing.name) {
      const nameTaken = await productRepository.findByName(input.name);
      if (nameTaken && nameTaken.id !== productId) {
        throw new AppError("A product with this name already exists", 409);
      }
    }

    const { availableStock: _stock, ...rest } = input;

    const product = await productRepository.update(productId, {
      ...(normalizeInput(rest) as CreateProductInput),
      description: input.description ?? existing.description,
    });

    return serializeProduct(product);
  },

  async updatePricing(productId: string, input: UpdatePricingInput) {
    const existing = await productRepository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    const data: Prisma.ProductUncheckedUpdateInput = {};

    if (input.marginMultiplier != null) {
      data.marginMultiplier = input.marginMultiplier;
    }

    if (input.sellingPrice != null) {
      data.sellingPrice = input.sellingPrice;
    } else if (input.marginMultiplier != null) {
      const cost = new Prisma.Decimal(existing.vendorCost.toString());
      data.sellingPrice = cost.mul(input.marginMultiplier).toDecimalPlaces(2);
    }

    const product = await productRepository.update(productId, data);

    return serializeProduct(product);
  },

  async remove(productId: string) {
    const existing = await productRepository.findById(productId);
    if (!existing) {
      throw new AppError("Product not found", 404);
    }
    try {
      await productRepository.delete(productId);
    } catch {
      throw new AppError(
        "This product has order history and cannot be deleted. Disable it instead.",
        409
      );
    }
  },
};
