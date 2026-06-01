"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

type QueueMember = {
  userId: string;
  email: string | null;
  status: string;
  profile: { displayName: string; age: number; gender: string; bio: string | null };
  intake: {
    city: string | null;
    country: string | null;
    countryName?: string;
    stateOrProvince: string | null;
    lookingFor: string[];
    matchScope: string;
    openToLongDistance: boolean;
    willingToRelocate: string;
    yearsInMongolia: number | null;
    dealbreakers: string[];
    customDealbreakers: string[];
    avoidBehaviors: string[];
    partnerMustHaves: string[];
    whatYouWant: string | null;
    personalityNotes: string | null;
    lifestyleNotes: string | null;
    speaksMongolian: boolean | null;
    partnerMinAge: number | null;
    partnerMaxAge: number | null;
  };
};

type IntroRow = {
  id: string;
  status: string;
  introNote: string;
  userAStatus: string;
  userBStatus: string;
  userA: { id: string; name?: string };
  userB: { id: string; name?: string };
};

export default function AdminMatchmakingPage() {
  const t = useTranslations("adminMatchmaking");
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [intros, setIntros] = useState<IntroRow[]>([]);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [introNote, setIntroNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/matchmaking")
      .then((r) => r.json())
      .then((d) => {
        setQueue(d.queue ?? []);
        setIntros(d.intros ?? []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const memberA = queue.find((q) => q.userId === selectedA);
  const memberB = queue.find((q) => q.userId === selectedB);

  async function createIntro() {
    if (!selectedA || !selectedB || !introNote.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/matchmaking/intro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAId: selectedA, userBId: selectedB, introNote }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("createError"));
      return;
    }
    setIntroNote("");
    setSelectedA(null);
    setSelectedB(null);
    load();
  }

  function MemberCard({
    member,
    selected,
    onSelect,
    slot,
  }: {
    member: QueueMember;
    selected: boolean;
    onSelect: () => void;
    slot: "A" | "B";
  }) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-xl border p-3 text-left text-sm transition-colors",
          selected
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--border)] bg-[var(--surface)]"
        )}
      >
        <span className="text-xs text-[var(--muted)]">{slot}</span>
        <p className="font-semibold">
          {member.profile.displayName}, {member.profile.age}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {[member.intake.city, member.intake.stateOrProvince, member.intake.country]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p className="mt-1 text-xs">{member.status}</p>
      </button>
    );
  }

  function DetailPanel({ member }: { member: QueueMember }) {
    const i = member.intake;
    return (
      <div className="space-y-2 text-xs">
        <p>
          <strong>{t("lookingFor")}:</strong> {i.lookingFor.join(", ")}
        </p>
        <p>
          <strong>{t("location")}:</strong>{" "}
          {[i.city, i.stateOrProvince, member.intake.countryName ?? i.country]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>
          <strong>{t("yearsInMongolia")}:</strong> {i.yearsInMongolia ?? "—"}
        </p>
        <p>
          <strong>{t("mobility")}:</strong> {i.matchScope}, LDR: {i.openToLongDistance ? "yes" : "no"},{" "}
          relocate: {i.willingToRelocate}
        </p>
        <p>
          <strong>{t("dealbreakers")}:</strong>{" "}
          {[...i.dealbreakers, ...(i.customDealbreakers ?? [])].join(", ") || "—"}
        </p>
        <p>
          <strong>{t("partnerAge")}:</strong> {i.partnerMinAge}–{i.partnerMaxAge}
        </p>
        <p>
          <strong>{t("avoid")}:</strong> {i.avoidBehaviors.join(", ") || "—"}
        </p>
        <p>
          <strong>{t("mustHaves")}:</strong> {i.partnerMustHaves.join(", ") || "—"}
        </p>
        <p className="whitespace-pre-wrap">
          <strong>{t("whatTheyWant")}:</strong> {i.whatYouWant}
        </p>
        {i.personalityNotes && (
          <p className="whitespace-pre-wrap">
            <strong>{t("personality")}:</strong> {i.personalityNotes}
          </p>
        )}
        {i.lifestyleNotes && (
          <p className="whitespace-pre-wrap">
            <strong>{t("lifestyle")}:</strong> {i.lifestyleNotes}
          </p>
        )}
      </div>
    );
  }

  return (
    <AppShell showNav={false}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/admin" className="text-sm text-[var(--primary)]">
          Admin
        </Link>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">{t("queueTitle", { count: queue.length })}</h2>
        <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
          {queue.map((m) => (
            <MemberCard
              key={m.userId}
              member={m}
              slot={selectedA === m.userId ? "A" : selectedB === m.userId ? "B" : "A"}
              selected={selectedA === m.userId || selectedB === m.userId}
              onSelect={() => {
                if (selectedA === m.userId) setSelectedA(null);
                else if (selectedB === m.userId) setSelectedB(null);
                else if (!selectedA) setSelectedA(m.userId);
                else if (!selectedB && m.userId !== selectedA) setSelectedB(m.userId);
                else setSelectedA(m.userId);
              }}
            />
          ))}
        </div>
      </section>

      {memberA && memberB && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="mb-2 font-medium">{memberA.profile.displayName}</p>
            <DetailPanel member={memberA} />
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="mb-2 font-medium">{memberB.profile.displayName}</p>
            <DetailPanel member={memberB} />
          </div>
        </section>
      )}

      {selectedA && selectedB && (
        <section className="mb-8 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-semibold">{t("createIntro")}</h2>
          <Textarea
            rows={4}
            value={introNote}
            onChange={(e) => setIntroNote(e.target.value)}
            placeholder={t("introNotePlaceholder")}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button disabled={loading || introNote.length < 10} onClick={createIntro}>
            {loading ? t("sending") : t("sendIntro")}
          </Button>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">{t("recentIntros")}</h2>
        <ul className="space-y-2 text-sm">
          {intros.map((i) => (
            <li key={i.id} className="rounded-xl border border-[var(--border)] p-3">
              <p className="font-medium">
                {i.userA.name} ↔ {i.userB.name}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {i.status} · A: {i.userAStatus} · B: {i.userBStatus}
              </p>
              <p className="mt-1 line-clamp-2 text-xs">{i.introNote}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
