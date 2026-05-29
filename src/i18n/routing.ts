import { defineRouting } from "next-intl/routing";

export const locales = ["en", "mn", "mn-Inner"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "always",
});
