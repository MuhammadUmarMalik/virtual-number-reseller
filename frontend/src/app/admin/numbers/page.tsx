"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Power,
  Search,
  Trash2,
  RefreshCw,
  XCircle,
  RotateCw,
  Info,
} from "lucide-react";
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
import { NumberDetailModal } from "@/components/admin/number-detail-modal";
import { ApiError } from "@/lib/api-client";
import {
  deleteAdminNumber,
  getAdminNumbers,
  updateAdminNumber,
  refreshAdminNumberStatus,
  cancelAdminNumber,
  retryAdminNumber,
  type AdminPurchasedNumber,
} from "@/services/admin.service";

export default function AdminNumbersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [service, setService] = useState("");
  const [activationStatus, setActivationStatus] = useState("");
  const [editingNumber, setEditingNumber] = useState<AdminPurchasedNumber | null>(null);
  const [detailNumber, setDetailNumber] = useState<AdminPurchasedNumber | null>(null);

  const query = useQuery({
    queryKey: ["admin", "numbers", page, status, search, country, service, activationStatus],
    queryFn: () =>
      getAdminNumbers({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined,
        country: country || undefined,
        service: service || undefined,
        activationStatus: activationStatus || undefined,
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

  const refreshMutation = useMutation({
    mutationFn: (numberId: string) => refreshAdminNumberStatus(numberId),
    onSuccess: (updated) => {
      toast.success(`Status updated to ${updated.status}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "numbers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to refresh status"
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (numberId: string) => cancelAdminNumber(numberId),
    onSuccess: () => {
      toast.success("Number cancelled");
      void queryClient.invalidateQueries({ queryKey: ["admin", "numbers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to cancel number"
      );
    },
  });

  const retryMutation = useMutation({
    mutationFn: (numberId: string) => retryAdminNumber(numberId),
    onSuccess: () => {
      toast.success("Retry requested");
      void queryClient.invalidateQueries({ queryKey: ["admin", "numbers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to retry"
      );
    },
  });

  const handleDelete = (number: AdminPurchasedNumber) => {
    if (window.confirm(`Delete number ${number.phoneNumber}? This cannot be undone.`)) {
      deleteMutation.mutate(number.id);
    }
  };

  const handleCancel = (number: AdminPurchasedNumber) => {
    if (window.confirm(`Cancel activation for ${number.phoneNumber}?`)) {
      cancelMutation.mutate(number.id);
    }
  };

  const isSmsbower = (n: AdminPurchasedNumber) => !!n.vendorActivationId;

  const resetFilters = () => {
    setStatus("");
    setSearch("");
    setCountry("");
    setService("");
    setActivationStatus("");
    setPage(1);
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
      <PageHeader title="Numbers" description="Manage purchased numbers" />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-50 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search number, user email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="WAITING">Waiting</option>
            <option value="ACTIVE">Active</option>
            <option value="RECEIVED">Received</option>
            <option value="EXPIRED">Expired</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
        <div className="w-full sm:w-36">
          <Input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-36">
          <Input
            type="text"
            placeholder="Service"
            value={service}
            onChange={(e) => { setService(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={activationStatus}
            onChange={(e) => { setActivationStatus(e.target.value); setPage(1); }}
          >
            <option value="">All activation statuses</option>
            <option value="STATUS_WAIT_CODE">Waiting for code</option>
            <option value="STATUS_WAIT_RETRY">Waiting retry</option>
            <option value="STATUS_OK">Completed</option>
            <option value="STATUS_CANCEL">Cancelled</option>
          </Select>
        </div>
        {(status || country || service || activationStatus || search) && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {data.items.length === 0 ? (
        <EmptyState title="No numbers found" icon={<Phone className="h-6 w-6" />} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Activation</th>
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
                      <p className="font-medium text-foreground">{number.user?.fullName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{number.user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{number.country ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{number.service ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={number.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {number.activationStatus
                        ? number.activationStatus.replace("STATUS_", "").replace("_", " ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{number.otpCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(number.purchasedAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailNumber(number)}
                          title="View details"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        {isSmsbower(number) &&
                          !["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(
                            number.status
                          ) && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => refreshMutation.mutate(number.id)}
                                isLoading={refreshMutation.isPending && refreshMutation.variables === number.id}
                                title="Refresh status"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(number)}
                                isLoading={cancelMutation.isPending && cancelMutation.variables === number.id}
                                title="Cancel activation"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => retryMutation.mutate(number.id)}
                                isLoading={retryMutation.isPending && retryMutation.variables === number.id}
                                title="Request another code"
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNumber(number)}
                          title="Edit"
                        >
                          Edit
                        </Button>
                        {number.status !== "DISABLED" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => disableMutation.mutate(number.id)}
                            isLoading={disableMutation.isPending && disableMutation.variables === number.id}
                            title="Disable"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(number)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables === number.id}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
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

      {detailNumber && (
        <NumberDetailModal
          number={detailNumber}
          onClose={() => setDetailNumber(null)}
        />
      )}
    </div>
  );
}
