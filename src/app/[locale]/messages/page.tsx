"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";

type MatchItem = {
  id: string;
  otherUser: { displayName?: string };
  lastMessage?: { body: string } | null;
};

export default function MessagesPage() {
  const t = useTranslations("messages");
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
                className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="font-semibold">{m.otherUser.displayName}</p>
                <p className="text-sm text-[var(--muted)]">
                  {m.lastMessage?.body ?? "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
