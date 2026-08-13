"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";

import { ActivationCard } from "@/components/numbers/activation-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveNumbers } from "@/services/number.service";

export default function ActiveNumbersPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["numbers", page],
    queryFn: () => getActiveNumbers({ page, limit: 20 }),
    refetchInterval: 30_000,
  });

  if (query.isLoading) {
    return <LoadingState label="Loading numbers..." variant="grid" rows={6} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load your numbers." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Numbers"
        description="Numbers you have purchased"
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No active numbers"
          description="Buy a number from the dashboard to get started."
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.items.map((number) => (
              <ActivationCard key={number.id} number={number} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
