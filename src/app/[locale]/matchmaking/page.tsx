"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Clock, Heart, Sparkles } from "lucide-react";

type Status = {
  launchCity: string;
  discoverEnabled: boolean;
  profileComplete: boolean;
  intake: { status: string; completedAt: string | null; city: string | null } | null;
  pendingIntros: {
    id: string;
    introNote: string;
    otherUser: {
      displayName: string;
      age: number;
      city: string | null;
      photo: string | null;
    };
  }[];
  queueCount: number;
};

export default function MatchmakingHubPage() {
  const t = useTranslations("matchmaking");
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/matchmaking/status")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profileComplete) {
          router.push("/onboarding");
          return;
        }
        if (!d.intake?.completedAt) {
          router.push("/matchmaking/intake");
          return;
        }
        setStatus(d);
      });
  }, [router]);

  if (!status) {
    return (
      <AppShell>
        <p className="text-center text-[var(--muted)]">{t("loading")}</p>
      </AppShell>
    );
  }

  const inQueue = ["IN_QUEUE", "REVIEWING"].includes(status.intake?.status ?? "");

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-[var(--muted)]">{t("subtitle", { city: status.launchCity })}</p>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-[var(--primary)]" />
          <div>
            <h2 className="font-semibold">
              {inQueue ? t("statusInQueue") : t(`status.${status.intake?.status}` as never)}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {inQueue ? t("queueHint", { count: status.queueCount }) : t("statusHint")}
            </p>
            {status.intake?.city && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {t("yourCity", { city: status.intake.city })}
              </p>
            )}
          </div>
        </div>
        <Link href="/matchmaking/intake" className="mt-4 block">
          <Button variant="secondary" className="w-full text-sm">
            {t("editIntake")}
          </Button>
        </Link>
      </section>

      {status.pendingIntros.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Heart className="h-5 w-5 text-[var(--primary)]" />
            {t("pendingIntros")}
          </h2>
          <ul className="space-y-3">
            {status.pendingIntros.map((intro) => (
              <li key={intro.id}>
                <Link
                  href={`/matchmaking/intros/${intro.id}`}
                  className="block rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface)] p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
                    {t("newIntroBadge")}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[var(--border)]">
                      {intro.otherUser.photo && (
                        <Image
                          src={intro.otherUser.photo}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {intro.otherUser.displayName}, {intro.otherUser.age}
                      </p>
                      {intro.otherUser.city && (
                        <p className="text-sm text-[var(--muted)]">{intro.otherUser.city}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{intro.introNote}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--primary)]">{t("viewIntro")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!status.discoverEnabled && (
        <p className="mt-6 text-center text-xs text-[var(--muted)]">{t("swipeLater")}</p>
      )}
    </AppShell>
  );
}
