"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Gender, LookingFor, MatchScope, RelocateWillingness } from "@/generated/prisma/browser";
import { saveMatchmakingIntakeAction } from "@/app/actions/matchmaking";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  AVOID_BEHAVIOR_KEYS,
  DEALBREAKER_KEYS,
  MATCHMAKING_CONFIG,
  PARTNER_MUST_HAVE_KEYS,
  type AvoidBehaviorKey,
  type DealbreakerKey,
  type PartnerMustHaveKey,
} from "@/lib/matchmaking-config";

type IntakeData = {
  lookingFor: LookingFor[];
  country: string;
  stateOrProvince: string;
  city: string;
  yearsInMongolia: number;
  speaksMongolian: boolean;
  introvertLevel: number;
  matchScope: MatchScope;
  openToLongDistance: boolean;
  willingToRelocate: RelocateWillingness;
  partnerMinAge: number;
  partnerMaxAge: number;
  partnerGenders: Gender[];
  dealbreakers: DealbreakerKey[];
  customDealbreakers: string[];
  avoidBehaviors: AvoidBehaviorKey[];
  partnerMustHaves: PartnerMustHaveKey[];
  personalityNotes: string;
  lifestyleNotes: string;
  whatYouWant: string;
  anythingElse: string;
};

const defaultData: IntakeData = {
  lookingFor: [LookingFor.RELATIONSHIP],
  country: "US",
  stateOrProvince: "California",
  city: MATCHMAKING_CONFIG.launchCity,
  yearsInMongolia: 0,
  speaksMongolian: true,
  introvertLevel: 3,
  matchScope: MatchScope.INTERNATIONAL,
  openToLongDistance: true,
  willingToRelocate: RelocateWillingness.MAYBE,
  partnerMinAge: 25,
  partnerMaxAge: 40,
  partnerGenders: [Gender.MALE, Gender.FEMALE],
  dealbreakers: [],
  customDealbreakers: [],
  avoidBehaviors: [],
  partnerMustHaves: [],
  personalityNotes: "",
  lifestyleNotes: "",
  whatYouWant: "",
  anythingElse: "",
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function IntakeForm() {
  const t = useTranslations("matchmaking.intake");
  const tg = useTranslations("onboarding.genders");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(defaultData);
  const [otherDealbreakersEnabled, setOtherDealbreakersEnabled] = useState(false);
  const [customDealbreakersText, setCustomDealbreakersText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/matchmaking/intake")
      .then((r) => r.json())
      .then((d) => {
        if (!d.intake) return;
        const i = d.intake;
        const custom: string[] = i.customDealbreakers ?? [];
        setData({
          lookingFor: i.lookingFor?.length ? i.lookingFor : defaultData.lookingFor,
          country: i.country?.length === 2 ? i.country.toUpperCase() : defaultData.country,
          stateOrProvince: i.stateOrProvince ?? defaultData.stateOrProvince,
          city: i.city ?? defaultData.city,
          yearsInMongolia: i.yearsInMongolia ?? i.yearsInNorthAmerica ?? 0,
          speaksMongolian: i.speaksMongolian ?? true,
          introvertLevel: i.introvertLevel ?? 3,
          matchScope:
            i.matchScope === "US_OR_CANADA" ? MatchScope.INTERNATIONAL : (i.matchScope ?? MatchScope.INTERNATIONAL),
          openToLongDistance: i.openToLongDistance ?? false,
          willingToRelocate: i.willingToRelocate ?? RelocateWillingness.NO,
          partnerMinAge: i.partnerMinAge ?? 25,
          partnerMaxAge: i.partnerMaxAge ?? 40,
          partnerGenders: i.partnerGenders?.length ? i.partnerGenders : defaultData.partnerGenders,
          dealbreakers: (i.dealbreakers ?? []) as DealbreakerKey[],
          customDealbreakers: custom,
          avoidBehaviors: (i.avoidBehaviors ?? []) as AvoidBehaviorKey[],
          partnerMustHaves: (i.partnerMustHaves ?? []) as PartnerMustHaveKey[],
          personalityNotes: i.personalityNotes ?? "",
          lifestyleNotes: i.lifestyleNotes ?? "",
          whatYouWant: i.whatYouWant ?? "",
          anythingElse: i.anythingElse ?? "",
        });
        if (custom.length > 0) {
          setOtherDealbreakersEnabled(true);
          setCustomDealbreakersText(custom.join("\n"));
        }
      });
  }, []);

  const steps = [
    t("stepLookingFor"),
    t("stepLocation"),
    t("stepAboutYou"),
    t("stepPartner"),
    t("stepMobility"),
    t("stepDealbreakers"),
    t("stepFinal"),
  ];

  function parseCustomDealbreakers(): string[] {
    return customDealbreakersText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 2)
      .slice(0, 10);
  }

  async function submit() {
    setLoading(true);
    setError("");
    const customDealbreakers = otherDealbreakersEnabled ? parseCustomDealbreakers() : [];
    const result = await saveMatchmakingIntakeAction({
      ...data,
      customDealbreakers,
      submitToQueue: true,
    });
    setLoading(false);
    if (result.ok) {
      router.push("/matchmaking");
      router.refresh();
      return;
    }
    if (result.error === "profile_incomplete") {
      router.push("/onboarding");
      return;
    }
    setError(t("submitError"));
  }

  function CheckboxGroup<K extends string>({
    keys,
    selected,
    onChange,
    labelPrefix,
  }: {
    keys: readonly K[];
    selected: K[];
    onChange: (next: K[]) => void;
    labelPrefix: string;
  }) {
    return (
      <div className="flex flex-col gap-2">
        {keys.map((key) => (
          <label key={key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={selected.includes(key)}
              onChange={() => onChange(toggle(selected, key))}
            />
            <span>{t(`${labelPrefix}.${key}` as never)}</span>
          </label>
        ))}
      </div>
    );
  }

  const priorityCountries = COUNTRY_OPTIONS.filter((c) => c.priority);
  const otherCountries = COUNTRY_OPTIONS.filter((c) => !c.priority);

  return (
    <div>
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <div className="mt-4 flex gap-1">
        {steps.map((label, i) => (
          <div
            key={label}
            title={label}
            className={`h-1 flex-1 rounded ${i <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
          />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {step === 0 && (
          <>
            <p className="text-sm font-medium">{t("lookingForLabel")}</p>
            <div className="flex flex-col gap-2">
              {Object.values(LookingFor).map((lf) => (
                <label key={lf} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={data.lookingFor.includes(lf)}
                    onChange={() =>
                      setData({ ...data, lookingFor: toggle(data.lookingFor, lf) })
                    }
                  />
                  {t(`lookingFor.${lf}` as never)}
                </label>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm font-medium text-[var(--primary)]">{t("currentLocationLabel")}</p>
            <div>
              <label className="text-sm font-medium">{t("country")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
                value={data.country}
                onChange={(e) => setData({ ...data, country: e.target.value })}
              >
                <optgroup label={t("priorityCountries")}>
                  {priorityCountries.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t("allCountries")}>
                  {otherCountries.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("stateOrProvince")}</label>
              <Input
                value={data.stateOrProvince}
                onChange={(e) => setData({ ...data, stateOrProvince: e.target.value })}
                placeholder={t("statePlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("city")}</label>
              <Input
                value={data.city}
                onChange={(e) => setData({ ...data, city: e.target.value })}
                placeholder={t("cityPlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("yearsInMongolia")}</label>
              <Input
                type="number"
                min={0}
                max={80}
                value={data.yearsInMongolia}
                onChange={(e) =>
                  setData({ ...data, yearsInMongolia: Number(e.target.value) })
                }
              />
              <p className="mt-1 text-xs text-[var(--muted)]">{t("yearsInMongoliaHint")}</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.speaksMongolian}
                onChange={(e) => setData({ ...data, speaksMongolian: e.target.checked })}
              />
              {t("speaksMongolian")}
            </label>
            <div>
              <label className="text-sm font-medium">{t("introvertLevel")}</label>
              <input
                type="range"
                min={1}
                max={5}
                value={data.introvertLevel}
                onChange={(e) =>
                  setData({ ...data, introvertLevel: Number(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs text-[var(--muted)]">
                {t("introvertScale", { level: data.introvertLevel })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{t("personalityNotes")}</label>
              <Textarea
                rows={3}
                value={data.personalityNotes}
                onChange={(e) => setData({ ...data, personalityNotes: e.target.value })}
                placeholder={t("personalityPlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("lifestyleNotes")}</label>
              <Textarea
                rows={3}
                value={data.lifestyleNotes}
                onChange={(e) => setData({ ...data, lifestyleNotes: e.target.value })}
                placeholder={t("lifestylePlaceholder")}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">{t("partnerMinAge")}</label>
                <Input
                  type="number"
                  value={data.partnerMinAge}
                  onChange={(e) =>
                    setData({ ...data, partnerMinAge: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-sm">{t("partnerMaxAge")}</label>
                <Input
                  type="number"
                  value={data.partnerMaxAge}
                  onChange={(e) =>
                    setData({ ...data, partnerMaxAge: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <p className="text-sm font-medium">{t("partnerGenders")}</p>
            <div className="flex flex-wrap gap-2">
              {[Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.OTHER].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setData({ ...data, partnerGenders: toggle(data.partnerGenders, g) })
                  }
                  className={`rounded-full px-3 py-1 text-sm border ${
                    data.partnerGenders.includes(g)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {tg(g)}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <label className="text-sm font-medium">{t("matchScope")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
                value={data.matchScope}
                onChange={(e) =>
                  setData({ ...data, matchScope: e.target.value as MatchScope })
                }
              >
                {Object.values(MatchScope).map((s) => (
                  <option key={s} value={s}>
                    {t(`matchScopeOptions.${s}` as never)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={data.openToLongDistance}
                onChange={(e) => setData({ ...data, openToLongDistance: e.target.checked })}
              />
              <span>{t("openToLongDistance")}</span>
            </label>
            <div>
              <label className="text-sm font-medium">{t("willingToRelocate")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] p-2"
                value={data.willingToRelocate}
                onChange={(e) =>
                  setData({
                    ...data,
                    willingToRelocate: e.target.value as RelocateWillingness,
                  })
                }
              >
                {Object.values(RelocateWillingness).map((w) => (
                  <option key={w} value={w}>
                    {t(`relocateOptions.${w}` as never)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <p className="text-sm font-medium">{t("dealbreakersLabel")}</p>
              <CheckboxGroup
                keys={DEALBREAKER_KEYS}
                selected={data.dealbreakers}
                onChange={(dealbreakers) => setData({ ...data, dealbreakers })}
                labelPrefix="dealbreakers"
              />
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={otherDealbreakersEnabled}
                  onChange={(e) => setOtherDealbreakersEnabled(e.target.checked)}
                />
                <span>{t("dealbreakersOther")}</span>
              </label>
              {otherDealbreakersEnabled && (
                <Textarea
                  className="mt-2"
                  rows={4}
                  value={customDealbreakersText}
                  onChange={(e) => setCustomDealbreakersText(e.target.value)}
                  placeholder={t("customDealbreakersPlaceholder")}
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{t("avoidBehaviorsLabel")}</p>
              <CheckboxGroup
                keys={AVOID_BEHAVIOR_KEYS}
                selected={data.avoidBehaviors}
                onChange={(avoidBehaviors) => setData({ ...data, avoidBehaviors })}
                labelPrefix="avoidBehaviors"
              />
            </div>
            <div>
              <p className="text-sm font-medium">{t("mustHavesLabel")}</p>
              <CheckboxGroup
                keys={PARTNER_MUST_HAVE_KEYS}
                selected={data.partnerMustHaves}
                onChange={(partnerMustHaves) => setData({ ...data, partnerMustHaves })}
                labelPrefix="mustHaves"
              />
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div>
              <label className="text-sm font-medium">{t("whatYouWant")}</label>
              <Textarea
                rows={5}
                required
                minLength={20}
                value={data.whatYouWant}
                onChange={(e) => setData({ ...data, whatYouWant: e.target.value })}
                placeholder={t("whatYouWantPlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("anythingElse")}</label>
              <Textarea
                rows={3}
                value={data.anythingElse}
                onChange={(e) => setData({ ...data, anythingElse: e.target.value })}
              />
            </div>
            <p className="text-xs text-[var(--muted)]">{t("consentNote")}</p>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
            {t("back")}
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && data.lookingFor.length === 0}
          >
            {t("next")}
          </Button>
        ) : (
          <Button
            className="flex-1"
            disabled={loading || data.whatYouWant.length < 20}
            onClick={submit}
          >
            {loading ? t("submitting") : t("submit")}
          </Button>
        )}
      </div>
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
