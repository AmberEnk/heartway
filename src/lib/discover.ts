import { Gender, Prisma } from "@/generated/prisma/client";
import { calculateAge, haversineKm } from "@/lib/utils";

export function buildDiscoverWhere(
  userId: string,
  excludeUserIds: string[],
  myProfile: {
    showMeGenders: unknown;
  }
): Prisma.ProfileWhereInput {
  const showMe = (myProfile.showMeGenders as Gender[]) ?? [];

  return {
    userId: {
      not: userId,
      notIn: excludeUserIds,
    },
    isComplete: true,
    discoverable: true,
    isPaused: false,
    gender: showMe.length ? { in: showMe } : undefined,
  };
}

export function profilePassesFilters(
  profile: {
    birthDate: Date;
    gender: Gender;
    latitude: number | null;
    longitude: number | null;
  },
  myProfile: {
    minAge: number;
    maxAge: number;
    maxDistanceKm: number;
    latitude: number | null;
    longitude: number | null;
    showMeGenders: unknown;
  }
): boolean {
  const age = calculateAge(profile.birthDate);
  if (age < myProfile.minAge || age > myProfile.maxAge) return false;

  const showMe = (myProfile.showMeGenders as Gender[]) ?? [];
  if (showMe.length && !showMe.includes(profile.gender)) return false;

  if (
    myProfile.latitude != null &&
    myProfile.longitude != null &&
    profile.latitude != null &&
    profile.longitude != null
  ) {
    const km = haversineKm(
      myProfile.latitude,
      myProfile.longitude,
      profile.latitude,
      profile.longitude
    );
    if (km > myProfile.maxDistanceKm) return false;
  }

  return true;
}
