"use server";

import {
  Gender,
  LookingFor,
  MatchScope,
  MatchmakingQueueStatus,
  RelocateWillingness,
} from "@/generated/prisma/client";
import { auth } from "@/auth";
import { isValidCountryCode } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import {
  AVOID_BEHAVIOR_KEYS,
  DEALBREAKER_KEYS,
  PARTNER_MUST_HAVE_KEYS,
} from "@/lib/matchmaking-config";
import { z } from "zod";

const genderValues = Object.values(Gender) as [Gender, ...Gender[]];
const lookingForValues = Object.values(LookingFor) as [LookingFor, ...LookingFor[]];
const matchScopeValues = Object.values(MatchScope) as [MatchScope, ...MatchScope[]];
const relocateValues = Object.values(RelocateWillingness) as [
  RelocateWillingness,
  ...RelocateWillingness[],
];

const intakeSchema = z.object({
  lookingFor: z.array(z.enum(lookingForValues)).min(1),
  country: z
    .string()
    .length(2)
    .transform((c) => c.toUpperCase())
    .refine(isValidCountryCode, { message: "Invalid country" }),
  stateOrProvince: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  yearsInMongolia: z.number().int().min(0).max(80),
  speaksMongolian: z.boolean(),
  introvertLevel: z.number().int().min(1).max(5),
  matchScope: z.enum(matchScopeValues),
  openToLongDistance: z.boolean(),
  willingToRelocate: z.enum(relocateValues),
  partnerMinAge: z.number().int().min(18).max(99),
  partnerMaxAge: z.number().int().min(18).max(99),
  partnerGenders: z.array(z.enum(genderValues)).min(1),
  dealbreakers: z.array(z.enum(DEALBREAKER_KEYS)),
  customDealbreakers: z.array(z.string().min(2).max(200)).max(10),
  avoidBehaviors: z.array(z.enum(AVOID_BEHAVIOR_KEYS)),
  partnerMustHaves: z.array(z.enum(PARTNER_MUST_HAVE_KEYS)),
  personalityNotes: z.string().max(2000).optional(),
  lifestyleNotes: z.string().max(2000).optional(),
  whatYouWant: z.string().min(20).max(2000),
  anythingElse: z.string().max(2000).optional(),
  submitToQueue: z.boolean().optional(),
});

export async function saveMatchmakingIntakeAction(
  input: z.infer<typeof intakeSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "not_signed_in" };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile?.isComplete) {
    return { ok: false as const, error: "profile_incomplete" };
  }

  try {
    const data = intakeSchema.parse(input);
    if (data.partnerMinAge > data.partnerMaxAge) {
      return { ok: false as const, error: "validation" };
    }

    const status = data.submitToQueue
      ? MatchmakingQueueStatus.IN_QUEUE
      : MatchmakingQueueStatus.DRAFT;

    const payload = {
      status,
      completedAt: data.submitToQueue ? new Date() : undefined,
      lookingFor: data.lookingFor,
      country: data.country,
      stateOrProvince: data.stateOrProvince,
      city: data.city,
      yearsInMongolia: data.yearsInMongolia,
      speaksMongolian: data.speaksMongolian,
      introvertLevel: data.introvertLevel,
      matchScope: data.matchScope,
      openToLongDistance: data.openToLongDistance,
      willingToRelocate: data.willingToRelocate,
      partnerMinAge: data.partnerMinAge,
      partnerMaxAge: data.partnerMaxAge,
      partnerGenders: data.partnerGenders,
      dealbreakers: data.dealbreakers,
      customDealbreakers: data.customDealbreakers,
      avoidBehaviors: data.avoidBehaviors,
      partnerMustHaves: data.partnerMustHaves,
      personalityNotes: data.personalityNotes,
      lifestyleNotes: data.lifestyleNotes,
      whatYouWant: data.whatYouWant,
      anythingElse: data.anythingElse,
    };

    await prisma.matchmakingIntake.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...payload,
        completedAt: data.submitToQueue ? new Date() : null,
      },
      update: payload,
    });

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { city: data.city, discoverable: false },
    });

    return { ok: true as const, status };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: "validation" };
    }
    console.error(error);
    return { ok: false as const, error: "server" };
  }
}
