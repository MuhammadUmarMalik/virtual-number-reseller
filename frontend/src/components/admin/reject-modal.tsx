"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

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
    <Modal title="Reject" onClose={onClose}>
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
    </Modal>
  );
}
