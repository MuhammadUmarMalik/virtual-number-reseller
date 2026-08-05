"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { AnnouncementFormModal } from "@/components/admin/announcement-form-modal";
import { ApiError } from "@/lib/api-client";
import {
  deleteAnnouncement,
  getAdminAnnouncements,
} from "@/services/admin.service";
import type { Announcement } from "@/types/content.types";

export default function AdminAnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const query = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => getAdminAnnouncements({ limit: 100 }),
  });

  const handleDelete = async (announcementId: string) => {
    try {
      await deleteAnnouncement(announcementId);
      toast.success("Announcement deleted");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to delete announcement"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading announcements..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load announcements." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Manage updates shown to users"
        actions={
          <Button type="button" onClick={() => setShowCreate(true)}>
            New Announcement
          </Button>
        }
      />

      {data.items.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="space-y-4">
          {data.items.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {announcement.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {announcement.type} •{" "}
                    {announcement.isPublished ? "Published" : "Draft"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {announcement.message}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(announcement)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDelete(announcement.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <AnnouncementFormModal
          announcement={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSuccess={() => {
            setShowCreate(false);
            setEditing(null);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
