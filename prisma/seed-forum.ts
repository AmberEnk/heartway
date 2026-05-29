import type { PrismaClient } from "../src/generated/prisma/client";
import { forumTopicsSeed } from "./content-seed";

export async function seedForum(prisma: PrismaClient) {
  const adminEmail =
    (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim().toLowerCase() || "";

  let author = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail } })
    : null;

  if (!author) {
    author = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  }
  if (!author) {
    author = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  }
  if (!author) {
    console.warn("Forum seed skipped: no users in database");
    return;
  }

  for (const topic of forumTopicsSeed) {
    const existing = await prisma.forumTopic.findFirst({
      where: { title: topic.title, locale: topic.locale },
    });
    if (existing) continue;

    await prisma.forumTopic.create({
      data: {
        authorId: author.id,
        title: topic.title,
        body: topic.body,
        locale: topic.locale,
        isPinned: topic.isPinned ?? false,
      },
    });
  }

  const welcome = await prisma.forumTopic.findFirst({
    where: { title: forumTopicsSeed[0].title, locale: "en" },
    include: { replies: true },
  });

  if (welcome && welcome.replies.length === 0) {
    const demoUser = await prisma.user.findFirst({
      where: { email: { startsWith: "demo+" } },
    });
    if (demoUser && demoUser.id !== author.id) {
      await prisma.forumReply.create({
        data: {
          topicId: welcome.id,
          authorId: demoUser.id,
          body: "Hi everyone — Nara from the demo profiles here. Toronto based, happy to share tips on the forum!",
        },
      });
    }
  }

  console.log("Forum topics seeded");
}
