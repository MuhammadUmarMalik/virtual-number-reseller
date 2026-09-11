"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  DollarSign,
  Package,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useCurrency } from "@/hooks/use-currency";
import { getAdminDashboard } from "@/services/dashboard.service";

export default function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  const { formatPrice } = useCurrency();

  if (query.isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load admin dashboard." />;
  }

  const data = query.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your business"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={data.totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Total Orders" value={data.totalOrders} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Pending Top-Ups" value={data.pendingTopups} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Pending Refunds" value={data.pendingRefunds} icon={<Receipt className="h-5 w-5" />} />
        <StatCard title="Total Deposits" value={formatPrice(data.totalDeposits)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Total Purchases" value={formatPrice(data.totalPurchases)} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Available Stock" value={data.availableStock} icon={<Package className="h-5 w-5" />} />
      </div>
    </div>
  );
}
