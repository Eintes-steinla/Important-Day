import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  signInSchema,
  signInWithEmail,
  signUpSchema,
  signUpWithEmail,
  type SignInInput,
  type SignUpFormInput,
  type SignUpInput,
} from "@important-dates/core";
import { Button } from "../components/Button";
import { TextField } from "../components/fields";
import { LanguageSwitch } from "../components/Switches";
import { errorMessage } from "../lib/errors";
import { useAppearance } from "../providers/AppearanceProvider";
import { useSupabase } from "../providers/SupabaseProvider";

function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
      <p className="mt-2 text-muted">{t("app.tagline")}</p>
      <div className="mt-8">{children}</div>
      <div className="mt-10">
        <LanguageSwitch name="auth-language" />
      </div>
    </div>
  );
}

export function SignInPage() {
  const { t } = useTranslation();
  const client = useSupabase();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }, unknown, SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onValid = async (values: SignInInput) => {
    setSubmitError(null);
    try {
      await signInWithEmail(client, values);
      void navigate("/", { replace: true });
    } catch (error) {
      setSubmitError(errorMessage(t, error));
    }
  };

  return (
    <AuthLayout title={t("auth.signInTitle")}>
      <form onSubmit={(e) => void handleSubmit(onValid)(e)} noValidate className="space-y-4">
        <TextField
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register("email")}
        />
        <TextField
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message ? t(errors.password.message) : undefined}
          {...register("password")}
        />
        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link to="/signup" className="font-semibold text-primary underline underline-offset-2">
          {t("auth.signUp")}
        </Link>
      </p>
    </AuthLayout>
  );
}

export function SignUpPage() {
  const { t } = useTranslation();
  const client = useSupabase();
  const navigate = useNavigate();
  const { language } = useAppearance();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormInput, unknown, SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onValid = async (values: SignUpInput) => {
    setSubmitError(null);
    try {
      const result = await signUpWithEmail(client, { ...values, language });
      if (result.needsEmailConfirmation) setNeedsConfirmation(true);
      else void navigate("/", { replace: true });
    } catch (error) {
      setSubmitError(errorMessage(t, error));
    }
  };

  if (needsConfirmation) {
    return (
      <AuthLayout title={t("auth.checkEmail")}>
        <p className="text-muted">{t("auth.checkEmailHint")}</p>
        <Link
          to="/signin"
          className="mt-6 inline-block font-semibold text-primary underline underline-offset-2"
        >
          {t("auth.signIn")}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.signUpTitle")}>
      <form onSubmit={(e) => void handleSubmit(onValid)(e)} noValidate className="space-y-4">
        <TextField
          label={t("auth.displayName")}
          autoComplete="name"
          error={errors.displayName?.message ? t(errors.displayName.message) : undefined}
          {...register("displayName")}
        />
        <TextField
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register("email")}
        />
        <TextField
          label={t("auth.password")}
          type="password"
          autoComplete="new-password"
          hint={t("auth.passwordHint")}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          {...register("password")}
        />
        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.signingUp") : t("auth.signUp")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link to="/signin" className="font-semibold text-primary underline underline-offset-2">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
