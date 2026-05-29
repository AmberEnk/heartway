import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { CommunityTabs } from "@/components/CommunityTabs";
import { NewTopicForm } from "@/components/forum/NewTopicForm";

export default async function NewForumTopicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <AppShell showNav={false}>
      <CommunityTabs />
      <Link href="/forum" className="text-sm text-[var(--primary)]">
        {t("backToList")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{t("newTopic")}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{t("newTopicHint")}</p>
      <div className="mt-6">
        <NewTopicForm />
      </div>
    </AppShell>
  );
}
