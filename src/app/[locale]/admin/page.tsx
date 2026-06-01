import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminHub");

  return (
    <AppShell showNav={false}>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("subtitle")}</p>
      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/admin/blog"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 font-medium hover:border-[var(--primary)]"
          >
            {t("blog")}
          </Link>
        </li>
        <li>
          <Link
            href="/admin/forum"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 font-medium hover:border-[var(--primary)]"
          >
            {t("forum")}
          </Link>
        </li>
        <li>
          <Link
            href="/admin/matchmaking"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 font-medium hover:border-[var(--primary)]"
          >
            {t("matchmaking")}
          </Link>
        </li>
      </ul>
    </AppShell>
  );
}
