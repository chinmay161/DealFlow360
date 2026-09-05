"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { quotationService } from "@/services/quotation.service";
import { useToast } from "@/components/providers/ToastProvider";

interface TransitionActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  quotationNumber: string;
  currentState: string;
  onSuccess: () => void;
}

export function TransitionActionModal({
  open,
  onOpenChange,
  quotationId,
  quotationNumber,
  currentState,
  onSuccess,
}: TransitionActionModalProps) {
  const toast = useToast();
  const [targetState, setTargetState] = useState("PENDING_APPROVAL");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const availableStates = [
    { label: "Submit for Approval (Pending)", value: "PENDING_APPROVAL" },
    { label: "Approve Quotation", value: "APPROVED" },
    { label: "Reject Quotation", value: "REJECTED" },
    { label: "Return for Revision", value: "RETURNED_FOR_REVISION" },
    { label: "Revert to Draft", value: "DRAFT" },
  ];

  const handleTransition = async () => {
    try {
      setIsLoading(true);
      await quotationService.transitionQuotation(quotationId, {
        targetState,
        reason: reason || `Transitioned to ${targetState} via State Machine UI`,
      });
      toast.success(
        "State transitioned",
        `Quotation #${quotationNumber} transitioned to ${targetState}`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Transition failed", err?.message || "Invalid state transition");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Transition Quotation State</DialogTitle>
          <DialogDescription>
            Execute state machine lifecycle transition for #{quotationNumber}. Current state:{" "}
            <strong>{currentState}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Select Target State
            </label>
            <select
              value={targetState}
              onChange={(e) => setTargetState(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {availableStates.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Transition Reason / Audit Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for this state change..."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleTransition}
            isLoading={isLoading}
          >
            Execute Transition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
