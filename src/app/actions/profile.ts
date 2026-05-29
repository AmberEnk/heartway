"use server";

import { Gender } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { saveProfile } from "@/lib/save-profile";
import { z } from "zod";

const genderValues = Object.values(Gender) as [Gender, ...Gender[]];

const profileSchema = z.object({
  displayName: z.string().min(2).max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(genderValues),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  showMeGenders: z.array(z.enum(genderValues)).min(1),
  minAge: z.number().int().min(18).max(99),
  maxAge: z.number().int().min(18).max(99),
  maxDistanceKm: z.number().int().min(1).max(500),
  womenMessageFirst: z.boolean().optional(),
  photos: z.array(z.string().url()).max(6),
  promptAnswers: z
    .array(
      z.object({
        promptId: z.string(),
        answer: z.string().min(1).max(300),
      })
    )
    .max(3)
    .optional(),
  isComplete: z.boolean().optional(),
});

export async function completeOnboardingAction(input: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "not_signed_in" };
  }

  try {
    const data = profileSchema.parse(input);
    await saveProfile(session.user.id, data);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: "validation" };
    }
    console.error(error);
    return { ok: false as const, error: "server" };
  }
}
