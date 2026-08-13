-- CreateEnum
CREATE TYPE "SerialMode" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "secret_key" TEXT,
ADD COLUMN     "serial_mode" "SerialMode" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "vip" TEXT;
