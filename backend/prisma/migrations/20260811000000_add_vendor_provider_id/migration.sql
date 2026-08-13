-- Add optional SMSBower provider/operator tier to pin stock sync and purchases

ALTER TABLE "products" ADD COLUMN "vendor_provider_id" TEXT;
