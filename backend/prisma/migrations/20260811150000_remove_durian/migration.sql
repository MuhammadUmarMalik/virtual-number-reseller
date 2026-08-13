-- Remove Durian RCS integration.

-- The single Durian product is referenced by historical order items (RESTRICT FK),
-- so convert it to SMSBOWER instead of deleting it. It is INACTIVE, so it is not
-- purchasable and does not appear in the user catalog.
UPDATE "products" SET "vendor" = 'SMSBOWER' WHERE "vendor" = 'DURIAN_RCS';

-- Drop column defaults before altering the enum type (defaults reference the old value).
ALTER TABLE "products" ALTER COLUMN "vendor" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "vendor" DROP DEFAULT;
ALTER TABLE "purchased_numbers" ALTER COLUMN "vendor" DROP DEFAULT;

-- Rebuild the Vendor enum without DURIAN_RCS (Postgres cannot drop an enum value in place).
ALTER TYPE "Vendor" RENAME TO "Vendor_old";
CREATE TYPE "Vendor" AS ENUM ('SMSBOWER');
ALTER TABLE "products" ALTER COLUMN "vendor" TYPE "Vendor" USING ("vendor"::text::"Vendor");
ALTER TABLE "orders" ALTER COLUMN "vendor" TYPE "Vendor" USING ("vendor"::text::"Vendor");
ALTER TABLE "purchased_numbers" ALTER COLUMN "vendor" TYPE "Vendor" USING ("vendor"::text::"Vendor");
DROP TYPE "Vendor_old";

-- Restore the SMSBOWER default on all vendor columns.
ALTER TABLE "products" ALTER COLUMN "vendor" SET DEFAULT 'SMSBOWER';
ALTER TABLE "orders" ALTER COLUMN "vendor" SET DEFAULT 'SMSBOWER';
ALTER TABLE "purchased_numbers" ALTER COLUMN "vendor" SET DEFAULT 'SMSBOWER';
