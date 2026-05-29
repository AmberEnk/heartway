import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, forbidden, unauthorized } from "@/lib/auth-helpers";
import { authorFromUser, forumTopicInclude } from "@/lib/forum";
import { isAdminUser } from "@/lib/admin";

type Params = { params: Promise<{ topicId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { topicId } = await params;

  const topic = await prisma.forumTopic.findUnique({
    where: { id: topicId },
    include: {
      ...forumTopicInclude,
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

  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    topic: {
      id: topic.id,
      title: topic.title,
      body: topic.body,
      locale: topic.locale,
      isPinned: topic.isPinned,
      isLocked: topic.isLocked,
      createdAt: topic.createdAt.toISOString(),
      author: authorFromUser(topic.author),
      replies: topic.replies.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        author: authorFromUser(r.author),
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { topicId } = await params;
  const data = await request.json();

  const topic = await prisma.forumTopic.update({
    where: { id: topicId },
    data: {
      ...(typeof data.isPinned === "boolean" ? { isPinned: data.isPinned } : {}),
      ...(typeof data.isLocked === "boolean" ? { isLocked: data.isLocked } : {}),
    },
  });

  return NextResponse.json({ topic });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { topicId } = await params;
  const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canDelete =
    topic.authorId === session.user.id ||
    isAdminUser(session.user.email, session.user.role);

  if (!canDelete) return forbidden();

  await prisma.forumTopic.delete({ where: { id: topicId } });
  return NextResponse.json({ ok: true });
}
