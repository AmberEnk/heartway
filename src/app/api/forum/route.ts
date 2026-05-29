import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { authorFromUser, forumTopicInclude } from "@/lib/forum";
import { routing } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";

  const topics = await prisma.forumTopic.findMany({
    where: { locale },
    include: forumTopicInclude,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      bodyPreview: t.body.slice(0, 200),
      locale: t.locale,
      isPinned: t.isPinned,
      isLocked: t.isLocked,
      replyCount: t._count.replies,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      author: authorFromUser(t.author),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const locale = String(body.locale ?? "en");

  if (!title || title.length < 5) {
    return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 });
  }
  if (!text || text.length < 10) {
    return NextResponse.json({ error: "Post must be at least 10 characters" }, { status: 400 });
  }
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const topic = await prisma.forumTopic.create({
    data: {
      authorId: session.user.id,
      title,
      body: text,
      locale,
    },
    include: forumTopicInclude,
  });

  return NextResponse.json({
    topic: {
      id: topic.id,
      title: topic.title,
      author: authorFromUser(topic.author),
    },
  });
}
