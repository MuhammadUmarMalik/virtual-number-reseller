import { AbuseRuleAction, PaymentProvider, Prisma, PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const seedPassword = process.env.SEED_USER_PASSWORD ?? "ChangeMe123!";
const encryptedDevelopmentSecret =
  process.env.SEED_VENDOR_API_KEY_ENCRYPTED ?? "dev-only-encrypted-placeholder";

async function upsertUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
    },
    create: {
      ...input,
      emailVerifiedAt: new Date(),
      wallet: {
        create: {
          balance: new Prisma.Decimal(0),
          currency: "PKR",
        },
      },
    },
  });
}

async function main() {
  const passwordHash = await argon2.hash(seedPassword, { type: argon2.argon2id });

  const [admin, normalUser] = await Promise.all([
    upsertUser({
      name: "Platform Admin",
      email: "admin@example.com",
      passwordHash,
      role: UserRole.ADMIN,
    }),
    upsertUser({
      name: "Demo User",
      email: "user@example.com",
      passwordHash,
      role: UserRole.USER,
    }),
  ]);

  await prisma.wallet.createMany({
    data: [
      { userId: admin.id, balance: new Prisma.Decimal(0), currency: "PKR" },
      { userId: normalUser.id, balance: new Prisma.Decimal(0), currency: "PKR" },
    ],
    skipDuplicates: true,
  });

  const country = await prisma.country.upsert({
    where: { isoCode: "US" },
    update: {
      name: "United States",
      dialCode: "+1",
      status: "ACTIVE",
      deletedAt: null,
    },
    create: {
      name: "United States",
      isoCode: "US",
      dialCode: "+1",
    },
  });

  const services = await Promise.all(
    [
      { name: "Facebook", slug: "facebook" },
      { name: "Google", slug: "google" },
      { name: "WhatsApp", slug: "whatsapp" },
    ].map((service) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: { name: service.name, status: "ACTIVE", deletedAt: null },
        create: service,
      }),
    ),
  );

  const vendor = await prisma.vendor.upsert({
    where: { code: "mock" },
    update: {
      name: "Mock Vendor",
      baseUrl: "https://vendor.example.com",
      apiKeyEncrypted: encryptedDevelopmentSecret,
      status: "ACTIVE",
      priority: 1,
      deletedAt: null,
    },
    create: {
      name: "Mock Vendor",
      code: "mock",
      baseUrl: "https://vendor.example.com",
      apiKeyEncrypted: encryptedDevelopmentSecret,
      priority: 1,
      healthScore: new Prisma.Decimal(100),
    },
  });

  for (const [index, service] of services.entries()) {
    const vendorCost = new Prisma.Decimal(100 + index * 20);
    const product = await prisma.vendorProduct.upsert({
      where: {
        vendorId_countryId_serviceId_vendorProductCode: {
          vendorId: vendor.id,
          countryId: country.id,
          serviceId: service.id,
          vendorProductCode: `mock-us-${service.slug}`,
        },
      },
      update: {
        vendorCost,
        availableQuantity: 100,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        vendorId: vendor.id,
        countryId: country.id,
        serviceId: service.id,
        vendorProductCode: `mock-us-${service.slug}`,
        vendorCost,
        availableQuantity: 100,
        metadata: { environment: "development", authorisedUseOnly: true },
      },
    });

    const existingRule = await prisma.pricingRule.findFirst({
      where: {
        vendorProductId: product.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    const pricingData = {
      pricingMode: "HYBRID" as const,
      fixedMargin: new Prisma.Decimal(80),
      percentageMargin: new Prisma.Decimal("0.2500"),
      minimumProfit: new Prisma.Decimal(60),
      bulkMinQuantity: 5,
      bulkDiscountPercentage: new Prisma.Decimal("0.0500"),
      active: true,
    };

    if (existingRule) {
      await prisma.pricingRule.update({
        where: { id: existingRule.id },
        data: { ...pricingData, deletedAt: null },
      });
    } else {
      await prisma.pricingRule.create({
        data: {
          vendorProductId: product.id,
          ...pricingData,
        },
      });
    }
  }

  await prisma.abuseRule.upsert({
    where: { code: "PURCHASE_VELOCITY_10_PER_MINUTE" },
    update: {
      status: "ACTIVE",
      action: AbuseRuleAction.LIMIT,
      limitValue: 10,
      windowSeconds: 60,
      deletedAt: null,
    },
    create: {
      code: "PURCHASE_VELOCITY_10_PER_MINUTE",
      name: "Purchase velocity limit",
      description: "Limits rapid number purchases for abuse prevention.",
      action: AbuseRuleAction.LIMIT,
      conditions: { operation: "purchase", scope: "user" },
      limitValue: 10,
      windowSeconds: 60,
      createdById: admin.id,
    },
  });

  const settings: Array<{
    key: string;
    category: string;
    value: Prisma.InputJsonValue;
    description: string;
  }> = [
    {
      key: "wallet.minimum_initial_topup",
      category: "wallet",
      value: { amount: "500.00", currency: "PKR" },
      description: "Minimum amount required for the first wallet top-up.",
    },
    {
      key: "purchase.quantity_limits",
      category: "purchase_limits",
      value: { singleOrder: 20, perDay: 100 },
      description: "Default number purchase quantity limits.",
    },
    {
      key: "purchase.kyc_threshold",
      category: "purchase_limits",
      value: { amount: "5000.00", currency: "PKR", period: "DAY" },
      description: "Purchases above this daily value require verified KYC.",
    },
    {
      key: "payments.enabled_providers",
      category: "payments",
      value: {
        providers: [PaymentProvider.JAZZCASH, PaymentProvider.EASYPAISA],
      },
      description: "Payment providers enabled outside local mock flows.",
    },
    {
      key: "activation.otp_retention_hours",
      category: "security",
      value: { hours: 24 },
      description: "Maximum retention period before encrypted OTP data is purged.",
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        category: setting.category,
        value: setting.value,
        description: setting.description,
        updatedById: admin.id,
        deletedAt: null,
      },
      create: {
        ...setting,
        updatedById: admin.id,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
