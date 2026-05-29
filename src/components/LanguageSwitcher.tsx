"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const labels: Record<AppLocale, string> = {
  en: "English",
  mn: "Монгол",
  "mn-Inner": "ᠮᠣᠩᠭᠣᠯ",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      className={cn(
        "rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm",
        className
      )}
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as AppLocale })}
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {labels[l]}
        </option>
      ))}
    </select>
  );
}
