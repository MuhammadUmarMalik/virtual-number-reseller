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

  const wallet = await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log("Seed completed", { admin: admin.email, wallet: wallet.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
