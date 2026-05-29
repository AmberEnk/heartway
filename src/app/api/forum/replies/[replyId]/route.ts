import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, forbidden, unauthorized } from "@/lib/auth-helpers";
import { isAdminUser } from "@/lib/admin";

type Params = { params: Promise<{ replyId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { replyId } = await params;
  const reply = await prisma.forumReply.findUnique({ where: { id: replyId } });
  if (!reply) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canDelete =
    reply.authorId === session.user.id ||
    isAdminUser(session.user.email, session.user.role);

  if (!canDelete) return forbidden();

  await prisma.forumReply.delete({ where: { id: replyId } });
  return NextResponse.json({ ok: true });
}
