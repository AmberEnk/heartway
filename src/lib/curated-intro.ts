import {
  CuratedIntroStatus,
  IntroResponse,
  type Gender,
  type MatchmakingIntake,
  type Profile,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateAge, orderedPair } from "@/lib/utils";

export function buildProfileSummary(
  profile: Profile & { photos?: { url: string }[] },
  intake: MatchmakingIntake | null
) {
  return {
    displayName: profile.displayName,
    age: calculateAge(profile.birthDate),
    city: intake?.city ?? profile.city,
    stateOrProvince: intake?.stateOrProvince,
    country: intake?.country,
    bio: profile.bio,
    photo: profile.photos?.[0]?.url ?? null,
    lookingFor: intake?.lookingFor ?? [],
    speaksMongolian: intake?.speaksMongolian,
    yearsInMongolia: intake?.yearsInMongolia,
    personalityNotes: intake?.personalityNotes,
    whatYouWant: intake?.whatYouWant,
  };
}

export async function finalizeIntroIfMutual(introId: string) {
  const intro = await prisma.curatedIntro.findUnique({ where: { id: introId } });
  if (!intro) return null;

  if (intro.userAStatus !== IntroResponse.ACCEPTED || intro.userBStatus !== IntroResponse.ACCEPTED) {
    if (
      intro.userAStatus === IntroResponse.DECLINED ||
      intro.userBStatus === IntroResponse.DECLINED
    ) {
      await prisma.curatedIntro.update({
        where: { id: introId },
        data: { status: CuratedIntroStatus.DECLINED },
      });
    }
    return null;
  }

  if (intro.matchId) {
    return intro.matchId;
  }

  const [userAId, userBId] = orderedPair(intro.userAId, intro.userBId);

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: {
      userAId,
      userBId,
      isCurated: true,
      messagingUnlockedFor: null,
    },
    update: {
      isCurated: true,
      messagingUnlockedFor: null,
    },
  });

  await prisma.curatedIntro.update({
    where: { id: introId },
    data: {
      status: CuratedIntroStatus.MUTUAL,
      matchId: match.id,
    },
  });

  await prisma.matchmakingIntake.updateMany({
    where: { userId: { in: [intro.userAId, intro.userBId] } },
    data: { status: "MATCHED" },
  });

  return match.id;
}

export function parseGenderList(raw: unknown): Gender[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g): g is Gender => typeof g === "string");
}

export function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string");
}
