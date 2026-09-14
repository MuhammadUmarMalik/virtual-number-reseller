-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('VENDOR', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ProductNumberStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "source" "ProductSource" NOT NULL DEFAULT 'VENDOR',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "purchased_numbers" ADD COLUMN "product_number_id" TEXT;

-- CreateTable
CREATE TABLE "product_numbers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "provider_endpoint" TEXT NOT NULL,
    "status" "ProductNumberStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_numbers_number_key" ON "product_numbers"("number");

-- CreateIndex
CREATE INDEX "product_numbers_product_id_idx" ON "product_numbers"("product_id");

-- CreateIndex
CREATE INDEX "product_numbers_status_idx" ON "product_numbers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchased_numbers_product_number_id_key" ON "purchased_numbers"("product_number_id");

-- AddForeignKey
ALTER TABLE "purchased_numbers" ADD CONSTRAINT "purchased_numbers_product_number_id_fkey" FOREIGN KEY ("product_number_id") REFERENCES "product_numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_numbers" ADD CONSTRAINT "product_numbers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;