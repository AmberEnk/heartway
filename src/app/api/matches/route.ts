import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
    },
    include: {
      userA: {
        include: {
          profile: { include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
      userB: {
        include: {
          profile: { include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const result = matches.map((m) => {
    const other =
      m.userAId === session.user!.id
        ? { user: m.userB, profile: m.userB.profile }
        : { user: m.userA, profile: m.userA.profile };

    return {
      id: m.id,
      createdAt: m.createdAt,
      lastMessage: m.messages[0] ?? null,
      messagingUnlockedFor: m.messagingUnlockedFor,
      otherUser: {
        id: other.user.id,
        displayName: other.profile?.displayName,
        age: other.profile ? calculateAge(other.profile.birthDate) : null,
        photo: other.profile?.photos[0]?.url ?? null,
      },
    };
  });

  return NextResponse.json({ matches: result });
}
