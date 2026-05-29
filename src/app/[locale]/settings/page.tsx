"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [isPaused, setIsPaused] = useState(false);
  const [womenMessageFirst, setWomenMessageFirst] = useState(false);
  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(40);
  const [maxDistanceKm, setMaxDistanceKm] = useState(50);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (!p) return;
        setIsPaused(p.isPaused);
        setWomenMessageFirst(p.womenMessageFirst);
        setMinAge(p.minAge);
        setMaxAge(p.maxAge);
        setMaxDistanceKm(p.maxDistanceKm);
      });
  }, []);

  async function save() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isPaused,
        discoverable: !isPaused,
        womenMessageFirst,
        minAge,
        maxAge,
        maxDistanceKm,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-semibold">{t("discovery")}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!isPaused} onChange={(e) => setIsPaused(!e.target.checked)} />
          {isPaused ? t("discoveryOff") : t("discoveryOn")}
        </label>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-semibold">{t("preferences")}</h2>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={womenMessageFirst}
            onChange={(e) => setWomenMessageFirst(e.target.checked)}
          />
          Women message first
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} />
          <Input type="number" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} />
        </div>
        <Input
          type="number"
          value={maxDistanceKm}
          onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
        />
      </section>

      <Button className="mt-6 w-full" onClick={save}>
        {saved ? t("saved") : t("title")}
      </Button>
    </AppShell>
  );
}
