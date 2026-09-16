"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserEditModal } from "@/components/admin/user-edit-modal";
import { WalletAdjustModal } from "@/components/admin/wallet-adjust-modal";
import { ApiError } from "@/lib/api-client";
import {
  deleteAdminUser,
  getAdminUser,
  updateUserRole,
  updateUserStatus,
} from "@/services/admin.service";
import type { UserRole, UserStatus } from "@/types/auth.types";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useParams<{ userId: string }>();
  const [adjustingWallet, setAdjustingWallet] = useState(false);
  const [editingUser, setEditingUser] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminUser(userId),
    onSuccess: () => {
      toast.success("User deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to delete user"
      );
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Delete ${query.data?.fullName ?? "this user"}? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleStatus = async (status: UserStatus) => {
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

  const handleRole = async (role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      toast.success("User role updated");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to update role"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading user..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load this user." />;
  }

  const user = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName}
        description={user.email}
        actions={
          <Button
            type="button"
            onClick={() => setAdjustingWallet(true)}
          >
            Adjust Wallet
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Account Details
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">WhatsApp</dt>
              <dd className="font-medium text-foreground">{user.whatsappNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground">{user.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={user.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="font-medium text-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-PK")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last Login</dt>
              <dd className="font-medium text-foreground">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString("en-PK")
                  : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.status === "ACTIVE" ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleStatus("SUSPENDED")}
              >
                Suspend User
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleStatus("ACTIVE")}
              >
                Activate User
              </Button>
            )}
            {user.role === "ADMIN" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRole("USER")}
              >
                Remove Admin
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRole("ADMIN")}
              >
                Make Admin
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingUser(true)}
            >
              Edit Profile
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete User
            </Button>
          </div>
        </Card>
      </div>

      {adjustingWallet && (
        <WalletAdjustModal
          userId={user.id}
          onClose={() => setAdjustingWallet(false)}
          onSuccess={() => {
            setAdjustingWallet(false);
            toast.success("Wallet updated");
          }}
        />
      )}

      {editingUser && (
        <UserEditModal
          user={user}
          onClose={() => setEditingUser(false)}
          onSuccess={() => {
            setEditingUser(false);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
