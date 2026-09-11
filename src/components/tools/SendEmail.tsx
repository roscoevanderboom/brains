import { ToolApprovalCard } from "@/components/tools/ToolApprovalCard.tsx";
import { SendEmailDetail, type SendEmailInput } from "@/components/tools/SendEmailDetail.tsx";

// Re-export so importers can use SendEmailInput directly from this module.
export type { SendEmailInput };

export interface SendEmailProps extends SendEmailInput {
  onApprove: () => void;
  onDeny: () => void;
}

/**
 * Convenience wrapper that combines ToolApprovalCard with SendEmailDetail.
 * Useful when you want to render the full approval card in one import.
 */
export function SendEmail({ to, subject, body, onApprove, onDeny }: SendEmailProps) {
  return (
    <ToolApprovalCard label="Send Email" onApprove={onApprove} onDeny={onDeny}>
      <SendEmailDetail to={to} subject={subject} body={body} />
    </ToolApprovalCard>
  );
}
