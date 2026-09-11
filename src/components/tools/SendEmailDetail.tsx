// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the email fields (To, Subject, Body) for display inside a ToolApprovalCard.
 * No buttons or approval logic — purely presentational.
 */
export function SendEmailDetail({ to, subject, body }: SendEmailInput) {
  return (
    <>
      <div className="flex gap-2">
        <span className="text-muted-foreground w-16">To:</span>
        <span className="font-mono">{to}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-muted-foreground w-16">Subject:</span>
        <span>{subject}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-muted-foreground w-16">Body:</span>
        <span className="text-muted-foreground line-clamp-2">{body}</span>
      </div>
    </>
  );
}
