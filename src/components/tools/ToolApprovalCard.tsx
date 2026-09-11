import { Button } from "@/components/ui/button.tsx";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolApprovalCardProps {
  /** Human-readable label shown in the card header, e.g. "Send Email" */
  label: string;
  /** Tool-specific detail content rendered in the body slot */
  children: ReactNode;
  onApprove: () => void;
  onDeny: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Generic approval chrome reused across all approval-required tools.
 * Renders the header, the tool-specific detail slot, and the Approve/Deny buttons.
 * Each tool only needs to supply a label and its own detail component as children.
 */
export function ToolApprovalCard({ label, children, onApprove, onDeny }: ToolApprovalCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Review and approve or deny this request</p>
      </div>

      <div className="space-y-2 text-sm">{children}</div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={onDeny}>
          Deny
        </Button>
        <Button size="sm" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </div>
  );
}
