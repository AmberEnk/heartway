import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { buildDiscoverWhere, profilePassesFilters } from "@/lib/discover";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const myProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!myProfile?.isComplete) {
    return NextResponse.json({ profiles: [], needsOnboarding: true });
  }

  if (myProfile.isPaused || !myProfile.discoverable) {
    return NextResponse.json({ profiles: [], paused: true });
  }

  const alreadySwiped = await prisma.swipe.findMany({
    where: { swiperId: session.user.id },
    select: { swipedId: true },
  });
  const swipedIds = new Set(alreadySwiped.map((s) => s.swipedId));

  const candidates = await prisma.profile.findMany({
    where: buildDiscoverWhere(session.user.id, [...swipedIds], myProfile),
    include: {
      photos: { orderBy: { sortOrder: "asc" }, take: 6 },
      promptAnswers: { include: { prompt: true } },
      user: { select: { id: true } },
    },
    take: 20,
  });

  const profiles = candidates
    .filter((p) => profilePassesFilters(p, myProfile))
    .slice(0, 10)
    .map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      age: calculateAge(p.birthDate),
      bio: p.bio,
      city: p.city,
      jobTitle: p.jobTitle,
      education: p.education,
      photos: p.photos,
      promptAnswers: p.promptAnswers,
    }));

  return NextResponse.json({ profiles });
}
