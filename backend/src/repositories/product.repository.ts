import { prisma } from "../config/database.js";
import type { Prisma, ProductStatus } from "@prisma/client";

export interface ProductListParams {
  page: number;
  limit: number;
  country?: string;
  service?: string;
  numberType?: string;
  status?: string;
  search?: string;
}

export const productRepository = {
  list(params: ProductListParams) {
    const where = buildWhere(params);

    return prisma.product.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  count(params: ProductListParams) {
    return prisma.product.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug } });
  },

  create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({ data });
  },

  update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },
};

function buildWhere(params: ProductListParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (params.status) {
    where.status = params.status as ProductStatus;
  } else {
    where.status = "ACTIVE";
  }

  if (params.country) where.country = params.country;
  if (params.service) where.service = params.service;
  if (params.numberType) where.numberType = params.numberType;

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { service: { contains: params.search, mode: "insensitive" } },
      { country: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}
