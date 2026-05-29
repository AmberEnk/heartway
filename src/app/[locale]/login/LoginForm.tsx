"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/discover";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password: normalizedPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("invalidCredentialsHint"));
      return;
    }

    if (!result?.ok) {
      setError(t("sessionFailed"));
      return;
    }

    // Full page load so the new session cookie is picked up reliably
    let path = callbackUrl;
    if (path.startsWith("http")) {
      try {
        path = new URL(path).pathname;
      } catch {
        path = "/discover";
      }
    }
    if (!path.startsWith(`/${locale}`) && !path.match(/^\/(en|mn)/)) {
      path = `/${locale}${path.startsWith("/") ? path : `/discover`}`;
    }
    window.location.href = path;
  }

  return (
    <AppShell showNav={false}>
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{t("email")}</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("password")}</label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-[var(--muted)]">{t("noVerificationEmail")}</p>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("loggingIn") : t("loginButton")}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm">
        <Link href="/forgot-password" className="text-[var(--primary)]">
          {t("forgotPassword")}
        </Link>
      </p>
      <p className="mt-4 text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-[var(--primary)]">
          {t("signupButton")}
        </Link>
      </p>
    </AppShell>
  );
}
