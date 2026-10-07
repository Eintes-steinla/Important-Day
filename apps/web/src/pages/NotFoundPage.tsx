import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-bold">{t("notFound.title")}</h1>
      <Link
        to="/"
        className="mt-4 inline-block font-semibold text-primary underline underline-offset-2"
      >
        {t("notFound.back")}
      </Link>
    </div>
  );
}
