export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { Link } from "@/i18n/navigation";
import { Pin, Lock, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { CommunityTabs } from "@/components/CommunityTabs";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { authorFromUser, forumTopicInclude } from "@/lib/forum";
import { isAdminUser } from "@/lib/admin";

export default async function ForumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");
  const session = await auth();

  const topics = await prisma.forumTopic.findMany({
    where: { locale },
    include: forumTopicInclude,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return (
    <AppShell>
      <CommunityTabs />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-[var(--muted)]">{t("subtitle")}</p>
        </div>
        {session ? (
          <Link href="/forum/new">
            <Button className="shrink-0 text-sm">{t("newTopic")}</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="secondary" className="shrink-0 text-sm">
              {t("loginToPost")}
            </Button>
          </Link>
        )}
      </div>

      {topics.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">{t("empty")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {topics.map((topic) => {
            const author = authorFromUser(topic.author);
            const showAdminBadge =
              author.isAdmin ||
              isAdminUser(topic.author.email, topic.author.role);
            return (
              <li key={topic.id}>
                <Link
                  href={`/forum/${topic.id}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/40"
                >
                  <div className="flex items-start gap-2">
                    {topic.isPinned && (
                      <Pin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold leading-snug">{topic.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                        {topic.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                        <span>
                          {author.displayName}
                          {showAdminBadge && (
                            <span className="ml-1 text-[var(--primary)]">· {t("adminBadge")}</span>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {t("replyCount", { count: topic._count.replies })}
                        </span>
                        {topic.isLocked && (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5" />
                            {t("locked")}
                          </span>
                        )}
                        <span>{format(topic.updatedAt, "PP")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
