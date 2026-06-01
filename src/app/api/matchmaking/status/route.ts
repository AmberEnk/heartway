import { IntroResponse } from "@/generated/prisma/client";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { buildProfileSummary } from "@/lib/curated-intro";
import { MATCHMAKING_CONFIG } from "@/lib/matchmaking-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const userId = session.user.id;

  const [intake, profile, pendingIntros, queueCount] = await Promise.all([
    prisma.matchmakingIntake.findUnique({ where: { userId } }),
    prisma.profile.findUnique({
      where: { userId },
      include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.curatedIntro.findMany({
      where: {
        status: "AWAITING",
        OR: [
          { userAId: userId, userAStatus: IntroResponse.PENDING },
          { userBId: userId, userBStatus: IntroResponse.PENDING },
        ],
      },
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
      orderBy: { createdAt: "desc" },
    }),
    prisma.matchmakingIntake.count({
      where: { status: { in: ["IN_QUEUE", "REVIEWING"] } },
    }),
  ]);

  const intros = pendingIntros.map((intro) => {
    const isUserA = intro.userAId === userId;
    const other = isUserA ? intro.userB : intro.userA;
    const otherProfile = other.profile!;
    const otherIntake = other.matchmakingIntake;

    return {
      id: intro.id,
      introNote: intro.introNote,
      createdAt: intro.createdAt.toISOString(),
      otherUser: buildProfileSummary(
        { ...otherProfile, photos: otherProfile.photos },
        otherIntake
      ),
    };
  });

  return NextResponse.json({
    launchCity: MATCHMAKING_CONFIG.launchCity,
    discoverEnabled: MATCHMAKING_CONFIG.discoverEnabled,
    profileComplete: profile?.isComplete ?? false,
    intake: intake
      ? {
          status: intake.status,
          completedAt: intake.completedAt?.toISOString() ?? null,
          city: intake.city,
          country: intake.country,
        }
      : null,
    pendingIntros: intros,
    queueCount,
  });
}
