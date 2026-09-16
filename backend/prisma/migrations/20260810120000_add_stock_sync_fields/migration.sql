-- Add per-product live stock sync fields

ALTER TABLE "products" ADD COLUMN "margin_multiplier" DECIMAL(10, 2) NOT NULL DEFAULT 1.5;
ALTER TABLE "products" ADD COLUMN "last_synced_at" TIMESTAMP(3);
