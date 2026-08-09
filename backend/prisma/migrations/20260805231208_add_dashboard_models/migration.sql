-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACTIVE', 'WAITING_OTP', 'OTP_RECEIVED', 'COMPLETED', 'REFUND_PENDING', 'REFUNDED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NumberStatus" AS ENUM ('WAITING', 'ACTIVE', 'RECEIVED', 'EXPIRED', 'REFUNDED', 'DISABLED');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "number_type" TEXT NOT NULL,
    "description" TEXT,
    "vendor_cost" DECIMAL(65,30) NOT NULL,
    "selling_price" DECIMAL(65,30) NOT NULL,
    "refund_window_hours" INTEGER NOT NULL DEFAULT 3,
    "available_stock" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_numbers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "status" "NumberStatus" NOT NULL DEFAULT 'WAITING',
    "otp_count" INTEGER NOT NULL DEFAULT 0,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchased_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purchased_number_id" TEXT NOT NULL,
    "vendor_message_id" TEXT,
    "service" TEXT,
    "raw_message" TEXT NOT NULL,
    "otp_code" TEXT,
    "message_hash" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_available_stock_idx" ON "products"("available_stock");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "purchased_numbers_user_id_idx" ON "purchased_numbers"("user_id");

-- CreateIndex
CREATE INDEX "purchased_numbers_order_id_idx" ON "purchased_numbers"("order_id");

-- CreateIndex
CREATE INDEX "purchased_numbers_product_id_idx" ON "purchased_numbers"("product_id");

-- CreateIndex
CREATE INDEX "purchased_numbers_status_idx" ON "purchased_numbers"("status");

-- CreateIndex
CREATE INDEX "otp_messages_user_id_idx" ON "otp_messages"("user_id");

-- CreateIndex
CREATE INDEX "otp_messages_purchased_number_id_idx" ON "otp_messages"("purchased_number_id");

-- CreateIndex
CREATE UNIQUE INDEX "otp_messages_message_hash_key" ON "otp_messages"("message_hash");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_numbers" ADD CONSTRAINT "purchased_numbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_numbers" ADD CONSTRAINT "purchased_numbers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_numbers" ADD CONSTRAINT "purchased_numbers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_messages" ADD CONSTRAINT "otp_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_messages" ADD CONSTRAINT "otp_messages_purchased_number_id_fkey" FOREIGN KEY ("purchased_number_id") REFERENCES "purchased_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
