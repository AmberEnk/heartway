import { prisma } from "@/lib/prisma";

export async function getAuthorDisplayName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  });
  if (!user) return "Member";
  return (
    user.profile?.displayName ??
    user.name ??
    user.email?.split("@")[0] ??
    "Member"
  );
}

export const forumTopicInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: { select: { displayName: true } },
    },
  },
  _count: { select: { replies: true } },
} as const;

export function authorFromUser(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  profile: { displayName: string } | null;
}) {
  const displayName =
    user.profile?.displayName ??
    user.name ??
    user.email?.split("@")[0] ??
    "Member";
  return {
    id: user.id,
    displayName,
    isAdmin: user.role === "ADMIN",
  };
}
