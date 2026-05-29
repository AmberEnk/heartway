"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { SwipeDeck } from "@/components/discover/SwipeDeck";
import type { DiscoverProfile } from "@/components/discover/ProfileCard";
import { fetchApi } from "@/lib/fetch-api";

export default function DiscoverPage() {
  const t = useTranslations("discover");
  const router = useRouter();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [paused, setPaused] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchApi("/api/discover")
      .then((r) => r.json())
      .then((d) => {
        if (d.needsOnboarding) {
          setNeedsOnboarding(true);
          router.push("/onboarding");
          return;
        }
        setPaused(!!d.paused);
        setProfiles(d.profiles ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [router]);

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>
      {loading ? (
        <div className="py-16 text-center">
          <p className="text-[var(--muted)]">{t("loading")}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{t("loadingHint")}</p>
        </div>
      ) : paused ? (
        <p className="py-12 text-center text-[var(--muted)]">{t("paused")}</p>
      ) : needsOnboarding ? null : profiles.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted)]">{t("noMore")}</p>
      ) : (
        <SwipeDeck initialProfiles={profiles} onEmpty={load} />
      )}
    </AppShell>
  );
}
