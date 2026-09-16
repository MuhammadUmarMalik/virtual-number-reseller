-- Add vendor country mapping fields to products

ALTER TABLE "products" ADD COLUMN "vendor_country_id" TEXT;
ALTER TABLE "products" ADD COLUMN "country_dial_code" TEXT;
ALTER TABLE "products" ADD COLUMN "needs_sync" BOOLEAN NOT NULL DEFAULT false;
