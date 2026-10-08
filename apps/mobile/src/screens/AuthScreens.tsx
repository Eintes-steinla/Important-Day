import { useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  signInSchema,
  signInWithEmail,
  signUpSchema,
  signUpWithEmail,
} from "@important-dates/core";
import { Button } from "../components/Button";
import { TextField, SegmentedControl } from "../components/fields";
import { Text } from "../components/Text";
import { errorMessage } from "../lib/errors";
import { fieldErrors } from "../lib/forms";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSupabase } from "../providers/SupabaseProvider";
import { SUPPORTED_LANGUAGES, type Language } from "@important-dates/core";

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppearance();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-5 py-10"
      >
        <Text accessibilityRole="header" weight="display" className="text-3xl leading-9">
          {title}
        </Text>
        <Text className="mt-2 text-muted">{t("app.tagline")}</Text>
        <View className="mt-8">{children}</View>
        <View className="mt-10">
          <SegmentedControl<Language>
            value={language}
            options={SUPPORTED_LANGUAGES.map((value) => ({
              value,
              label: t(`settings.language.${value}`),
            }))}
            onChange={setLanguage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function SignInScreen() {
  const { t } = useTranslation();
  const client = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setSubmitError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    try {
      // Thành công thì AuthProvider đổi trạng thái và router tự chuyển sang vùng đã đăng nhập
      await signInWithEmail(client, parsed.data);
    } catch (error) {
      setSubmitError(errorMessage(t, error));
      setBusy(false);
    }
  };

  return (
    <AuthLayout title={t("auth.signInTitle")}>
      <View className="gap-4">
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email ? t(errors.email) : undefined}
        />
        <TextField
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          error={errors.password ? t(errors.password) : undefined}
        />
        {submitError ? (
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {submitError}
          </Text>
        ) : null}
        <Button
          label={busy ? t("auth.signingIn") : t("auth.signIn")}
          loading={busy}
          onPress={() => void submit()}
        />
      </View>
      <View className="mt-6 flex-row flex-wrap items-center gap-1">
        <Text className="text-sm text-muted">{t("auth.noAccount")}</Text>
        <Link href="/sign-up" accessibilityRole="link">
          <Text weight="semibold" className="text-sm text-primary underline">
            {t("auth.signUp")}
          </Text>
        </Link>
      </View>
    </AuthLayout>
  );
}

export function SignUpScreen() {
  const { t } = useTranslation();
  const client = useSupabase();
  const { language } = useAppearance();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const submit = async () => {
    setSubmitError(null);
    const parsed = signUpSchema.safeParse({ displayName, email, password, language });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    try {
      const result = await signUpWithEmail(client, parsed.data);
      // Không cần xác nhận email: phiên đã có, router tự chuyển trang
      if (result.needsEmailConfirmation) setNeedsConfirmation(true);
    } catch (error) {
      setSubmitError(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthLayout title={t("auth.checkEmail")}>
        <Text className="text-muted">{t("auth.checkEmailHint")}</Text>
        <Link href="/sign-in" accessibilityRole="link" className="mt-6">
          <Text weight="semibold" className="text-primary underline">
            {t("auth.signIn")}
          </Text>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.signUpTitle")}>
      <View className="gap-4">
        <TextField
          label={t("auth.displayName")}
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          textContentType="name"
          error={errors.displayName ? t(errors.displayName) : undefined}
        />
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email ? t(errors.email) : undefined}
        />
        <TextField
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint={t("auth.passwordHint")}
          error={errors.password ? t(errors.password) : undefined}
        />
        {submitError ? (
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {submitError}
          </Text>
        ) : null}
        <Button
          label={busy ? t("auth.signingUp") : t("auth.signUp")}
          loading={busy}
          onPress={() => void submit()}
        />
      </View>
      <View className="mt-6 flex-row flex-wrap items-center gap-1">
        <Text className="text-sm text-muted">{t("auth.haveAccount")}</Text>
        <Link href="/sign-in" accessibilityRole="link">
          <Text weight="semibold" className="text-sm text-primary underline">
            {t("auth.signIn")}
          </Text>
        </Link>
      </View>
    </AuthLayout>
  );
}
