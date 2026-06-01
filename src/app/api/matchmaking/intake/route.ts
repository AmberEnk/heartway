import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseGenderList, parseStringList } from "@/lib/curated-intro";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const intake = await prisma.matchmakingIntake.findUnique({
    where: { userId: session.user.id },
  });

  if (!intake) {
    return NextResponse.json({ intake: null });
  }

  return NextResponse.json({
    intake: {
      ...intake,
      partnerGenders: parseGenderList(intake.partnerGenders),
      dealbreakers: parseStringList(intake.dealbreakers),
      customDealbreakers: parseStringList(intake.customDealbreakers),
      avoidBehaviors: parseStringList(intake.avoidBehaviors),
      partnerMustHaves: parseStringList(intake.partnerMustHaves),
      completedAt: intake.completedAt?.toISOString() ?? null,
    },
  });
}
