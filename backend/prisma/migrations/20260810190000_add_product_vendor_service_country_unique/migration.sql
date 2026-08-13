-- Prevent duplicate products for the same vendor/service/country

CREATE UNIQUE INDEX "products_vendor_service_country_key" ON "products"("vendor", "service", "country");
