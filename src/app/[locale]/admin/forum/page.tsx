"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { format } from "date-fns";

type Topic = {
  id: string;
  title: string;
  locale: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  createdAt: string;
  author: { displayName: string };
};

export default function AdminForumPage() {
  const t = useTranslations("adminForum");
  const admin = useTranslations("admin");
  const [topics, setTopics] = useState<Topic[]>([]);

  function load() {
    Promise.all(
      (["en", "mn", "mn-Inner"] as const).map((locale) =>
        fetch(`/api/forum?locale=${locale}`).then((r) => r.json())
      )
    ).then((results) => {
      const merged = results.flatMap((d) => d.topics ?? []) as Topic[];
      merged.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTopics(merged);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, data: { isPinned?: boolean; isLocked?: boolean }) {
    await fetch(`/api/forum/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/forum/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AppShell showNav={false}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/admin/blog" className="text-sm text-[var(--primary)]">
          {admin("title")}
        </Link>
      </div>

      <ul className="space-y-2">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/forum/${topic.id}`} className="font-medium text-[var(--primary)]">
                  [{topic.locale}] {topic.title}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {topic.author.displayName} · {topic.replyCount} replies ·{" "}
                  {format(new Date(topic.createdAt), "PP")}
                  {topic.isPinned ? " · pinned" : ""}
                  {topic.isLocked ? " · locked" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="text-xs text-[var(--primary)]"
                  onClick={() => patch(topic.id, { isPinned: !topic.isPinned })}
                >
                  {topic.isPinned ? t("unpin") : t("pin")}
                </button>
                <button
                  type="button"
                  className="text-xs text-[var(--primary)]"
                  onClick={() => patch(topic.id, { isLocked: !topic.isLocked })}
                >
                  {topic.isLocked ? t("unlock") : t("lock")}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => remove(topic.id)}
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
