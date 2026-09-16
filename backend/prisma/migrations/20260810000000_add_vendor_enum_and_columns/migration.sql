-- Add Vendor enum and vendor discriminator columns for multi-vendor support

CREATE TYPE "Vendor" AS ENUM ('DURIAN_RCS', 'SMSBOWER');

ALTER TABLE "products" ADD COLUMN "vendor" "Vendor" NOT NULL DEFAULT 'DURIAN_RCS';

ALTER TABLE "orders" ADD COLUMN "vendor" "Vendor" NOT NULL DEFAULT 'DURIAN_RCS';
ALTER TABLE "orders" ADD COLUMN "vendor_activation_id" TEXT;

ALTER TABLE "purchased_numbers" ADD COLUMN "vendor" "Vendor" NOT NULL DEFAULT 'DURIAN_RCS';
ALTER TABLE "purchased_numbers" ADD COLUMN "vendor_activation_id" TEXT;
ALTER TABLE "purchased_numbers" ADD COLUMN "vendor_cost" DECIMAL(10, 2);
ALTER TABLE "purchased_numbers" ADD COLUMN "vendor_operator" TEXT;
ALTER TABLE "purchased_numbers" ADD COLUMN "can_get_another_sms" BOOLEAN;

CREATE INDEX "products_vendor_idx" ON "products"("vendor");
CREATE INDEX "orders_vendor_idx" ON "orders"("vendor");
CREATE INDEX "orders_vendor_activation_id_idx" ON "orders"("vendor_activation_id");
CREATE INDEX "purchased_numbers_vendor_idx" ON "purchased_numbers"("vendor");
CREATE INDEX "purchased_numbers_vendor_activation_id_idx" ON "purchased_numbers"("vendor_activation_id");
