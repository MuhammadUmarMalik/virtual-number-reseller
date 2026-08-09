import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

type Tx = Prisma.TransactionClient | typeof prisma;

export async function createNotification(
  db: Tx,
  input: { userId: string; title: string; message: string; type?: NotificationType }
) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "SYSTEM",
    },
  });
}

export async function createAuditLog(
  db: Tx,
  input: {
    adminId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
  }
) {
  return db.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: input.oldValue === undefined ? undefined : (input.oldValue as Prisma.InputJsonValue),
      newValue: input.newValue === undefined ? undefined : (input.newValue as Prisma.InputJsonValue),
      ipAddress: input.ipAddress,
    },
  });
}
