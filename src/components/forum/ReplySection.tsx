"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
type Author = { id: string; displayName: string; isAdmin: boolean };

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
};

export function ReplySection({
  topicId,
  initialReplies,
  isLocked,
  canModerate = false,
}: {
  topicId: string;
  initialReplies: Reply[];
  isLocked: boolean;
  canModerate?: boolean;
}) {
  const t = useTranslations("forum");
  const { data: session } = useSession();
  const [replies, setReplies] = useState(initialReplies);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userId = session?.user?.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/forum/${topicId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("replyError"));
      return;
    }
    setReplies((prev) => [...prev, data.reply]);
    setBody("");
  }

  async function removeReply(replyId: string) {
    if (!confirm(t("deleteReplyConfirm"))) return;
    const res = await fetch(`/api/forum/replies/${replyId}`, { method: "DELETE" });
    if (res.ok) setReplies((prev) => prev.filter((r) => r.id !== replyId));
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {t("replies", { count: replies.length })}
      </h2>

      <ul className="mt-4 space-y-3">
        {replies.map((reply) => (
          <li
            key={reply.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">{reply.author.displayName}</span>
                {reply.author.isAdmin && (
                  <span className="ml-2 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                    {t("adminBadge")}
                  </span>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm">{reply.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {format(new Date(reply.createdAt), "PPp")}
                </p>
              </div>
              {(canModerate || userId === reply.author.id) && (
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => removeReply(reply.id)}
                >
                  {t("delete")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isLocked ? (
        <p className="mt-6 text-center text-sm text-[var(--muted)]">{t("locked")}</p>
      ) : !session ? (
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--primary)]">
            {t("loginToReply")}
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("replyPlaceholder")}
            rows={4}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("posting") : t("postReply")}
          </Button>
        </form>
      )}
    </section>
  );
}
