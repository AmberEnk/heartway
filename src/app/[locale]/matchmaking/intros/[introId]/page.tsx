"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { getCountryName } from "@/lib/countries";
import { Button } from "@/components/ui/Button";

type IntroDetail = {
  id: string;
  introNote: string;
  status: string;
  myStatus: string;
  matchId: string | null;
  otherUser: {
    displayName: string;
    age: number;
    city: string | null;
    stateOrProvince: string | null;
    country: string | null;
    bio: string | null;
    photo: string | null;
    speaksMongolian: boolean | null;
    yearsInMongolia: number | null;
    whatYouWant: string | null;
    personalityNotes: string | null;
    lookingFor: string[];
  };
};

export default function IntroDetailPage() {
  const t = useTranslations("matchmaking.intro");
  const router = useRouter();
  const params = useParams();
  const introId = params.introId as string;
  const [intro, setIntro] = useState<IntroDetail | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    fetch(`/api/matchmaking/intros/${introId}`)
      .then((r) => r.json())
      .then((d) => setIntro(d.intro ?? null));
  }

  useEffect(() => {
    load();
  }, [introId]);

  async function respond(action: "accept" | "decline") {
    setLoading(true);
    const res = await fetch(`/api/matchmaking/intros/${introId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.matchId) {
      router.push(`/messages/${data.matchId}`);
      return;
    }
    if (action === "decline") {
      router.push("/matchmaking");
      return;
    }
    load();
  }

  if (!intro) {
    return (
      <AppShell>
        <p className="text-center text-[var(--muted)]">…</p>
      </AppShell>
    );
  }

  const pending = intro.myStatus === "PENDING" && intro.status === "AWAITING";
  const u = intro.otherUser;

  return (
    <AppShell showNav={false}>
      <Link href="/matchmaking" className="text-sm text-[var(--primary)]">
        {t("back")}
      </Link>

      <div className="mt-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
        <p className="text-xs font-medium uppercase text-[var(--primary)]">{t("fromMatchmaker")}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{intro.introNote}</p>
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {u.photo && (
          <div className="relative aspect-[4/3] w-full">
            <Image src={u.photo} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="p-4">
          <h1 className="text-xl font-bold">
            {u.displayName}, {u.age}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {[u.city, u.stateOrProvince, getCountryName(u.country)].filter(Boolean).join(", ")}
          </p>
          {u.speaksMongolian != null && (
            <p className="mt-2 text-sm">
              {u.speaksMongolian ? t("speaksMongolianYes") : t("speaksMongolianNo")}
              {u.yearsInMongolia != null &&
                ` · ${t("yearsInMongolia", { years: u.yearsInMongolia })}`}
            </p>
          )}
          {u.bio && <p className="mt-3 text-sm">{u.bio}</p>}
          {u.whatYouWant && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[var(--muted)]">{t("whatTheyWant")}</p>
              <p className="mt-1 text-sm">{u.whatYouWant}</p>
            </div>
          )}
          {u.personalityNotes && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[var(--muted)]">{t("personality")}</p>
              <p className="mt-1 text-sm">{u.personalityNotes}</p>
            </div>
          )}
        </div>
      </article>

      {pending ? (
        <div className="mt-6 flex flex-col gap-2">
          <Button disabled={loading} onClick={() => respond("accept")}>
            {t("accept")}
          </Button>
          <Button variant="ghost" disabled={loading} onClick={() => respond("decline")}>
            {t("decline")}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {intro.myStatus === "ACCEPTED" && intro.status === "AWAITING"
            ? t("waitingForOther")
            : intro.matchId
              ? t("mutualMatch")
              : t("declined")}
          {intro.matchId && (
            <Link href={`/messages/${intro.matchId}`} className="mt-2 block text-[var(--primary)]">
              {t("openChat")}
            </Link>
          )}
        </p>
      )}
    </AppShell>
  );
}
