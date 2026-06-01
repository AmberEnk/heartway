import { CuratedIntroStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { orderedPair } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  userAId: z.string(),
  userBId: z.string(),
  introNote: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { userAId, userBId, introNote } = createSchema.parse(await request.json());

    if (userAId === userBId) {
      return NextResponse.json({ error: "same_user" }, { status: 400 });
    }

    const [intakeA, intakeB, profileA, profileB] = await Promise.all([
      prisma.matchmakingIntake.findUnique({ where: { userId: userAId } }),
      prisma.matchmakingIntake.findUnique({ where: { userId: userBId } }),
      prisma.profile.findUnique({ where: { userId: userAId } }),
      prisma.profile.findUnique({ where: { userId: userBId } }),
    ]);

    if (!intakeA?.completedAt || !intakeB?.completedAt) {
      return NextResponse.json({ error: "intake_incomplete" }, { status: 400 });
    }
    if (!profileA?.isComplete || !profileB?.isComplete) {
      return NextResponse.json({ error: "profile_incomplete" }, { status: 400 });
    }

    const pendingBetween = await prisma.curatedIntro.findFirst({
      where: {
        status: CuratedIntroStatus.AWAITING,
        OR: [
          { userAId, userBId },
          { userAId: userBId, userBId: userAId },
        ],
      },
    });
    if (pendingBetween) {
      return NextResponse.json({ error: "pending_intro_exists" }, { status: 409 });
    }

    const [orderedA, orderedB] = orderedPair(userAId, userBId);

    const intro = await prisma.curatedIntro.create({
      data: {
        userAId: orderedA,
        userBId: orderedB,
        introNote,
        createdById: session!.user.id,
      },
    });

    await prisma.matchmakingIntake.updateMany({
      where: { userId: { in: [userAId, userBId] }, status: "IN_QUEUE" },
      data: { status: "REVIEWING" },
    });

    return NextResponse.json({ intro: { id: intro.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

const patchSchema = z.object({
  introId: z.string(),
  action: z.enum(["cancel"]),
});

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { introId, action } = patchSchema.parse(await request.json());

  if (action === "cancel") {
    const intro = await prisma.curatedIntro.update({
      where: { id: introId },
      data: { status: CuratedIntroStatus.CANCELLED },
    });
    await prisma.matchmakingIntake.updateMany({
      where: {
        userId: { in: [intro.userAId, intro.userBId] },
        status: "REVIEWING",
      },
      data: { status: "IN_QUEUE" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
