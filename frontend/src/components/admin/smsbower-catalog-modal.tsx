"use client";

import { useEffect, useDeferredValue, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import {
  getSmsBowerBalance,
  getSmsBowerCountries,
  getSmsBowerServices,
  getSmsBowerStock,
  type SmsBowerCountry,
  type SmsBowerService,
  type SmsBowerStockItem,
} from "@/services/admin.service";
import { createProduct, type CreateProductPayload } from "@/services/admin.service";

interface SmsBowerCatalogModalProps {
  onClose: () => void;
  onProductCreated: () => void;
}

type TierSortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "stock-desc"
  | "stock-asc"
  | "provider-asc"
  | "provider-desc";

let slugCounter = 0;
function generateSlug(service: string, country: string): string {
  slugCounter += 1;
  const clean = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${clean(service)}-${clean(country)}-${slugCounter}`;
}

export function SmsBowerCatalogModal({
  onClose,
  onProductCreated,
}: SmsBowerCatalogModalProps) {
  const [services, setServices] = useState<SmsBowerService[]>([]);
  const [countries, setCountries] = useState<SmsBowerCountry[]>([]);
  const [stock, setStock] = useState<SmsBowerStockItem[]>([]);
  const [balance, setBalance] = useState<string>("—");
  const [initialLoading, setInitialLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [margin, setMargin] = useState(1.5);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortKey, setSortKey] = useState<TierSortKey>("default");

  const deferredService = useDeferredValue(selectedService);
  const deferredCountry = useDeferredValue(selectedCountry);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [servicesRes, countriesRes, balanceRes] = await Promise.all([
          getSmsBowerServices().catch((e) => {
            toast.error(e instanceof ApiError ? e.message : "Failed to load services");
            return [] as SmsBowerService[];
          }),
          getSmsBowerCountries().catch((e) => {
            toast.error(
              e instanceof ApiError ? e.message : "Failed to load countries"
            );
            return [] as SmsBowerCountry[];
          }),
          getSmsBowerBalance().catch(() => ({ balance: "—", currency: "USD" })),
        ]);
        if (cancelled) return;
        setServices(servicesRes);
        setCountries(countriesRes);
        setBalance(`${balanceRes.balance} ${balanceRes.currency}`);
      } catch {
        if (!cancelled) toast.error("Failed to load SMSBower catalog");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!deferredService || !deferredCountry) return;
    let cancelled = false;

    async function loadStock() {
      setStockLoading(true);
      try {
        const result = await getSmsBowerStock({
          service: deferredService,
          country: deferredCountry,
        });
        if (!cancelled) {
          setStock(result);
          setSelectedProviderId(null);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : "Failed to load stock";
          toast.error(message);
          setStock([]);
          setSelectedProviderId(null);
        }
      } finally {
        if (!cancelled) setStockLoading(false);
      }
    }

    void loadStock();
    return () => {
      cancelled = true;
    };
  }, [deferredService, deferredCountry, refreshKey]);

  const availableTiers = stock.filter((item) => item.count > 0 && item.price > 0);
  const sortedTiers = useMemo(() => {
    const tiers = [...availableTiers];
    switch (sortKey) {
      case "price-asc":
        tiers.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        tiers.sort((a, b) => b.price - a.price);
        break;
      case "stock-desc":
        tiers.sort((a, b) => b.count - a.count);
        break;
      case "stock-asc":
        tiers.sort((a, b) => a.count - b.count);
        break;
      case "provider-asc":
        tiers.sort((a, b) => a.providerId - b.providerId);
        break;
      case "provider-desc":
        tiers.sort((a, b) => b.providerId - a.providerId);
        break;
      default:
        break;
    }
    return tiers;
  }, [availableTiers, sortKey]);
  const hasStock = availableTiers.length > 0;

  const selectedTier = (() => {
    if (availableTiers.length === 0) return null;
    if (selectedProviderId != null) {
      const exact = availableTiers.find((item) => item.providerId === selectedProviderId);
      if (exact) return exact;
    }
    return availableTiers.find(
      (item) => item.price === Math.min(...availableTiers.map((t) => t.price))
    ) ?? availableTiers[0];
  })();

  const singleTier = availableTiers.length === 1;
  const activeTier = selectedTier;
  const computedPrice =
    activeTier != null ? Math.round(activeTier.price * margin * 100) / 100 : null;

  const serviceName =
    services.find((s) => s.code === selectedService)?.name ?? selectedService;

  const handleRefresh = () => {
    if (!deferredService || !deferredCountry) return;
    setRefreshKey((k) => k + 1);
  };

  const handleCreateProduct = async () => {
    if (!selectedService || !selectedCountry || !activeTier) return;

    const { reference } = { reference: activeTier };
    const slug = generateSlug(reference.service, reference.country);
    setCreating(true);
    try {
      const payload: CreateProductPayload = {
        name: `${serviceName} (${reference.country}) - Provider ${reference.providerId}`,
        slug,
        country: reference.country,
        countryCode: reference.countryId,
        service: reference.service,
        numberType: "mobile",
        vendor: "SMSBOWER",
        vendorCountryId: reference.countryId,
        vendorProviderId: String(reference.providerId),
        vendorCost: reference.price,
        marginMultiplier: margin,
        sellingPrice: computedPrice ?? Math.max(reference.price, 0.01),
        availableStock: reference.count,
        refundWindowHours: 3,
        serialMode: "SINGLE",
        status: reference.count > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      };

      await createProduct(payload);
      toast.success(
        reference.count > 0
          ? "Product created from SMSBower catalog"
          : "Product created (no stock — marked Out of Stock)"
      );
      onProductCreated();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to create product";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal title="SMSBower Catalog" onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pick a service and country, select a provider tier, then set your margin.
          </p>
          <p className="text-sm font-medium">
            Balance: <span className="text-green-600">{balance}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="picker-service">
              Service
            </label>
            <Select
              id="picker-service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              disabled={initialLoading}
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="picker-country">
              Country
            </label>
            <Select
              id="picker-country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={initialLoading}
            >
              <option value="">Select a country…</option>
              {countries
                .filter((c) => c.id != null)
                .map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>
        </div>

        {!selectedService || !selectedCountry ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Select both a service and a country to see live provider tiers.
          </div>
        ) : stockLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading stock...
            </span>
          </div>
        ) : !hasStock ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No stock found for this service/country combo. Try another.
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Provider Tiers ({availableTiers.length})
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as TierSortKey)}
                    className="h-8 w-auto px-2 text-xs"
                    aria-label="Sort provider tiers"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: low → high</option>
                    <option value="price-desc">Price: high → low</option>
                    <option value="stock-desc">Stock: high → low</option>
                    <option value="stock-asc">Stock: low → high</option>
                    <option value="provider-asc">Provider ID: asc</option>
                    <option value="provider-desc">Provider ID: desc</option>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={stockLoading}
                    title="Re-check live stock"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${stockLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
              {!singleTier && (
                <p className="text-xs text-muted-foreground">
                  Select the provider tier you want to sell. Margin applies only to
                  the selected tier.
                </p>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {singleTier ? "Tier" : "Select"}
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Provider ID
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Vendor Price
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTiers.map((tier) => {
                    const checked =
                      selectedTier != null && selectedTier.providerId === tier.providerId;
                    return (
                      <tr
                        key={tier.providerId}
                        onClick={() => setSelectedProviderId(tier.providerId)}
                        className={`cursor-pointer border-t border-border transition-colors ${
                          checked ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="px-3 py-2">
                          {singleTier ? (
                            <span className="text-xs text-muted-foreground">Only tier</span>
                          ) : (
                            <input
                              type="radio"
                              name="provider-tier"
                              checked={checked}
                              onChange={() => setSelectedProviderId(tier.providerId)}
                              className="accent-primary"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">{tier.providerId}</td>
                        <td className="px-3 py-2">${tier.price.toFixed(3)}</td>
                        <td className="px-3 py-2">{tier.count.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Selected Tier Stock</p>
                <p className="text-lg font-semibold text-green-600">
                  {activeTier?.count.toLocaleString() ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Vendor Price</p>
                <p className="text-lg font-semibold">
                  ${activeTier?.price.toFixed(3) ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-lg font-semibold">
                  {computedPrice != null ? `$${computedPrice.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="picker-margin">
                Margin (×)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="picker-margin"
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min="1"
                  value={margin}
                  onChange={(e) =>
                    setMargin(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="text-sm text-muted-foreground">
                  {activeTier != null
                    ? `${activeTier.price.toFixed(3)} × ${margin} = $${computedPrice?.toFixed(2)}`
                    : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Selling price is computed from the selected provider tier × margin.
              </p>
            </div>

            <Button
              className="w-full"
              isLoading={creating}
              onClick={handleCreateProduct}
            >
              Create Product (Provider {activeTier?.providerId})
            </Button>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Prices are in USD. The selected provider&apos;s price and stock are saved to
          the product, and future stock syncs + purchases are pinned to that provider.
        </p>
      </div>
    </Modal>
  );
}
