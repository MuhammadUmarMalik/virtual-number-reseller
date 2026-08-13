-- Make existing product names unique before enforcing a unique constraint.
-- Append the provider id when available, otherwise a numeric suffix.
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  i INT;
BEGIN
  FOR rec IN
    SELECT p.id, p.name, p.vendor_provider_id
    FROM "products" p
    WHERE p.name IN (
      SELECT name FROM "products" GROUP BY name HAVING COUNT(*) > 1
    )
    ORDER BY p.created_at, p.id
  LOOP
    base := rec.name;
    candidate := CASE
      WHEN rec.vendor_provider_id IS NOT NULL THEN base || ' - Provider ' || rec.vendor_provider_id
      ELSE base
    END;
    IF EXISTS (SELECT 1 FROM "products" WHERE name = candidate AND id <> rec.id) OR
       (rec.vendor_provider_id IS NULL AND EXISTS (SELECT 1 FROM "products" WHERE name = base AND id <> rec.id)) THEN
      i := 2;
      LOOP
        candidate := base || ' (' || i || ')';
        EXIT WHEN NOT EXISTS (SELECT 1 FROM "products" WHERE name = candidate AND id <> rec.id);
        i := i + 1;
      END LOOP;
    END IF;
    UPDATE "products" SET name = candidate WHERE id = rec.id;
  END LOOP;
END $$;

-- Drop the composite unique constraint so the same vendor/service/country
-- can be sold with different providers, pricing, and stock.
DROP INDEX "products_vendor_service_country_key";

-- Enforce unique product names.
CREATE UNIQUE INDEX "products_name_key" ON "products" ("name");

-- Keep an index for service/country lookups.
CREATE INDEX "products_vendor_service_country_idx" ON "products" ("vendor", "service", "country");
