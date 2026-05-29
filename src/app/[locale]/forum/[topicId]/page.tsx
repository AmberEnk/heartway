export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Pin, Lock } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { CommunityTabs } from "@/components/CommunityTabs";
import { ReplySection } from "@/components/forum/ReplySection";
import { prisma } from "@/lib/prisma";
import { authorFromUser } from "@/lib/forum";
import { isAdminUser } from "@/lib/admin";

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ locale: string; topicId: string }>;
}) {
  const { locale, topicId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");
  const session = await auth();

  const topic = await prisma.forumTopic.findUnique({
    where: { id: topicId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: { select: { displayName: true } },
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!topic) notFound();

  const author = authorFromUser(topic.author);
  const showAdminBadge =
    author.isAdmin || isAdminUser(topic.author.email, topic.author.role);

  return (
    <AppShell>
      <CommunityTabs />
      <Link href="/forum" className="text-sm text-[var(--primary)]">
        {t("backToList")}
      </Link>

      <article className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          {topic.isPinned && (
            <span className="inline-flex items-center gap-1 text-[var(--primary)]">
              <Pin className="h-3.5 w-3.5" />
              {t("pinned")}
            </span>
          )}
          {topic.isLocked && (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              {t("locked")}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold">{topic.title}</h1>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {author.displayName}
          {showAdminBadge && (
            <span className="ml-2 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 font-medium text-[var(--primary)]">
              {t("adminBadge")}
            </span>
          )}
          {" · "}
          {format(topic.createdAt, "PPp")}
        </p>
        <p className="mt-4 whitespace-pre-wrap">{topic.body}</p>
      </article>

      <ReplySection
        topicId={topic.id}
        canModerate={
          !!session &&
          isAdminUser(session.user.email, session.user.role)
        }
        initialReplies={topic.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          author: authorFromUser(r.author),
        }))}
        isLocked={topic.isLocked}
      />
    </AppShell>
  );
}
