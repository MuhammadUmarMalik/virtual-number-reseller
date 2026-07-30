-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPPORT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('CNIC', 'PASSPORT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('TOP_UP', 'PURCHASE', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('JAZZCASH', 'EASYPAISA', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VendorProductStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('FIXED_PRICE', 'FIXED_MARGIN', 'PERCENTAGE_MARGIN', 'HYBRID');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ActivationStatus" AS ENUM ('RESERVED', 'WAITING_FOR_OTP', 'OTP_RECEIVED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AbuseRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AbuseRuleAction" AS ENUM ('BLOCK', 'REQUIRE_REVIEW', 'LIMIT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "phoneVerifiedAt" TIMESTAMPTZ(3),
    "initialTopupDone" BOOLEAN NOT NULL DEFAULT false,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "paymentId" UUID,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "balanceBefore" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "referenceType" VARCHAR(50) NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "originalTransactionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "merchantReference" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "callbackVerified" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCallback" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "callbackReference" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "redactedPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentCallback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" VARCHAR(2) NOT NULL,
    "dialCode" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "healthScore" DECIMAL(5,2),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "countryId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "vendorProductCode" TEXT NOT NULL,
    "vendorCost" DECIMAL(18,2) NOT NULL,
    "availableQuantity" INTEGER,
    "status" "VendorProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" UUID NOT NULL,
    "vendorProductId" UUID NOT NULL,
    "pricingMode" "PricingMode" NOT NULL,
    "fixedPrice" DECIMAL(18,2),
    "fixedMargin" DECIMAL(18,2),
    "percentageMargin" DECIMAL(8,4),
    "minimumProfit" DECIMAL(18,2),
    "bulkMinQuantity" INTEGER,
    "bulkDiscountPercentage" DECIMAL(8,4),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "countryId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "vendorProductId" UUID NOT NULL,
    "pricingRuleId" UUID,
    "quantity" INTEGER NOT NULL,
    "unitVendorCostSnapshot" DECIMAL(18,2) NOT NULL,
    "unitSellingPriceSnapshot" DECIMAL(18,2) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "pricingSnapshot" JSONB NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quoteId" UUID,
    "countryId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "vendorProductId" UUID,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "requestedQuantity" INTEGER NOT NULL,
    "successfulQuantity" INTEGER NOT NULL DEFAULT 0,
    "failedQuantity" INTEGER NOT NULL DEFAULT 0,
    "serviceNameSnapshot" TEXT NOT NULL,
    "countryNameSnapshot" TEXT NOT NULL,
    "unitVendorCostSnapshot" DECIMAL(18,2) NOT NULL,
    "unitSellingPriceSnapshot" DECIMAL(18,2) NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activation" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "vendorProductId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "phoneNumber" TEXT,
    "serviceNameSnapshot" TEXT NOT NULL,
    "countryNameSnapshot" TEXT NOT NULL,
    "vendorCostSnapshot" DECIMAL(18,2) NOT NULL,
    "sellingPriceSnapshot" DECIMAL(18,2) NOT NULL,
    "vendorActivationId" TEXT,
    "otpEndpointEncrypted" TEXT,
    "status" "ActivationStatus" NOT NULL DEFAULT 'RESERVED',
    "otpEncrypted" TEXT,
    "otpReceivedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID,
    "activationId" UUID,
    "walletTransactionId" UUID,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "processedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "KycDocumentType" NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "documentReferenceEncrypted" TEXT NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "key" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "lockedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseRule" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AbuseRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "action" "AbuseRuleAction" NOT NULL,
    "conditions" JSONB NOT NULL,
    "limitValue" INTEGER,
    "windowSeconds" INTEGER,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AbuseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedService" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "countryId" UUID,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BlockedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedToId" UUID,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "resolvedAt" TIMESTAMPTZ(3),
    "closedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_kycStatus_idx" ON "User"("kycStatus");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_hashedToken_key" ON "RefreshToken"("hashedToken");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceType_referenceId_idx" ON "WalletTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_paymentId_idx" ON "WalletTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "WalletTransaction_originalTransactionId_idx" ON "WalletTransaction"("originalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantReference_key" ON "Payment"("merchantReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_provider_status_createdAt_idx" ON "Payment"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentCallback_paymentId_receivedAt_idx" ON "PaymentCallback"("paymentId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCallback_paymentId_callbackReference_key" ON "PaymentCallback"("paymentId", "callbackReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCallback_paymentId_payloadHash_key" ON "PaymentCallback"("paymentId", "payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode_key" ON "Country"("isoCode");

-- CreateIndex
CREATE INDEX "Country_status_deletedAt_idx" ON "Country"("status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_deletedAt_idx" ON "Service"("status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_status_priority_deletedAt_idx" ON "Vendor"("status", "priority", "deletedAt");

-- CreateIndex
CREATE INDEX "VendorProduct_serviceId_countryId_status_deletedAt_idx" ON "VendorProduct"("serviceId", "countryId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "VendorProduct_vendorId_status_idx" ON "VendorProduct"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_vendorId_countryId_serviceId_vendorProductCod_key" ON "VendorProduct"("vendorId", "countryId", "serviceId", "vendorProductCode");

-- CreateIndex
CREATE INDEX "PricingRule_vendorProductId_active_startsAt_endsAt_idx" ON "PricingRule"("vendorProductId", "active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "PriceQuote_userId_status_expiresAt_idx" ON "PriceQuote"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "PriceQuote_serviceId_countryId_status_idx" ON "PriceQuote"("serviceId", "countryId", "status");

-- CreateIndex
CREATE INDEX "PriceQuote_vendorProductId_createdAt_idx" ON "PriceQuote"("vendorProductId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_quoteId_key" ON "Order"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Activation_userId_status_idx" ON "Activation"("userId", "status");

-- CreateIndex
CREATE INDEX "Activation_orderId_idx" ON "Activation"("orderId");

-- CreateIndex
CREATE INDEX "Activation_expiresAt_status_idx" ON "Activation"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "Activation_vendorProductId_status_idx" ON "Activation"("vendorProductId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_orderId_lineNumber_key" ON "Activation"("orderId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_vendorId_vendorActivationId_key" ON "Activation"("vendorId", "vendorActivationId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_activationId_key" ON "Refund"("activationId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_walletTransactionId_key" ON "Refund"("walletTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Refund_userId_createdAt_idx" ON "Refund"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "KycSubmission_userId_createdAt_idx" ON "KycSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KycSubmission_status_createdAt_idx" ON "KycSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "KycSubmission_reviewedBy_status_idx" ON "KycSubmission"("reviewedBy", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_userId_createdAt_idx" ON "IdempotencyRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_status_expiresAt_idx" ON "IdempotencyRecord"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_operationType_key_key" ON "IdempotencyRecord"("operationType", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AbuseRule_code_key" ON "AbuseRule"("code");

-- CreateIndex
CREATE INDEX "AbuseRule_status_deletedAt_idx" ON "AbuseRule"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "BlockedService_serviceId_countryId_active_deletedAt_idx" ON "BlockedService"("serviceId", "countryId", "active", "deletedAt");

-- CreateIndex
CREATE INDEX "BlockedService_startsAt_endsAt_idx" ON "BlockedService"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_status_idx" ON "SupportTicket"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_createdAt_idx" ON "SupportTicket"("status", "priority", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_deletedAt_idx" ON "SystemSetting"("category", "deletedAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCallback" ADD CONSTRAINT "PaymentCallback_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "PricingRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "PriceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "Activation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbuseRule" ADD CONSTRAINT "AbuseRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedService" ADD CONSTRAINT "BlockedService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedService" ADD CONSTRAINT "BlockedService_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedService" ADD CONSTRAINT "BlockedService_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Financial and domain invariants that Prisma cannot express in the schema.
ALTER TABLE "Wallet"
  ADD CONSTRAINT "Wallet_balance_nonnegative" CHECK ("balance" >= 0),
  ADD CONSTRAINT "Wallet_version_nonnegative" CHECK ("version" >= 0),
  ADD CONSTRAINT "Wallet_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "WalletTransaction_balances_nonnegative" CHECK ("balanceBefore" >= 0 AND "balanceAfter" >= 0),
  ADD CONSTRAINT "WalletTransaction_balance_math" CHECK (
    (
      "status" = 'COMPLETED'
      AND (
        ("direction" = 'CREDIT' AND "balanceAfter" = "balanceBefore" + "amount")
        OR
        ("direction" = 'DEBIT' AND "balanceAfter" = "balanceBefore" - "amount")
      )
    )
    OR
    ("status" <> 'COMPLETED' AND "balanceAfter" = "balanceBefore")
  );

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "Payment_success_fields" CHECK (
    "status" <> 'SUCCESS'
    OR ("callbackVerified" = true AND "paidAt" IS NOT NULL)
  );

ALTER TABLE "Vendor"
  ADD CONSTRAINT "Vendor_priority_nonnegative" CHECK ("priority" >= 0),
  ADD CONSTRAINT "Vendor_health_score_range" CHECK ("healthScore" IS NULL OR ("healthScore" >= 0 AND "healthScore" <= 100));

ALTER TABLE "VendorProduct"
  ADD CONSTRAINT "VendorProduct_cost_nonnegative" CHECK ("vendorCost" >= 0),
  ADD CONSTRAINT "VendorProduct_quantity_nonnegative" CHECK ("availableQuantity" IS NULL OR "availableQuantity" >= 0);

ALTER TABLE "PricingRule"
  ADD CONSTRAINT "PricingRule_values_nonnegative" CHECK (
    ("fixedPrice" IS NULL OR "fixedPrice" >= 0)
    AND ("fixedMargin" IS NULL OR "fixedMargin" >= 0)
    AND ("minimumProfit" IS NULL OR "minimumProfit" >= 0)
    AND ("bulkMinQuantity" IS NULL OR "bulkMinQuantity" > 0)
  ),
  ADD CONSTRAINT "PricingRule_percentages_range" CHECK (
    ("percentageMargin" IS NULL OR ("percentageMargin" >= 0 AND "percentageMargin" <= 1))
    AND ("bulkDiscountPercentage" IS NULL OR ("bulkDiscountPercentage" >= 0 AND "bulkDiscountPercentage" <= 1))
  ),
  ADD CONSTRAINT "PricingRule_date_range" CHECK ("endsAt" IS NULL OR "startsAt" IS NULL OR "endsAt" > "startsAt");

ALTER TABLE "PriceQuote"
  ADD CONSTRAINT "PriceQuote_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "PriceQuote_money_valid" CHECK (
    "unitVendorCostSnapshot" >= 0
    AND "unitSellingPriceSnapshot" >= 0
    AND "subtotal" >= 0
    AND "discount" >= 0
    AND "discount" <= "subtotal"
    AND "total" = "subtotal" - "discount"
  ),
  ADD CONSTRAINT "PriceQuote_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "PriceQuote_expiry_after_creation" CHECK ("expiresAt" > "createdAt");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_quantities_valid" CHECK (
    "requestedQuantity" > 0
    AND "successfulQuantity" >= 0
    AND "failedQuantity" >= 0
    AND "successfulQuantity" + "failedQuantity" <= "requestedQuantity"
  ),
  ADD CONSTRAINT "Order_money_valid" CHECK (
    "unitVendorCostSnapshot" >= 0
    AND "unitSellingPriceSnapshot" >= 0
    AND "subtotal" >= 0
    AND "discount" >= 0
    AND "discount" <= "subtotal"
    AND "total" = "subtotal" - "discount"
  ),
  ADD CONSTRAINT "Order_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "Activation"
  ADD CONSTRAINT "Activation_line_positive" CHECK ("lineNumber" > 0),
  ADD CONSTRAINT "Activation_prices_nonnegative" CHECK ("vendorCostSnapshot" >= 0 AND "sellingPriceSnapshot" >= 0),
  ADD CONSTRAINT "Activation_reserved_data_present" CHECK (
    "status" IN ('FAILED', 'CANCELLED')
    OR ("phoneNumber" IS NOT NULL AND "otpEndpointEncrypted" IS NOT NULL)
  );

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Refund_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "Refund_source_present" CHECK ("orderId" IS NOT NULL OR "activationId" IS NOT NULL),
  ADD CONSTRAINT "Refund_processed_timestamp" CHECK ("status" = 'PENDING' OR "processedAt" IS NOT NULL);

ALTER TABLE "KycSubmission"
  ADD CONSTRAINT "KycSubmission_started_status" CHECK ("status" <> 'NOT_STARTED');

ALTER TABLE "AbuseRule"
  ADD CONSTRAINT "AbuseRule_limit_positive" CHECK ("limitValue" IS NULL OR "limitValue" > 0),
  ADD CONSTRAINT "AbuseRule_window_positive" CHECK ("windowSeconds" IS NULL OR "windowSeconds" > 0);

ALTER TABLE "BlockedService"
  ADD CONSTRAINT "BlockedService_date_range" CHECK ("endsAt" IS NULL OR "startsAt" IS NULL OR "endsAt" > "startsAt");

-- A payment can produce at most one completed top-up credit. Failed callback
-- attempts remain independently auditable without blocking a later success.
CREATE UNIQUE INDEX "WalletTransaction_one_successful_credit_per_payment"
  ON "WalletTransaction" ("paymentId")
  WHERE "paymentId" IS NOT NULL
    AND "type" = 'TOP_UP'
    AND "direction" = 'CREDIT'
    AND "status" = 'COMPLETED';

-- Ledger and audit history are append-only. Corrections are represented by a
-- new reversal entry, never by changing or deleting historical rows.
CREATE OR REPLACE FUNCTION prevent_immutable_record_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% records are immutable; append a correction instead', TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "WalletTransaction_immutable"
BEFORE UPDATE OR DELETE ON "WalletTransaction"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_change();

CREATE TRIGGER "AuditLog_immutable"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_change();

-- Any balance change must be paired with a completed ledger entry inserted in
-- the same PostgreSQL transaction, and must increment the optimistic version.
CREATE OR REPLACE FUNCTION enforce_wallet_balance_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."balance" IS DISTINCT FROM OLD."balance" THEN
    IF NEW."version" <> OLD."version" + 1 THEN
      RAISE EXCEPTION 'wallet balance changes must increment version by one'
        USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM "WalletTransaction" wt
      WHERE wt."walletId" = OLD."id"
        AND wt."status" = 'COMPLETED'
        AND wt."balanceBefore" = OLD."balance"
        AND wt."balanceAfter" = NEW."balance"
        AND wt."createdAt" >= transaction_timestamp()
    ) THEN
      RAISE EXCEPTION 'wallet balance change requires a matching completed ledger entry'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW."version" IS DISTINCT FROM OLD."version" THEN
    RAISE EXCEPTION 'wallet version cannot change without a balance mutation'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "Wallet_balance_requires_ledger"
BEFORE UPDATE ON "Wallet"
FOR EACH ROW EXECUTE FUNCTION enforce_wallet_balance_ledger();
