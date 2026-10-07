import { useTranslation } from "react-i18next";

/** Hiện khi thiếu hoặc sai cấu hình Supabase, thay vì một trang trắng. */
export function SetupPage({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{t("setup.title")}</h1>
      <p className="mt-3 text-muted">{t("setup.body")}</p>
      <ol className="mt-6 list-decimal space-y-2 pl-5">
        <li>{t("setup.step1")}</li>
        <li>{t("setup.step2")}</li>
        <li>{t("setup.step3")}</li>
      </ol>
      <p role="alert" className="mt-6 rounded-lg bg-surface-muted p-3 text-sm text-danger">
        {message}
      </p>
    </div>
  );
}
