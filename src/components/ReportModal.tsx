"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const reasons = [
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "SPAM",
  "FAKE_PROFILE",
  "UNDERAGE",
  "OTHER",
] as const;

export function ReportModal({
  reportedId,
  messageId,
  onClose,
}: {
  reportedId: string;
  messageId?: string;
  onClose: () => void;
}) {
  const t = useTranslations("report");
  const [reason, setReason] = useState<(typeof reasons)[number]>("HARASSMENT");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedId, reason, details, messageId }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-xl">
        <h3 className="text-lg font-bold">{t("title")}</h3>
        {done ? (
          <p className="mt-4 text-sm text-green-600">{t("success")}</p>
        ) : (
          <>
            <label className="mt-4 block text-sm font-medium">{t("reason")}</label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof reasons)[number])}
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-medium">{t("details")}</label>
            <Textarea className="mt-1" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {!done && (
            <Button className="flex-1" disabled={loading} onClick={submit}>
              {t("submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
