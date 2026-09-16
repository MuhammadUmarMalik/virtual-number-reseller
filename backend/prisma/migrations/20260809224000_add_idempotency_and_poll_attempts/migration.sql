-- AlterTable
ALTER TABLE "orders" ADD COLUMN "idempotency_key" TEXT;
-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
-- AlterTable
ALTER TABLE "purchased_numbers" ADD COLUMN "poll_attempts" INTEGER NOT NULL DEFAULT 0;
