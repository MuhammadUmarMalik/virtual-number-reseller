"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { NumberFormModal } from "@/components/admin/number-form-modal";
import { ApiError } from "@/lib/api-client";
import {
  deleteAdminNumber,
  getAdminNumbers,
  updateAdminNumber,
  type AdminPurchasedNumber,
} from "@/services/admin.service";

export default function AdminNumbersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editingNumber, setEditingNumber] = useState<AdminPurchasedNumber | null>(null);

  const query = useQuery({
    queryKey: ["admin", "numbers", page, status, search],
    queryFn: () =>
      getAdminNumbers({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  const disableMutation = useMutation({
    mutationFn: (numberId: string) =>
      updateAdminNumber(numberId, { status: "DISABLED" }),
    onSuccess: () => {
      toast.success("Number disabled");
      void queryClient.invalidateQueries({ queryKey: ["admin", "numbers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to disable number"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (numberId: string) => deleteAdminNumber(numberId),
    onSuccess: () => {
      toast.success("Number deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "numbers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to delete number"
      );
    },
  });

  const handleDelete = (number: AdminPurchasedNumber) => {
    if (window.confirm(`Delete number ${number.phoneNumber}? This cannot be undone.`)) {
      deleteMutation.mutate(number.id);
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading numbers..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load numbers." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Numbers"
        description="Manage purchased numbers"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by number, vendor order ID or user email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="WAITING">Waiting</option>
            <option value="ACTIVE">Active</option>
            <option value="RECEIVED">Received</option>
            <option value="EXPIRED">Expired</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No numbers found"
          icon={<Phone className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">OTPs</th>
                  <th className="px-4 py-3">Purchased</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((number) => (
                  <tr
                    key={number.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{number.phoneNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {number.product?.name ?? number.productId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {number.user?.fullName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {number.user?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={number.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {number.otpCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(number.purchasedAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNumber(number)}
                        >
                          Edit
                        </Button>
                        {number.status !== "DISABLED" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => disableMutation.mutate(number.id)}
                            isLoading={
                              disableMutation.isPending &&
                              disableMutation.variables === number.id
                            }
                            title="Disable number"
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span className="sr-only">Disable</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(number)}
                          isLoading={
                            deleteMutation.isPending &&
                            deleteMutation.variables === number.id
                          }
                          title="Delete number"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
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

      {editingNumber && (
        <NumberFormModal
          number={editingNumber}
          onClose={() => setEditingNumber(null)}
          onSuccess={() => {
            setEditingNumber(null);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}