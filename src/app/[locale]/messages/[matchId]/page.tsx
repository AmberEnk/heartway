"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReportModal } from "@/components/ReportModal";

type Message = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

type OtherUser = {
  id: string;
  displayName: string;
  photo: string | null;
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const t = useTranslations("messages");
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [body, setBody] = useState("");
  const [canSend, setCanSend] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = session?.user?.id;

  function load() {
    fetch(`/api/messages?matchId=${matchId}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setCanSend(d.canSend ?? true);
        if (d.otherUser) setOtherUser(d.otherUser);
      });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!body.trim() || !canSend) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, body }),
    });
    if (res.ok) {
      setBody("");
      load();
    }
  }

  return (
    <AppShell>
      <div className="mb-3 flex items-center gap-3 border-b border-[var(--border)] pb-3">
        <Link href="/messages" className="text-sm text-[var(--primary)] shrink-0">
          ←
        </Link>
        {otherUser?.photo && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image src={otherUser.photo} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherUser?.displayName ?? "…"}</p>
        </div>
        {otherUser && (
          <button
            type="button"
            className="shrink-0 text-xs text-[var(--muted)] underline"
            onClick={() => setShowReport(true)}
          >
            {t("report")}
          </button>
        )}
      </div>

      <div className="flex min-h-[55vh] max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">{t("placeholder")}</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === myId;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                isMine
                  ? "ml-auto bg-[var(--primary)] text-white rounded-br-md"
                  : "mr-auto bg-[var(--background)] rounded-bl-md"
              }`}
            >
              {m.body}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!canSend && (
        <p className="mt-2 text-center text-sm text-[var(--muted)]">{t("unlockHint")}</p>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          placeholder={t("placeholder")}
          value={body}
          disabled={!canSend}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button disabled={!canSend} onClick={send}>
          {t("send")}
        </Button>
      </div>

      {showReport && otherUser && (
        <ReportModal reportedId={otherUser.id} onClose={() => setShowReport(false)} />
      )}
    </AppShell>
  );
}
