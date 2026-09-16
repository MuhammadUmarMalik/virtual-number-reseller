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

  console.log("Admin seed completed", { admin: admin.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
