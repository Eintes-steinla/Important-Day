import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-sm text-muted">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      {label ?? t("common.loading")}
    </div>
  );
}

export function ErrorState({ onRetry, detail }: { onRetry: () => void; detail?: string }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="py-8">
      <p className="font-display text-lg font-semibold">{t("errors.loadFailed")}</p>
      <p className="mt-1 text-sm text-muted">{detail ?? t("errors.loadFailedHint")}</p>
      <Button variant="subtle" onClick={onRetry} className="mt-4">
        {t("common.retry")}
      </Button>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-8">
      <p className="font-display text-lg font-semibold">{title}</p>
      {hint ? <p className="mt-1 max-w-md text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
