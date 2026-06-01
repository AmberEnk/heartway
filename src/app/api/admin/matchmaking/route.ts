import { requireAdmin } from "@/lib/auth-helpers";
import { buildProfileSummary, parseGenderList, parseStringList } from "@/lib/curated-intro";
import { getCountryName } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [queue, intros] = await Promise.all([
    prisma.matchmakingIntake.findMany({
      where: { status: { in: ["IN_QUEUE", "REVIEWING", "MATCHED"] } },
      include: {
        user: {
          include: {
            profile: {
              include: {
                photos: { orderBy: { sortOrder: "asc" }, take: 1 },
                promptAnswers: { include: { prompt: true } },
              },
            },
          },
        },
      },
      orderBy: { completedAt: "asc" },
    }),
    prisma.curatedIntro.findMany({
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    queue: queue.map((item) => {
      const profile = item.user.profile!;
      return {
        userId: item.userId,
        email: item.user.email,
        status: item.status,
        completedAt: item.completedAt?.toISOString() ?? null,
        profile: {
          displayName: profile.displayName,
          age: calculateAge(profile.birthDate),
          gender: profile.gender,
          bio: profile.bio,
          photo: profile.photos[0]?.url ?? null,
        },
        intake: {
          lookingFor: item.lookingFor,
          country: item.country,
          countryName: getCountryName(item.country),
          stateOrProvince: item.stateOrProvince,
          city: item.city,
          yearsInMongolia: item.yearsInMongolia,
          speaksMongolian: item.speaksMongolian,
          introvertLevel: item.introvertLevel,
          matchScope: item.matchScope,
          openToLongDistance: item.openToLongDistance,
          willingToRelocate: item.willingToRelocate,
          partnerMinAge: item.partnerMinAge,
          partnerMaxAge: item.partnerMaxAge,
          partnerGenders: parseGenderList(item.partnerGenders),
          dealbreakers: parseStringList(item.dealbreakers),
          customDealbreakers: parseStringList(item.customDealbreakers),
          avoidBehaviors: parseStringList(item.avoidBehaviors),
          partnerMustHaves: parseStringList(item.partnerMustHaves),
          personalityNotes: item.personalityNotes,
          lifestyleNotes: item.lifestyleNotes,
          whatYouWant: item.whatYouWant,
          anythingElse: item.anythingElse,
        },
        summary: buildProfileSummary(profile, item),
      };
    }),
    intros: intros.map((i) => ({
      id: i.id,
      status: i.status,
      introNote: i.introNote,
      userAStatus: i.userAStatus,
      userBStatus: i.userBStatus,
      matchId: i.matchId,
      createdAt: i.createdAt.toISOString(),
      userA: {
        id: i.userAId,
        name: i.userA.profile?.displayName,
      },
      userB: {
        id: i.userBId,
        name: i.userB.profile?.displayName,
      },
    })),
  });
}
