import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type Language, type ThemePreference } from "@important-dates/core";
import { SegmentedRadio } from "./fields";
import { useAppearance } from "../providers/AppearanceProvider";

export function LanguageSwitch({
  onChange,
  name = "language",
}: {
  onChange?: (language: Language) => void;
  name?: string;
}) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppearance();
  return (
    <SegmentedRadio<Language>
      name={name}
      value={language}
      options={SUPPORTED_LANGUAGES.map((value) => ({
        value,
        label: t(`settings.language.${value}`),
      }))}
      onChange={(next) => {
        setLanguage(next);
        onChange?.(next);
      }}
    />
  );
}

const THEMES: readonly ThemePreference[] = ["light", "dark", "system"];

export function ThemeSwitch({ onChange }: { onChange?: (theme: ThemePreference) => void }) {
  const { t } = useTranslation();
  const { theme, setTheme } = useAppearance();
  return (
    <SegmentedRadio<ThemePreference>
      name="theme"
      value={theme}
      options={THEMES.map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
      onChange={(next) => {
        setTheme(next);
        onChange?.(next);
      }}
    />
  );
}
