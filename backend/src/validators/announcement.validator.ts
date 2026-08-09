import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  message: z.string().trim().min(2, "Message is required"),
  type: z.enum(["GENERAL", "STOCK", "PRICE_UPDATE", "MAINTENANCE", "SERVICE_ISSUE"]).default("GENERAL"),
  isPublished: z.boolean().default(false),
  publishedAt: z.coerce.date().nullable().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof announcementSchema>;
