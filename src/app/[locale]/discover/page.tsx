"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { MATCHMAKING_CONFIG } from "@/lib/matchmaking-config";
import { SwipeDeck } from "@/components/discover/SwipeDeck";
import type { DiscoverProfile } from "@/components/discover/ProfileCard";
import { fetchApi } from "@/lib/fetch-api";
import { useRouter } from "@/i18n/navigation";

export default function DiscoverPage() {
  const t = useTranslations("discover");
  const tm = useTranslations("matchmaking");
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
    if (!MATCHMAKING_CONFIG.discoverEnabled) {
      setLoading(false);
      return;
    }
    load();
  }, [router]);

  if (!MATCHMAKING_CONFIG.discoverEnabled) {
    return (
      <AppShell>
        <h1 className="mb-2 text-xl font-bold">{tm("title")}</h1>
        <p className="text-sm text-[var(--muted)]">{tm("swipeLater")}</p>
        <Link href="/matchmaking" className="mt-6 block">
          <Button className="w-full">{tm("title")}</Button>
        </Link>
      </AppShell>
    );
  }

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
