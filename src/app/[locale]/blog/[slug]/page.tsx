export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

function renderMarkdown(content: string) {
  return content
    .split("\n\n")
    .map((block, i) => {
      if (block.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold mt-6 mb-2">
            {block.slice(3)}
          </h2>
        );
      }
      return (
        <p key={i} className="mb-4 leading-relaxed">
          {block}
        </p>
      );
    });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const post = await prisma.blogPost.findUnique({
    where: { slug_locale: { slug, locale } },
  });

  if (!post?.published) notFound();

  return (
    <AppShell>
      <Link href="/blog" className="text-sm text-[var(--primary)]">
        ← {t("backToList")}
      </Link>
      <article className="mt-4 prose-blog">
        {post.coverImage && (
          <div className="relative mb-6 h-48 w-full overflow-hidden rounded-2xl">
            <Image src={post.coverImage} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <h1 className="text-2xl font-bold">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-sm text-[var(--muted)]">
            {t("publishedOn", { date: format(post.publishedAt, "PP") })}
          </p>
        )}
        <div className="mt-6">{renderMarkdown(post.content)}</div>
      </article>
    </AppShell>
  );
}
