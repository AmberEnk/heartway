import bcrypt from "bcryptjs";
import { Gender, SwipeAction } from "../src/generated/prisma/client";
import type { PrismaClient } from "../src/generated/prisma/client";
import { orderedPair } from "../src/lib/utils";

const DEMO_PASSWORD = "demo12345";

export const demoProfiles = [
  {
    email: "demo+nara@heartway.local",
    name: "Nara",
    displayName: "Nara",
    birthDate: new Date("1998-06-12"),
    gender: Gender.FEMALE,
    bio: "Coffee person, weekend hiker, terrible at cooking but great at trying.",
    jobTitle: "Product designer",
    education: "NUM",
    city: "Ulaanbaatar",
    latitude: 47.8864,
    longitude: 106.9057,
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    ],
    prompts: {
      ideal_sunday: "Slow morning, good coffee, then a long walk without a plan.",
      green_flag: "Kind to service staff and remembers small details you mention.",
    },
    chatPreview: true,
  },
  {
    email: "demo+bold@heartway.local",
    name: "Bold",
    displayName: "Bold",
    birthDate: new Date("1996-03-20"),
    gender: Gender.MALE,
    bio: "Engineer by day, vinyl collector by night. Looking for real conversation.",
    jobTitle: "Software engineer",
    education: "MIT",
    city: "Ulaanbaatar",
    latitude: 47.92,
    longitude: 106.91,
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    ],
    prompts: {
      together_we_could: "Find a new ramen spot and debate the best Mongolian rock albums.",
      love_language: "Quality time and acts of service.",
    },
    chatPreview: false,
  },
  {
    email: "demo+sara@heartway.local",
    name: "Sara",
    displayName: "Sara",
    birthDate: new Date("1999-11-05"),
    gender: Gender.FEMALE,
    bio: "Art history nerd. Museum dates > club dates.",
    jobTitle: "Gallery coordinator",
    city: "Erdenet",
    latitude: 49.0333,
    longitude: 104.0833,
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
    ],
    prompts: {
      controversial_opinion: "The best dates don't need alcohol to be fun.",
      green_flag: "Curiosity — asks questions because they care, not to fill silence.",
    },
    chatPreview: false,
  },
  {
    email: "demo+erden@heartway.local",
    name: "Erden",
    displayName: "Erden",
    birthDate: new Date("1994-08-30"),
    gender: Gender.MALE,
    bio: "Trainer, foodie, always down for road trips outside the city.",
    jobTitle: "Fitness coach",
    city: "Darkhan",
    latitude: 49.4868,
    longitude: 105.9412,
    photos: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
    ],
    prompts: {
      ideal_sunday: "Gym, big breakfast, then driving somewhere with no map.",
    },
    chatPreview: false,
  },
] as const;

const previewMessages = [
  { fromDemo: true, body: "Hey! I liked your answer about Sunday mornings ☕" },
  { fromDemo: false, body: "Thanks! Yours made me laugh — the cooking part is very relatable." },
  { fromDemo: true, body: "Want to grab coffee near Sukhbaatar square this week?" },
  { fromDemo: false, body: "I'd like that. Thursday evening works for me." },
  { fromDemo: true, body: "Perfect — I'll message you Wednesday to confirm a place." },
];

export async function seedDemoData(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const prompts = await prisma.prompt.findMany();
  const promptByKey = Object.fromEntries(prompts.map((p) => [p.key, p.id]));

  const demoUserIds: string[] = [];
  let chatPartnerId: string | null = null;

  for (const demo of demoProfiles) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        name: demo.name,
        passwordHash,
        image: demo.photos[0],
      },
      update: { name: demo.name, image: demo.photos[0] },
    });

    demoUserIds.push(user.id);
    if (demo.chatPreview) chatPartnerId = user.id;

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: demo.displayName,
        birthDate: demo.birthDate,
        gender: demo.gender,
        bio: demo.bio,
        jobTitle: demo.jobTitle,
        education: "education" in demo ? demo.education : undefined,
        city: demo.city,
        latitude: demo.latitude,
        longitude: demo.longitude,
        showMeGenders: [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY],
        minAge: 21,
        maxAge: 45,
        maxDistanceKm: 100,
        isComplete: true,
        discoverable: true,
        isPaused: false,
      },
      update: {
        displayName: demo.displayName,
        birthDate: demo.birthDate,
        gender: demo.gender,
        bio: demo.bio,
        jobTitle: demo.jobTitle,
        city: demo.city,
        latitude: demo.latitude,
        longitude: demo.longitude,
        isComplete: true,
        discoverable: true,
        isPaused: false,
      },
    });

    await prisma.photo.deleteMany({ where: { profileId: profile.id } });
    await prisma.photo.createMany({
      data: demo.photos.map((url, i) => ({
        profileId: profile.id,
        url,
        sortOrder: i,
      })),
    });

    for (const [key, answer] of Object.entries(demo.prompts)) {
      const promptId = promptByKey[key];
      if (!promptId) continue;
      await prisma.promptAnswer.upsert({
        where: { profileId_promptId: { profileId: profile.id, promptId } },
        create: { profileId: profile.id, promptId, answer },
        update: { answer },
      });
    }
  }

  const viewer = await prisma.user.findFirst({
    where: {
      email: { not: { startsWith: "demo+" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!viewer || !chatPartnerId) {
    console.log("Demo profiles created (log in to see discover). No viewer account for chat preview.");
    return;
  }

  const [userAId, userBId] = orderedPair(viewer.id, chatPartnerId);

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: {
      userAId,
      userBId,
      lastMessageAt: new Date(),
    },
    update: { lastMessageAt: new Date() },
  });

  await prisma.message.deleteMany({ where: { matchId: match.id } });

  const baseTime = Date.now() - previewMessages.length * 60_000;
  for (let i = 0; i < previewMessages.length; i++) {
    const msg = previewMessages[i];
    await prisma.message.create({
      data: {
        matchId: match.id,
        senderId: msg.fromDemo ? chatPartnerId : viewer.id,
        body: msg.body,
        createdAt: new Date(baseTime + i * 60_000),
        readAt: i < previewMessages.length - 1 ? new Date() : null,
      },
    });
  }

  await prisma.swipe.upsert({
    where: {
      swiperId_swipedId: { swiperId: viewer.id, swipedId: chatPartnerId },
    },
    create: {
      swiperId: viewer.id,
      swipedId: chatPartnerId,
      action: SwipeAction.LIKE,
    },
    update: { action: SwipeAction.LIKE },
  });

  await prisma.swipe.upsert({
    where: {
      swiperId_swipedId: { swiperId: chatPartnerId, swipedId: viewer.id },
    },
    create: {
      swiperId: chatPartnerId,
      swipedId: viewer.id,
      action: SwipeAction.LIKE,
    },
    update: { action: SwipeAction.LIKE },
  });

  console.log(`Demo match with Nara ready for ${viewer.email} — open Matches or Messages.`);
  console.log(`Discover: ${demoUserIds.length - 1} more demo profiles to swipe (Nara is already matched).`);
}
