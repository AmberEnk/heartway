"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage(t("resetSuccess"));
      return;
    }

    if (res.status === 404) {
      setError(t("resetNotFound"));
      return;
    }
    setError(t("resetFailed"));
  }

  return (
    <AppShell showNav={false}>
      <h1 className="text-2xl font-bold">{t("resetTitle")}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("resetSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{t("email")}</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("newPassword")}</label>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">{t("passwordHint")}</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {t("resetButton")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="font-semibold text-[var(--primary)]">
          {t("loginButton")}
        </Link>
      </p>
    </AppShell>
  );
}
