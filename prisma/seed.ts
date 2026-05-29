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

  const samplePosts = [
    {
      slug: "first-date-tips",
      locale: "en",
      title: "First date tips that actually work",
      excerpt: "Keep it light, be yourself, and leave room for a second date.",
      content:
        "## Be present\n\nPut your phone away and listen more than you talk.\n\n## Choose comfort\n\nPick a place where you both can relax and exit gracefully if chemistry isn't there.",
      published: true,
      publishedAt: new Date(),
    },
    {
      slug: "first-date-tips",
      locale: "mn",
      title: "Анхны уулзалтын зөвлөгөө",
      excerpt: "Бага зэрэг, байгалийн бай, хоёр дахь уулзалт үлдээ.",
      content:
        "## Битгий утсаа барь\n\nСонсох нь ярихаас илүү чухал.\n\n## Тав тухтай газар сонго",
      published: true,
      publishedAt: new Date(),
    },
  ];

  for (const post of samplePosts) {
    await prisma.blogPost.upsert({
      where: { slug_locale: { slug: post.slug, locale: post.locale } },
      create: post,
      update: post,
    });
  }

  const { seedDemoData } = await import("./demo-data");
  await seedDemoData(prisma);

  console.log("Seed complete: prompts, blog posts, and demo profiles");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
