"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
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
        toast.success("Announcement updated");
      } else {
        await createAnnouncement(values);
        toast.success("Announcement created");
      }
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to save announcement";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal
      title={announcement ? "Edit Announcement" : "New Announcement"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
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
          <Select id="type" disabled={isSubmitting} {...register("type")}>
            {ANNOUNCEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <FormField
          label="Message"
          type="text"
          error={errors.message?.message}
          disabled={isSubmitting}
          {...register("message")}
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            disabled={isSubmitting}
            {...register("isPublished")}
          />
          Publish immediately
        </label>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {announcement ? "Save Changes" : "Create Announcement"}
        </Button>
        </form>
    </Modal>
  );
}
