import { Gender, SwipeAction } from "@/generated/prisma/client";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { orderedPair } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  swipedId: z.string(),
  action: z.enum(SwipeAction),
  comment: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const { swipedId, action, comment } = schema.parse(body);

    if (swipedId === session.user.id) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const swipe = await prisma.swipe.upsert({
      where: {
        swiperId_swipedId: {
          swiperId: session.user.id,
          swipedId,
        },
      },
      create: {
        swiperId: session.user.id,
        swipedId,
        action,
        comment,
      },
      update: { action, comment },
    });

    let matched = false;
    let matchId: string | undefined;

    if (action === SwipeAction.LIKE || action === SwipeAction.SUPER_LIKE) {
      const reciprocal = await prisma.swipe.findUnique({
        where: {
          swiperId_swipedId: {
            swiperId: swipedId,
            swipedId: session.user.id,
          },
        },
      });

      if (
        reciprocal &&
        (reciprocal.action === SwipeAction.LIKE ||
          reciprocal.action === SwipeAction.SUPER_LIKE)
      ) {
        const [userAId, userBId] = orderedPair(session.user.id, swipedId);

        const myProfile = await prisma.profile.findUnique({
          where: { userId: session.user.id },
        });
        const theirProfile = await prisma.profile.findUnique({
          where: { userId: swipedId },
        });

        let messagingUnlockedFor: string | null = null;
        if (myProfile?.womenMessageFirst || theirProfile?.womenMessageFirst) {
          const womanId =
            myProfile?.gender === Gender.FEMALE
              ? session.user.id
              : theirProfile?.gender === Gender.FEMALE
                ? swipedId
                : null;
          if (womanId) messagingUnlockedFor = womanId;
        }

        const match = await prisma.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: {
            userAId,
            userBId,
            messagingUnlockedFor,
          },
          update: {},
        });

        matched = true;
        matchId = match.id;
      }
    }

    return NextResponse.json({ swipe, matched, matchId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
