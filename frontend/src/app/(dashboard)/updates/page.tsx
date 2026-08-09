"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAnnouncements } from "@/services/product.service";

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  STOCK: "Stock",
  PRICE_UPDATE: "Price Update",
  MAINTENANCE: "Maintenance",
  SERVICE_ISSUE: "Service Issue",
};

const TYPE_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  GENERAL: "info",
  STOCK: "success",
  PRICE_UPDATE: "warning",
  MAINTENANCE: "danger",
  SERVICE_ISSUE: "danger",
};

export default function UpdatesPage() {
  const query = useQuery({
    queryKey: ["announcements"],
    queryFn: () => getAnnouncements({ limit: 50 }),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading updates..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load updates." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Updates"
        description="Important updates and announcements"
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No updates yet"
          description="Check back later for announcements."
        />
      ) : (
        <div className="space-y-4">
          {data.items.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={TYPE_VARIANTS[announcement.type] ?? "info"}>
                      {TYPE_LABELS[announcement.type] ?? announcement.type}
                    </Badge>
                    {announcement.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.publishedAt).toLocaleDateString(
                          "en-PK",
                          { dateStyle: "medium" }
                        )}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-foreground">
                    {announcement.title}
                  </h2>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {announcement.message}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
