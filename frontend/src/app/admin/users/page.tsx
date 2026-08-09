"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { WalletAdjustModal } from "@/components/admin/wallet-adjust-modal";
import { ApiError } from "@/lib/api-client";
import {
  getAdminUsers,
  updateUserStatus,
} from "@/services/admin.service";
import type { UserStatus } from "@/types/auth.types";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => getAdminUsers({ page, limit: 20 }),
  });

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await updateUserStatus(userId, status);
      toast.success("User status updated");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to update status"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading users..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load users." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts"
      />

      {data.items.length === 0 ? (
        <EmptyState title="No users found" icon={<Users className="h-6 w-6" />} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        {user.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.whatsappNumber}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {user.status === "ACTIVE" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleStatusChange(user.id, "SUSPENDED")}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleStatusChange(user.id, "ACTIVE")}
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingUserId(user.id)}
                        >
                          Wallet
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {adjustingUserId && (
        <WalletAdjustModal
          userId={adjustingUserId}
          onClose={() => setAdjustingUserId(null)}
          onSuccess={() => {
            setAdjustingUserId(null);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
