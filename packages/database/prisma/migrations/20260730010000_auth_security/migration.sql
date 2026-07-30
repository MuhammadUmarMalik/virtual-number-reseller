CREATE TYPE "VerificationTokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION');

ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" UUID,
ADD COLUMN "replacedByTokenId" UUID,
ADD COLUMN "ipAddress" TEXT,
ADD COLUMN "userAgent" TEXT,
ADD COLUMN "lastUsedAt" TIMESTAMPTZ(3);

UPDATE "RefreshToken" SET "familyId" = "id" WHERE "familyId" IS NULL;
ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

CREATE TABLE "VerificationToken" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "VerificationTokenType" NOT NULL,
  "hashedToken" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "consumedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationToken_hashedToken_key" ON "VerificationToken"("hashedToken");
CREATE INDEX "VerificationToken_userId_type_expiresAt_idx" ON "VerificationToken"("userId", "type", "expiresAt");
CREATE INDEX "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
