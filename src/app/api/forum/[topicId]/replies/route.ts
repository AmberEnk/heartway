import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { authorFromUser } from "@/lib/forum";

type Params = { params: Promise<{ topicId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { topicId } = await params;
  const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (topic.isLocked) {
    return NextResponse.json({ error: "Topic is locked" }, { status: 403 });
  }

  const { body } = await request.json();
  const text = String(body ?? "").trim();
  if (!text || text.length < 2) {
    return NextResponse.json({ error: "Reply is too short" }, { status: 400 });
  }

  const reply = await prisma.forumReply.create({
    data: {
      topicId,
      authorId: session.user.id,
      body: text,
    },
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
  });

  await prisma.forumTopic.update({
    where: { id: topicId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    reply: {
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt.toISOString(),
      author: authorFromUser(reply.author),
    },
  });
}
