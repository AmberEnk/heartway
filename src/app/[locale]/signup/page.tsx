"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error === "emailTaken" ? t("emailTaken") : t("invalidCredentials"));
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    router.push("/onboarding");
  }

  return (
    <AppShell showNav={false}>
      <h1 className="text-2xl font-bold">{t("signupTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{t("name")}</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">{t("email")}</label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">{t("password")}</label>
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
        <p className="text-xs text-[var(--muted)]">{t("noVerificationEmail")}</p>
        <Button type="submit" className="w-full" disabled={loading}>
          {t("signupButton")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)]">
          {t("loginButton")}
        </Link>
      </p>
    </AppShell>
  );
}
