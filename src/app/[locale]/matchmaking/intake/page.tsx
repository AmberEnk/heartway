import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { IntakeForm } from "@/components/matchmaking/IntakeForm";
import { prisma } from "@/lib/prisma";

export default async function MatchmakingIntakePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("matchmaking.intake");
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile?.isComplete) {
    redirect(`/${locale}/onboarding`);
  }

  return (
    <AppShell showNav={false}>
      <Link href="/matchmaking" className="text-sm text-[var(--primary)]">
        {t("backToHub")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
      <div className="mt-6">
        <IntakeForm />
      </div>
    </AppShell>
  );
}
