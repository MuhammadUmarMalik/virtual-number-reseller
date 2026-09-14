"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, CheckCircle2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  importProduct,
  importProductPreview,
} from "@/services/admin.service";
import type { ImportPreviewResult, ImportResult } from "@/services/admin.service";
import { ProductNumbersModal } from "@/components/admin/product-numbers-modal";

const importMetaSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  country: z.string().trim().min(2, "Country is required"),
  countryCode: z
    .string()
    .trim()
    .regex(/^\+\d{1,14}$/, "Use a dial code such as +1 or +92"),
  service: z.string().trim().min(1, "Service is required"),
  numberType: z.string().trim().min(1, "Product type is required"),
  description: z.string().trim().max(1000).optional(),
  sellingPrice: z.coerce.number().positive("Price must be greater than zero"),
  currency: z.string().trim().toUpperCase().length(3, "3-letter code"),
  refundWindowHours: z.coerce.number().int().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]),
});

// z.coerce.number() fields accept "unknown" as input, so the form runs on the
// schema's input type while submissions/resolver produce the output type.
type ImportMetaInput = z.input<typeof importMetaSchema>;
type ImportMetaValues = z.output<typeof importMetaSchema>;

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

interface ProductImportModalProps {
  onClose: () => void;
  onProductCreated: () => void;
}

export function ProductImportModal({
  onClose,
  onProductCreated,
}: ProductImportModalProps) {
  const [step, setStep] = useState(0); // 0 = details, 1 = upload, 2 = preview, 3 = done
  const [meta, setMeta] = useState<ImportMetaValues | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ImportMetaInput, unknown, ImportMetaValues>({
    resolver: zodResolver(importMetaSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      country: "",
      countryCode: "+1",
      service: "",
      numberType: "",
      description: "",
      sellingPrice: 0,
      currency: "USD",
      refundWindowHours: 3,
      status: "ACTIVE",
    },
  });

  const downloadTemplate = () => {
    const csv = "number,endpoint\n+12025550123,https://example.com/otp\n";
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-numbers-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    const lower = selected.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      toast.error("Only .csv, .xlsx and .xls files are allowed");
      return;
    }
    setFile(selected);
    setPreview(null);
    setServerError(null);
  };

  const submitDetails: SubmitHandler<ImportMetaValues> = (values) => {
    setMeta(values);
    setStep(1);
  };

  const runPreview = async () => {
    if (!file || !meta) {
      toast.error("Choose a spreadsheet file first");
      return;
    }
    setPreviewing(true);
    setServerError(null);
    try {
      const result = await importProductPreview(meta, file);
      setPreview(result);
      setStep(2);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to validate file";
      setServerError(message);
      toast.error(message);
    } finally {
      setPreviewing(false);
    }
  };

  const confirmImport = async () => {
    if (!file || !meta) return;
    setImporting(true);
    setServerError(null);
    try {
      const result = await importProduct(meta, file);
      setImportResult(result);
      setStep(3);
      toast.success("Product imported");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to import file";
      setServerError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const closeAll = () => {
    setShowNumbers(false);
    onProductCreated();
    onClose();
  };

  return (
    <>
      <Modal
        title="Add Product"
        onClose={onClose}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className={step === 0 ? "text-primary" : ""}>1. Product Info</span>
            <span>/</span>
            <span className={step === 1 || step === 2 ? "text-primary" : ""}>
              2. Upload & Validate
            </span>
            <span>/</span>
            <span className={step === 3 ? "text-primary" : ""}>3. Confirm</span>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              {serverError}
            </div>
          )}

          {step === 0 && (
            <form
              onSubmit={handleSubmit(submitDetails)}
              className="space-y-4"
              noValidate
            >
              <FormField
                label="Product Name"
                type="text"
                placeholder="e.g. WhatsApp OTP - V2"
                error={errors.name?.message}
                {...register("name")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  label="Country"
                  type="text"
                  placeholder="United States"
                  error={errors.country?.message}
                  {...register("country")}
                />
                <FormField
                  label="Country Code"
                  type="text"
                  placeholder="+1"
                  error={errors.countryCode?.message}
                  {...register("countryCode")}
                />
                <FormField
                  label="Number Type"
                  type="text"
                  placeholder="Virtual, Random"
                  error={errors.numberType?.message}
                  {...register("numberType")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Service"
                  type="text"
                  placeholder="WhatsApp"
                  error={errors.service?.message}
                  {...register("service")}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Selling Price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    error={errors.sellingPrice?.message}
                    {...register("sellingPrice")}
                  />
                  <FormField
                    label="Currency"
                    type="text"
                    placeholder="USD"
                    error={errors.currency?.message}
                    {...register("currency")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Refund Window (hrs)"
                  type="number"
                  inputMode="numeric"
                  error={errors.refundWindowHours?.message}
                  {...register("refundWindowHours")}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="import-status">Status</Label>
                  <Select id="import-status" {...register("status")}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </Select>
                </div>
              </div>
              <FormField
                label="Description"
                type="text"
                placeholder="Optional"
                error={errors.description?.message}
                {...register("description")}
              />
              <Button type="submit" className="w-full" disabled={!isValid}>
                Continue to Upload
              </Button>
            </form>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Upload CSV, XLSX or XLS
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Columns: number, endpoint
                    </span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Numbers must be international (e.g. +12025551234) and match
                  the country code. Endpoints must be HTTPS URLs.
                </span>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Download template
                </button>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  isLoading={previewing}
                  disabled={!file}
                  onClick={() => void runPreview()}
                >
                  Upload & Preview
                </Button>
              </div>
            </div>
          )}

          {step === 2 && preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Total Rows" value={preview.totalRows} tone="default" />
                <Metric label="Valid" value={preview.validCount} tone="success" />
                <Metric label="Invalid" value={preview.invalidCount} tone="danger" />
                <Metric label="Duplicates" value={preview.duplicateCount} tone="warning" />
              </div>

              {preview.invalidCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                  {preview.invalidCount} invalid / duplicate row
                  {preview.invalidCount === 1 ? "" : "s"} will be skipped on
                  import.
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview • first {preview.validRows.length} valid numbers
                </div>
                <ul className="max-h-40 divide-y divide-border overflow-y-auto">
                  {preview.validRows.map((row) => (
                    <li
                      key={row.row}
                      className="flex items-center gap-3 px-3 py-1.5 font-mono text-sm"
                    >
                      <span className="w-10 text-xs text-muted-foreground">
                        #{row.row}
                      </span>
                      {row.number}
                    </li>
                  ))}
                  {preview.validRows.length === 0 && (
                    <li className="px-3 py-3 text-sm text-muted-foreground">
                      No valid rows to import.
                    </li>
                  )}
                </ul>
              </div>

              {preview.invalidRows.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Invalid rows • first {preview.invalidRows.length}
                  </div>
                  <ul className="max-h-40 divide-y divide-border overflow-y-auto">
                    {preview.invalidRows.map((row) => (
                      <li key={row.row} className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-10 text-xs text-muted-foreground">
                            #{row.row}
                          </span>
                          <span className="font-mono">{row.number}</span>
                        </div>
                        <ul className="ml-12 mt-1 space-y-0.5">
                          {row.errors.map((error) => (
                            <li
                              key={error}
                              className="text-xs text-red-600 dark:text-red-400"
                            >
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Change File
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  isLoading={importing}
                  disabled={preview.validCount === 0}
                  onClick={() => void confirmImport()}
                >
                  Confirm Import {preview.validCount} Numbers
                </Button>
              </div>
            </div>
          )}

          {step === 3 && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Product imported successfully
                  </p>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                    {importResult.product.name}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Imported" value={importResult.imported} tone="success" />
                <Metric label="Duplicates" value={importResult.duplicates} tone="warning" />
                <Metric label="Invalid" value={importResult.invalid} tone="danger" />
                <Metric label="Total Rows" value={importResult.total} tone="default" />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNumbers(true)}
                >
                  View Numbers
                </Button>
                <Button type="button" className="flex-1" onClick={closeAll}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {showNumbers && importResult && (
        <ProductNumbersModal
          productId={importResult.product.id}
          productName={importResult.product.name}
          onClose={() => setShowNumbers(false)}
        />
      )}
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-600 dark:text-red-400"
        : tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

