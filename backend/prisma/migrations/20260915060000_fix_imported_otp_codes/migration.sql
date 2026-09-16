-- Re-extract imported-number OTP codes from the stored raw message.
-- The old JSON provider parsing concatenated every digit run in data.code
-- ("87190, ID 294" -> "87190294"). Rewrite otp_code back to the first
-- 4-8 digit word when the saved message text contains a clean token.
-- Only messages on imported products are touched; SMSBower uses an authoritative
-- payload code that is not derived from the message text.

UPDATE "otp_messages" AS om
SET "otp_code" = fix.clean_code
FROM (
  SELECT
    "otp_messages"."id",
    (regexp_match("otp_messages"."raw_message", E'\\m\\d{4,8}\\M'))[1] AS clean_code
  FROM "otp_messages"
  JOIN "purchased_numbers" ON "purchased_numbers"."id" = "otp_messages"."purchased_number_id"
  JOIN "products" ON "products"."id" = "purchased_numbers"."product_id"
  WHERE "products"."source" = 'IMPORTED'
) AS fix
WHERE "om"."id" = "fix"."id"
  AND "fix"."clean_code" IS NOT NULL
  AND "om"."otp_code" IS NOT NULL
  AND "om"."otp_code" <> "fix"."clean_code";