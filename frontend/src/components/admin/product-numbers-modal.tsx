"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProductNumbers } from "@/services/admin.service";
import { Hash } from "lucide-react";

interface ProductNumbersModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function ProductNumbersModal({
  productId,
  productName,
  onClose,
}: ProductNumbersModalProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const query = useQuery({
    queryKey: ["admin", "products", productId, "numbers", page, search, status],
    queryFn: () =>
      getProductNumbers(productId, {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal title={`Numbers · ${productName}`} onClose={onClose} maxWidth="2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Label htmlFor="pn-search" className="sr-only">
            Search
          </Label>
          <Input
            id="pn-search"
            placeholder="Search number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Label htmlFor="pn-status" className="sr-only">
            Status
          </Label>
          <Select
            id="pn-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="DISABLED">Disabled</option>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>

        {query.isLoading ? (
          <LoadingState label="Loading numbers..." variant="table" rows={4} />
        ) : query.isError || !query.data ? (
          <ErrorState message="Unable to load numbers." />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            icon={<Hash className="h-6 w-6" />}
            title="No numbers"
            description="This product has no imported numbers yet."
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">OTPs</th>
                    <th className="px-4 py-3">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((number) => (
                    <tr
                      key={number.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {number.number}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={number.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {number.purchasedNumber?.user
                          ? number.purchasedNumber.user.fullName ||
                            number.purchasedNumber.user.email
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {number.purchasedNumber?.otpCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(number.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={query.data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </Modal>
  );
}