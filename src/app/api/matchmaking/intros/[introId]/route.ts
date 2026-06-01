import { IntroResponse } from "@/generated/prisma/client";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import {
  buildProfileSummary,
  finalizeIntroIfMutual,
} from "@/lib/curated-intro";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ introId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { introId } = await params;
  const intro = await prisma.curatedIntro.findUnique({
    where: { id: introId },
    include: {
      userA: {
        include: {
          profile: { include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          matchmakingIntake: true,
        },
      },
      userB: {
        include: {
          profile: { include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          matchmakingIntake: true,
        },
      },
    },
  });

  if (!intro) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const userId = session.user.id;
  if (intro.userAId !== userId && intro.userBId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const isUserA = intro.userAId === userId;
  const myStatus = isUserA ? intro.userAStatus : intro.userBStatus;
  const other = isUserA ? intro.userB : intro.userA;
  const otherProfile = other.profile!;

  return NextResponse.json({
    intro: {
      id: intro.id,
      introNote: intro.introNote,
      status: intro.status,
      myStatus,
      matchId: intro.matchId,
      createdAt: intro.createdAt.toISOString(),
      otherUser: buildProfileSummary(
        { ...otherProfile, photos: otherProfile.photos },
        other.matchmakingIntake
      ),
    },
  });
}

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { introId } = await params;
  const { action } = respondSchema.parse(await request.json());

  const intro = await prisma.curatedIntro.findUnique({ where: { id: introId } });
  if (!intro) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const userId = session.user.id;
  if (intro.userAId !== userId && intro.userBId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (intro.status !== "AWAITING") {
    return NextResponse.json({ error: "already_resolved" }, { status: 400 });
  }

  const isUserA = intro.userAId === userId;
  const myCurrent = isUserA ? intro.userAStatus : intro.userBStatus;
  if (myCurrent !== IntroResponse.PENDING) {
    return NextResponse.json({ error: "already_responded" }, { status: 400 });
  }

  const newStatus =
    action === "accept" ? IntroResponse.ACCEPTED : IntroResponse.DECLINED;

  const updated = await prisma.curatedIntro.update({
    where: { id: introId },
    data: isUserA ? { userAStatus: newStatus } : { userBStatus: newStatus },
  });

  let matchId: string | null = null;
  if (action === "accept") {
    matchId = (await finalizeIntroIfMutual(introId)) ?? null;
  } else {
    await prisma.curatedIntro.update({
      where: { id: introId },
      data: { status: "DECLINED" },
    });
    await prisma.matchmakingIntake.updateMany({
      where: {
        userId: { in: [updated.userAId, updated.userBId] },
        status: "REVIEWING",
      },
      data: { status: "IN_QUEUE" },
    });
  }

  const refreshed = await prisma.curatedIntro.findUnique({ where: { id: introId } });

  return NextResponse.json({
    ok: true,
    matchId,
    status: refreshed?.status,
    myStatus: newStatus,
  });
}
