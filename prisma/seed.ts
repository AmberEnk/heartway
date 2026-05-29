import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const prompts = [
  { key: "ideal_sunday", sortOrder: 0 },
  { key: "green_flag", sortOrder: 1 },
  { key: "together_we_could", sortOrder: 2 },
  { key: "love_language", sortOrder: 3 },
  { key: "controversial_opinion", sortOrder: 4 },
];

async function main() {
  for (const p of prompts) {
    await prisma.prompt.upsert({
      where: { key: p.key },
      create: p,
      update: { sortOrder: p.sortOrder },
    });
  }

  const { blogPostsSeed } = await import("./content-seed");

  for (const post of blogPostsSeed) {
    await prisma.blogPost.upsert({
      where: { slug_locale: { slug: post.slug, locale: post.locale } },
      create: post,
      update: post,
    });
  }

  const { seedDemoData } = await import("./demo-data");
  await seedDemoData(prisma);

  const { seedForum } = await import("./seed-forum");
  await seedForum(prisma);

  console.log("Seed complete: prompts, blog posts, forum topics, and demo profiles");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
