import { prisma } from "../config/database.js";

export const settingsService = {
  async getAll(): Promise<Record<string, string>> {
    const settings = await prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  },

  async updateAll(entries: Record<string, string>): Promise<Record<string, string>> {
    await prisma.$transaction(
      Object.entries(entries).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return this.getAll();
  },

  async get(key: string): Promise<string | null> {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  },

  async requireString(key: string, fallback: string): Promise<string> {
    return (await this.get(key)) ?? fallback;
  },
};

export async function ensureAppSettings(): Promise<void> {
  const defaults: Record<string, string> = {
    admin_whatsapp_number: "923000000000",
    support_email: "support@numberreseller.com",
    support_whatsapp: "923000000000",
    min_topup_amount: "100",
  };

  await prisma.$transaction(
    Object.entries(defaults).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      })
    )
  );
}
