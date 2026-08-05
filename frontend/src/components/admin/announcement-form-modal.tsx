"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/services/admin.service";
import type { Announcement, AnnouncementType } from "@/types/content.types";

const announcementSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
  type: z.enum(["GENERAL", "STOCK", "PRICE_UPDATE", "MAINTENANCE", "SERVICE_ISSUE"]),
  isPublished: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "GENERAL",
  "STOCK",
  "PRICE_UPDATE",
  "MAINTENANCE",
  "SERVICE_ISSUE",
];

interface AnnouncementFormModalProps {
  announcement: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AnnouncementFormModal({
  announcement,
  onClose,
  onSuccess,
}: AnnouncementFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: announcement
      ? {
          title: announcement.title,
          message: announcement.message,
          type: announcement.type,
          isPublished: announcement.isPublished,
        }
      : {
          title: "",
          message: "",
          type: "GENERAL",
          isPublished: true,
        },
  });

  const submitForm: SubmitHandler<AnnouncementFormValues> = async (values) => {
    setServerError(null);
    try {
      if (announcement) {
        await updateAnnouncement(announcement.id, values);
      } else {
        await createAnnouncement(values);
      }
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : "Unable to save announcement"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {announcement ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}
          <FormField
            label="Title"
            type="text"
            error={errors.title?.message}
            disabled={isSubmitting}
            {...register("title")}
          />
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              disabled={isSubmitting}
              {...register("type")}
            >
              {ANNOUNCEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Message"
            type="text"
            error={errors.message?.message}
            disabled={isSubmitting}
            {...register("message")}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20"
              disabled={isSubmitting}
              {...register("isPublished")}
            />
            Publish immediately
          </label>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {announcement ? "Save Changes" : "Create Announcement"}
          </Button>
        </form>
      </div>
    </div>
  );
}
