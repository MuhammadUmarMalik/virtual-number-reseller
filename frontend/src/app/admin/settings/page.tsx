"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api-client";
import {
  getAdminSettings,
  updateAdminSettings,
} from "@/services/admin.service";

const SETTING_FIELDS: Array<{
  key: string;
  label: string;
}> = [
  { key: "minimum_topup_amount", label: "Minimum Top-Up Amount" },
  { key: "admin_whatsapp_number", label: "Admin WhatsApp Number" },
  { key: "support_whatsapp_number", label: "Support WhatsApp Number" },
  { key: "otp_polling_interval", label: "OTP Polling Interval (minutes)" },
];

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
  });

  if (query.isLoading) {
    return <LoadingState label="Loading settings..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load settings." />;
  }

  const serverValues = query.data;
  const values: Record<string, string> = { ...serverValues, ...draft };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAdminSettings(values);
      setDraft({});
      toast.success("Settings saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System-wide configuration"
        actions={
          <Button
            type="button"
            isLoading={isSaving}
            onClick={() => void handleSave()}
          >
            Save Changes
          </Button>
        }
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTING_FIELDS.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              type="text"
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              disabled={isSaving}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
