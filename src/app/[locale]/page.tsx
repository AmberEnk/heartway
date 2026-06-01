import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const nav = await getTranslations("nav");
  const session = await auth();

  return (
    <AppShell showNav={false}>
      <section className="py-8 text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-4 text-[var(--muted)]">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {session ? (
            <Link href="/matchmaking">
              <Button className="w-full sm:w-auto">{t("ctaPrimary")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button className="w-full sm:w-auto">{t("ctaPrimary")}</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="w-full sm:w-auto">
                  {nav("login")}
                </Button>
              </Link>
            </>
          )}
          <Link href="/blog">
            <Button variant="secondary" className="w-full sm:w-auto">
              {t("ctaSecondary")}
            </Button>
          </Link>
          <Link href="/forum">
            <Button variant="ghost" className="w-full sm:w-auto">
              {t("ctaForum")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["featureSwipeTitle", "featureSwipeDesc"],
            ["featurePromptsTitle", "featurePromptsDesc"],
            ["featureSafetyTitle", "featureSafetyDesc"],
            ["featureBlogTitle", "featureBlogDesc"],
          ] as const
        ).map(([titleKey, descKey]) => (
          <article
            key={titleKey}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 className="font-semibold">{t(titleKey)}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t(descKey)}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
