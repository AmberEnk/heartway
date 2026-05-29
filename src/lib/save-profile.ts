import { Gender } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SaveProfileInput = {
  displayName: string;
  birthDate: string;
  gender: Gender;
  bio?: string;
  jobTitle?: string;
  education?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  showMeGenders: Gender[];
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  womenMessageFirst?: boolean;
  photos: string[];
  promptAnswers?: { promptId: string; answer: string }[];
  isComplete?: boolean;
};

export async function saveProfile(userId: string, data: SaveProfileInput) {
  const birthDate = new Date(data.birthDate);
  const photos = data.photos.filter(Boolean);

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: data.displayName,
      birthDate,
      gender: data.gender,
      bio: data.bio,
      jobTitle: data.jobTitle,
      education: data.education,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      showMeGenders: data.showMeGenders,
      minAge: data.minAge,
      maxAge: data.maxAge,
      maxDistanceKm: data.maxDistanceKm,
      womenMessageFirst: data.womenMessageFirst ?? false,
      isComplete: data.isComplete ?? true,
    },
    update: {
      displayName: data.displayName,
      birthDate,
      gender: data.gender,
      bio: data.bio,
      jobTitle: data.jobTitle,
      education: data.education,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      showMeGenders: data.showMeGenders,
      minAge: data.minAge,
      maxAge: data.maxAge,
      maxDistanceKm: data.maxDistanceKm,
      womenMessageFirst: data.womenMessageFirst,
      isComplete: data.isComplete ?? true,
    },
  });

  await prisma.photo.deleteMany({ where: { profileId: profile.id } });
  if (photos.length) {
    await prisma.photo.createMany({
      data: photos.map((url, i) => ({
        profileId: profile.id,
        url,
        sortOrder: i,
      })),
    });
  }

  if (data.promptAnswers?.length) {
    for (const pa of data.promptAnswers) {
      await prisma.promptAnswer.upsert({
        where: {
          profileId_promptId: {
            profileId: profile.id,
            promptId: pa.promptId,
          },
        },
        create: {
          profileId: profile.id,
          promptId: pa.promptId,
          answer: pa.answer,
        },
        update: { answer: pa.answer },
      });
    }
  }

  return prisma.profile.findUnique({
    where: { id: profile.id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      promptAnswers: { include: { prompt: true } },
    },
  });
}
