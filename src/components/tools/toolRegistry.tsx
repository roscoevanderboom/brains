import type { ReactNode } from "react";
import { ToolApprovalCard } from "@/components/tools/ToolApprovalCard.tsx";
import { Weather, type WeatherProps } from "@/components/tools/Weather.tsx";
import { SendEmailDetail, type SendEmailInput } from "@/components/tools/SendEmailDetail.tsx";
import {
  JSXPreview,
  JSXPreviewContent,
  JSXPreviewError,
} from "@/components/ai-elements/jsx-preview.tsx";

// ─── Registry shape ───────────────────────────────────────────────────────────

/**
 * Describes how a single tool's parts are rendered across all of their states.
 *
 * - `pending`  — tool call is in-flight (input received, not yet done)
 * - `approval` — user must approve/deny before execution (approval-required tools only)
 * - `responded`— approval was already given/denied (shows status text)
 * - `output`   — tool completed successfully
 * - `error`    — tool threw an error
 * - `denied`   — tool was denied (approval-required tools only)
 *
 * All renderers receive `part` typed as `unknown` — cast to the tool's known
 * input/output shape inside each renderer.
 */
interface ToolRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pending?: (part: any) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approval?: (part: any, onApprove: () => void, onDeny: () => void) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responded?: (part: any) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: (part: any) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: (part: any) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  denied?: (part: any) => ReactNode;
}

// ─── Tool registry ────────────────────────────────────────────────────────────

/**
 * Maps `part.type` → renderer definitions.
 * To add a new tool:
 *   1. Add its detail component under src/components/tools/
 *   2. Add an entry here with the matching "tool-<name>" key
 */
const toolRegistry: Record<string, ToolRenderer> = {
  "tool-displayWeather": {
    pending: () => (
      <p className="text-sm italic text-muted-foreground">Fetching weather…</p>
    ),
    output: (part) => <Weather {...(part.output as WeatherProps)} />,
    error: (part) => (
      <p className="text-sm text-destructive">Weather unavailable: {part.errorText}</p>
    ),
  },

  "tool-sendEmail": {
    pending: () => (
      <p className="text-sm italic text-muted-foreground">Preparing email request…</p>
    ),
    approval: (part, onApprove, onDeny) => {
      if (part.approval.isAutomatic) {
        return (
          <p className="text-sm italic text-muted-foreground">Checking approval for email…</p>
        );
      }
      const input = part.input as SendEmailInput;
      return (
        <ToolApprovalCard label="Send Email" onApprove={onApprove} onDeny={onDeny}>
          <SendEmailDetail to={input.to} subject={input.subject} body={input.body} />
        </ToolApprovalCard>
      );
    },
    responded: (part) => (
      <p className="text-sm text-muted-foreground">
        Email request {part.approval.approved ? "approved" : "denied"}.
        {part.approval.reason ? ` Reason: ${part.approval.reason}` : ""}
      </p>
    ),
    output: (part) => (
      <p className="text-sm text-green-600">
        {(part.output as { success: boolean; message: string }).message}
      </p>
    ),
    error: (part) => (
      <p className="text-sm text-destructive">Email failed: {part.errorText}</p>
    ),
    denied: () => (
      <p className="text-sm text-muted-foreground">Email request denied.</p>
    ),
  },

  "tool-scratchPad": {
    pending: () => (
      <p className="text-sm italic text-muted-foreground">Generating UI…</p>
    ),
    output: (part) => {
      const { jsx } = part.output as { jsx: string };
      return (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
          <JSXPreview jsx={jsx} className="w-full">
            <JSXPreviewContent
              blacklistedAttrs={[/^on[a-z]/]}
              autoCloseVoidElements
            />
            <JSXPreviewError />
          </JSXPreview>
        </div>
      );
    },
    error: (part) => (
      <p className="text-sm text-destructive">scratchPad error: {part.errorText}</p>
    ),
  },
};

// ─── Render helper ────────────────────────────────────────────────────────────

/**
 * Resolves the correct renderer for a given message part and returns the
 * appropriate ReactNode. Returns null for unknown tools or states.
 */
export function renderToolPart(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  part: any,
  onApprove: () => void,
  onDeny: () => void,
): ReactNode {
  const renderer = toolRegistry[part.type as string];
  if (!renderer) return null;

  switch (part.state) {
    case "input-available":
      return renderer.pending?.(part) ?? null;
    case "approval-requested":
      return renderer.approval?.(part, onApprove, onDeny) ?? null;
    case "approval-responded":
      return renderer.responded?.(part) ?? null;
    case "output-available":
      return renderer.output?.(part) ?? null;
    case "output-error":
      return renderer.error?.(part) ?? null;
    case "output-denied":
      return renderer.denied?.(part) ?? null;
    default:
      return null;
  }
}
