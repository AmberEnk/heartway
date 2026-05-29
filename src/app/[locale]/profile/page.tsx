"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const nav = useTranslations("nav");
  const [profile, setProfile] = useState<{
    displayName: string;
    birthDate: string;
    bio?: string;
    photos: { url: string }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  if (!profile) {
    return (
      <AppShell>
        <p className="text-center text-[var(--muted)]">…</p>
      </AppShell>
    );
  }

  const age =
    new Date().getFullYear() - new Date(profile.birthDate).getFullYear();

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        {profile.photos[0] && (
          <div className="relative aspect-square w-full">
            <Image
              src={profile.photos[0].url}
              alt={profile.displayName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="p-4">
          <h2 className="text-xl font-bold">
            {profile.displayName}
          </h2>
          <p className="text-[var(--muted)]">{t("yearsOld", { age })}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Link href="/onboarding">
          <Button variant="secondary" className="w-full">
            {t("edit")}
          </Button>
        </Link>
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
          {nav("logout")}
        </Button>
      </div>
    </AppShell>
  );
}
