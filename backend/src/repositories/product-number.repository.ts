import type { Prisma, ProductNumberStatus } from "@prisma/client";
import { prisma } from "../config/database.js";

export interface ProductNumberListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export const productNumberRepository = {
  findExistingNumbers(numbers: string[]): Promise<{ number: string }[]> {
    return prisma.productNumber.findMany({
      where: { number: { in: numbers } },
      select: { number: true },
    });
  },

  listByProduct(productId: string, params: ProductNumberListParams) {
    // providerEndpoint stays server-side: it is never returned to the client.
    return prisma.productNumber.findMany({
      where: buildWhere(productId, params),
      select: {
        id: true,
        productId: true,
        number: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        purchasedNumber: {
          select: {
            id: true,
            otpCount: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByProduct(productId: string, params: ProductNumberListParams) {
    return prisma.productNumber.count({
      where: buildWhere(productId, params),
    });
  },
};

function buildWhere(
  productId: string,
  params: ProductNumberListParams
): Prisma.ProductNumberWhereInput {
  const where: Prisma.ProductNumberWhereInput = { productId };

  if (params.status) {
    where.status = params.status as ProductNumberStatus;
  }

  if (params.search) {
    where.number = { contains: params.search.trim(), mode: "insensitive" };
  }

  return where;
}