"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

interface RejectModalProps {
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}

export function RejectModal({ onClose, onReject }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(reason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Reject</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <FormField
            label="Reason"
            type="text"
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="danger"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!reason.trim()}
            onClick={() => void submit()}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
