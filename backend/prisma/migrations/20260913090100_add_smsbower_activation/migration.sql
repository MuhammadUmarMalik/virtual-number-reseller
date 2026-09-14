-- AlterTable
ALTER TYPE "NumberStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "purchased_numbers"
  ADD COLUMN "country" TEXT,
  ADD COLUMN "country_code" TEXT,
  ADD COLUMN "service" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "selling_price" DECIMAL(65, 30),
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "activation_status" TEXT,
  ADD COLUMN "activation_started_at" TIMESTAMP(3),
  ADD COLUMN "activation_completed_at" TIMESTAMP(3),
  ADD COLUMN "cancelled_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "purchased_numbers_country_idx" ON "purchased_numbers"("country");

-- CreateIndex
CREATE INDEX "purchased_numbers_service_idx" ON "purchased_numbers"("service");

-- CreateIndex
CREATE INDEX "purchased_numbers_activation_status_idx" ON "purchased_numbers"("activation_status");