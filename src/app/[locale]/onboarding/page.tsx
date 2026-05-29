"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/app/actions/profile";
import { useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Gender } from "@/generated/prisma/browser";

type Prompt = { id: string; key: string };

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tg = useTranslations("onboarding.genders");
  const tp = useTranslations("prompts");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.PREFER_NOT_TO_SAY);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState<string[]>([""]);
  const [showMe, setShowMe] = useState<Gender[]>([Gender.FEMALE, Gender.MALE]);
  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(40);
  const [maxDistanceKm, setMaxDistanceKm] = useState(50);
  const [womenMessageFirst, setWomenMessageFirst] = useState(false);
  const [promptId, setPromptId] = useState("");
  const [promptAnswer, setPromptAnswer] = useState("");

  useEffect(() => {
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((d) => {
        setPrompts(d.prompts ?? []);
        if (d.prompts?.[0]) setPromptId(d.prompts[0].id);
      });
  }, []);

  function toggleShowMe(g: Gender) {
    setShowMe((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function finish() {
    if (!displayName.trim() || !birthDate) {
      setSubmitError("Please enter your name and birthday.");
      return;
    }
    if (showMe.length === 0) {
      setSubmitError("Please select at least one gender in “Show me”.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    const result = await completeOnboardingAction({
      displayName: displayName.trim(),
      birthDate,
      gender,
      bio: bio || undefined,
      city: city || undefined,
      showMeGenders: showMe,
      minAge,
      maxAge,
      maxDistanceKm,
      womenMessageFirst,
      photos: photos.filter(Boolean),
      promptAnswers: promptId && promptAnswer.trim() ? [{ promptId, answer: promptAnswer.trim() }] : [],
      isComplete: true,
    });

    setLoading(false);

    if (result.ok) {
      router.push("/discover");
      router.refresh();
      return;
    }

    if (result.error === "not_signed_in") {
      setSubmitError("Your session expired. Please log out and log in again, then retry.");
      return;
    }
    if (result.error === "validation") {
      setSubmitError("Please check your entries (birthday, photo URLs must start with https://).");
      return;
    }
    setSubmitError("Couldn't save your profile. Please try again.");
  }

  const steps = [t("stepBasics"), t("stepPhotos"), t("stepPrompts"), t("stepPreferences")];

  return (
    <AppShell showNav={false}>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="mt-2 flex gap-1">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded ${i <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
          />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {step === 0 && (
          <>
            <div>
              <label className="text-sm font-medium">{t("displayName")}</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("birthDate")}</label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("gender")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                {Object.values(Gender).map((g) => (
                  <option key={g} value={g}>
                    {tg(g)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("bio")}</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("city")}</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {photos.map((url, i) => (
              <div key={i}>
                <label className="text-sm font-medium">
                  {t("photoUrl")} {i + 1}
                </label>
                <Input
                  value={url}
                  onChange={(e) => {
                    const next = [...photos];
                    next[i] = e.target.value;
                    setPhotos(next);
                  }}
                  placeholder="https://..."
                />
              </div>
            ))}
            {photos.length < 6 && (
              <Button variant="secondary" type="button" onClick={() => setPhotos([...photos, ""])}>
                {t("addPhoto")}
              </Button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="text-sm font-medium">{t("selectPrompt")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
              >
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {tp(p.key as never)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("yourAnswer")}</label>
              <Textarea value={promptAnswer} onChange={(e) => setPromptAnswer(e.target.value)} rows={3} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm font-medium">{t("showMe")}</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(Gender).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleShowMe(g)}
                  className={`rounded-full px-3 py-1 text-sm border ${
                    showMe.includes(g)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {tg(g)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">{t("ageRange")} min</label>
                <Input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm">max</label>
                <Input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("maxDistance")}</label>
              <Input
                type="number"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={womenMessageFirst}
                onChange={(e) => setWomenMessageFirst(e.target.checked)}
                className="mt-1"
              />
              <span>
                {t("womenMessageFirst")}
                <span className="block text-[var(--muted)]">{t("womenMessageFirstHint")}</span>
              </span>
            </label>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button className="flex-1" disabled={loading} onClick={finish}>
            {t("complete")}
          </Button>
        )}
      </div>
      {submitError && <p className="mt-3 text-center text-sm text-red-600">{submitError}</p>}
    </AppShell>
  );
}
