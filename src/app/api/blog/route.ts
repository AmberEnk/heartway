import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";
  const slug = searchParams.get("slug");

  if (slug) {
    const post = await prisma.blogPost.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (!post?.published) {
      return NextResponse.json({ post: null }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  const posts = await prisma.blogPost.findMany({
    where: { locale, published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      locale: true,
    },
  });

  return NextResponse.json({ posts });
}
