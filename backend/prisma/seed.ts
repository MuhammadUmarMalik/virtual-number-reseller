import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@numberreseller.com" },
    update: {},
    create: {
      fullName: "System Admin",
      email: "admin@numberreseller.com",
      whatsappNumber: "03000000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@numberreseller.com" },
    update: {},
    create: {
      fullName: "Demo User",
      email: "demo@numberreseller.com",
      whatsappNumber: "03001112222",
      passwordHash,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: demo.id },
    update: {},
    create: { userId: demo.id, balance: 500 },
  });

  const productsData = [
    {
      name: "FB USA SIM Numbers",
      slug: "fb-usa-sim",
      country: "United States",
      countryCode: "US",
      service: "Facebook",
      numberType: "SIM",
      vendorCost: 30,
      sellingPrice: 55,
      refundWindowHours: 3,
      availableStock: 120,
    },
    {
      name: "Telegram USA SIM Numbers",
      slug: "telegram-usa-sim",
      country: "United States",
      countryCode: "US",
      service: "Telegram",
      numberType: "SIM",
      vendorCost: 35,
      sellingPrice: 65,
      refundWindowHours: 3,
      availableStock: 85,
    },
    {
      name: "WhatsApp USA Virtual Numbers",
      slug: "whatsapp-usa-virtual",
      country: "United States",
      countryCode: "US",
      service: "WhatsApp",
      numberType: "Virtual",
      vendorCost: 28,
      sellingPrice: 50,
      refundWindowHours: 2,
      availableStock: 200,
    },
    {
      name: "Google USA SIM Numbers",
      slug: "google-usa-sim",
      country: "United States",
      countryCode: "US",
      service: "Google",
      numberType: "SIM",
      vendorCost: 40,
      sellingPrice: 75,
      refundWindowHours: 3,
      availableStock: 0,
    },
  ];

  const products: Record<string, string> = {};
  for (const data of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        country: data.country,
        countryCode: data.countryCode,
        service: data.service,
        numberType: data.numberType,
        vendorCost: data.vendorCost,
        sellingPrice: data.sellingPrice,
        refundWindowHours: data.refundWindowHours,
        availableStock: data.availableStock,
      },
      create: data,
    });
    products[data.slug] = product.id;
  }

  const existingOrder = await prisma.order.findFirst({
    where: { userId: demo.id },
  });

  if (!existingOrder && products["fb-usa-sim"]) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode: "ORD-DEMO0001",
          userId: demo.id,
          subtotal: 55,
          total: 55,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: products["fb-usa-sim"]!,
          quantity: 1,
          unitPrice: 55,
          totalPrice: 55,
          status: "COMPLETED",
        },
      });

      const number = await tx.purchasedNumber.create({
        data: {
          userId: demo.id,
          orderId: order.id,
          orderItemId: orderItem.id,
          productId: products["fb-usa-sim"]!,
          phoneNumber: "+1 (555) 013-4402",
          status: "RECEIVED",
          otpCount: 1,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await tx.otpMessage.create({
        data: {
          userId: demo.id,
          purchasedNumberId: number.id,
          service: "Facebook",
          rawMessage: "Your Facebook code is 442910",
          otpCode: "442910",
        },
      });
    });
  }

  const paymentAccounts = [
    {
      title: "JazzCash Wallet",
      accountName: "Number Reseller PVT",
      accountNumber: "03001234567",
      paymentMethod: "JAZZCASH",
      instructions: "Send to this JazzCash number and share your transaction ID.",
    },
    {
      title: "Easypaisa Wallet",
      accountName: "Number Reseller PVT",
      accountNumber: "03007654321",
      paymentMethod: "EASYPAISA",
      instructions: "Send to this Easypaisa number and share your transaction ID.",
    },
    {
      title: "Meezan Bank",
      accountName: "Number Reseller PVT",
      accountNumber: "0001-23456789-01",
      paymentMethod: "BANK_TRANSFER",
      instructions: "Use bank transfer and upload your receipt screenshot.",
    },
  ];

  for (const account of paymentAccounts) {
    const existing = await prisma.paymentAccount.findFirst({
      where: { accountNumber: account.accountNumber },
    });
    if (!existing) {
      await prisma.paymentAccount.create({ data: account });
    }
  }

  const appSettings = {
    admin_whatsapp_number: "923000000000",
    support_email: "support@numberreseller.com",
    support_whatsapp: "923000000000",
    min_topup_amount: "100",
  };

  for (const [key, value] of Object.entries(appSettings)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const existingNotification = await prisma.notification.findFirst({
    where: { userId: demo.id },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: demo.id,
        title: "Welcome to Number Reseller",
        message: "Top up your wallet to start buying numbers.",
        type: "SYSTEM",
      },
    });
  }

  console.log("Seed completed", {
    admin: admin.email,
    demo: demo.email,
    products: Object.keys(products).length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
