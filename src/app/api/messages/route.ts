import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  matchId: z.string(),
  body: z.string().min(1).max(2000),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const matchId = new URL(request.url).searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.userAId !== session.user.id && match.userBId !== session.user.id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  const canSend = canUserSendMessage(match, session.user.id);

  const otherUserId = match.userAId === session.user.id ? match.userBId : match.userAId;
  const otherProfile = await prisma.profile.findUnique({
    where: { userId: otherUserId },
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return NextResponse.json({
    messages,
    canSend,
    messagingUnlockedFor: match.messagingUnlockedFor,
    otherUser: {
      id: otherUserId,
      displayName: otherProfile?.displayName ?? "Match",
      photo: otherProfile?.photos[0]?.url ?? null,
    },
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const { matchId, body } = postSchema.parse(await request.json());

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.userAId !== session.user.id && match.userBId !== session.user.id)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (!canUserSendMessage(match, session.user.id)) {
      return NextResponse.json({ error: "messaging_locked" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: session.user.id,
        body,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    const updateData: { lastMessageAt: Date; messagingUnlockedFor?: null } = {
      lastMessageAt: new Date(),
    };
    if (match.messagingUnlockedFor) {
      updateData.messagingUnlockedFor = null;
    }

    await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

function canUserSendMessage(
  match: { messagingUnlockedFor: string | null; userAId: string; userBId: string },
  userId: string
): boolean {
  if (!match.messagingUnlockedFor) return true;
  if (match.messagingUnlockedFor === userId) return true;

  return false;
}
