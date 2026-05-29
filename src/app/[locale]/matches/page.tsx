"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";

type MatchItem = {
  id: string;
  otherUser: {
    id: string;
    displayName?: string;
    age?: number | null;
    photo?: string | null;
  };
  lastMessage?: { body: string } | null;
};

export default function MatchesPage() {
  const t = useTranslations("matches");
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
  }, []);

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>
      {matches.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted)]">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/messages/${m.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[var(--border)]">
                  {m.otherUser.photo && (
                    <Image
                      src={m.otherUser.photo}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {m.otherUser.displayName}
                    {m.otherUser.age != null ? `, ${m.otherUser.age}` : ""}
                  </p>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {m.lastMessage?.body ?? t("messageThem")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
