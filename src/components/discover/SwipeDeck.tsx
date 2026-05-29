"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Star, X } from "lucide-react";
import { ProfileCard, type DiscoverProfile } from "./ProfileCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReportModal } from "@/components/ReportModal";

export function SwipeDeck({
  initialProfiles,
  onEmpty,
}: {
  initialProfiles: DiscoverProfile[];
  onEmpty?: () => void;
}) {
  const t = useTranslations("discover");
  const [profiles, setProfiles] = useState(initialProfiles);
  const [current, setCurrent] = useState(0);
  const [comment, setComment] = useState("");
  const [matchBanner, setMatchBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const profile = profiles[current];

  async function swipe(action: "PASS" | "LIKE" | "SUPER_LIKE") {
    if (!profile || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swipedId: profile.userId,
          action,
          comment: comment || undefined,
        }),
      });
      const data = await res.json();
      if (data.matched) setMatchBanner(true);
      setComment("");
      const next = current + 1;
      if (next >= profiles.length) {
        onEmpty?.();
      }
      setCurrent(next);
      if (!data.matched) setMatchBanner(false);
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <p className="py-16 text-center text-[var(--muted)]">{t("noMore")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {matchBanner && (
        <div className="rounded-2xl bg-[var(--primary)] p-4 text-center text-white">
          <p className="text-lg font-bold">{t("itsAMatch")}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => setMatchBanner(false)}>
              {t("keepSwiping")}
            </Button>
          </div>
        </div>
      )}

      <ProfileCard profile={profile} />

      <Input
        placeholder={t("commentPlaceholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => swipe("PASS")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 shadow"
          aria-label={t("pass")}
        >
          <X className="h-7 w-7" />
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => swipe("SUPER_LIKE")}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-blue-500 shadow"
          aria-label={t("superLike")}
        >
          <Star className="h-6 w-6 fill-current" />
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => swipe("LIKE")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary)] text-white shadow"
          aria-label={t("like")}
        >
          <Heart className="h-7 w-7 fill-current" />
        </button>
      </div>

      <button
        type="button"
        className="w-full text-center text-sm text-[var(--muted)] underline"
        onClick={() => setShowReport(true)}
      >
        Report
      </button>

      {showReport && (
        <ReportModal
          reportedId={profile.userId}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
