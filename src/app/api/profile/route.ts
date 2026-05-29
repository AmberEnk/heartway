import { Gender } from "@/generated/prisma/client";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { saveProfile } from "@/lib/save-profile";
import { NextResponse } from "next/server";
import { z } from "zod";

const genderValues = Object.values(Gender) as [Gender, ...Gender[]];

const profileSchema = z.object({
  displayName: z.string().min(2).max(50),
  birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  gender: z.enum(genderValues),
  bio: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { prisma } = await import("@/lib/prisma");
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      promptAnswers: { include: { prompt: true } },
    },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const data = profileSchema.parse(body);
    const profile = await saveProfile(session.user.id, {
      ...data,
      photos: data.photos,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const { discoverable, isPaused, womenMessageFirst, minAge, maxAge, maxDistanceKm } = body;

  const { prisma } = await import("@/lib/prisma");
  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      displayName: session.user.name ?? "New user",
      birthDate: new Date("2000-01-01"),
      gender: Gender.PREFER_NOT_TO_SAY,
      showMeGenders: [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY],
      minAge: typeof minAge === "number" ? minAge : 21,
      maxAge: typeof maxAge === "number" ? maxAge : 45,
      maxDistanceKm: typeof maxDistanceKm === "number" ? maxDistanceKm : 50,
      womenMessageFirst: typeof womenMessageFirst === "boolean" ? womenMessageFirst : false,
      discoverable: typeof discoverable === "boolean" ? discoverable : true,
      isPaused: typeof isPaused === "boolean" ? isPaused : false,
      isComplete: false,
    },
    update: {
      ...(typeof discoverable === "boolean" && { discoverable }),
      ...(typeof isPaused === "boolean" && { isPaused }),
      ...(typeof womenMessageFirst === "boolean" && { womenMessageFirst }),
      ...(typeof minAge === "number" && { minAge }),
      ...(typeof maxAge === "number" && { maxAge }),
      ...(typeof maxDistanceKm === "number" && { maxDistanceKm }),
    },
  });

  return NextResponse.json({ profile });
}
