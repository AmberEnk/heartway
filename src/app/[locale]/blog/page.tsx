export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const posts = await prisma.blogPost.findMany({
    where: { locale, published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <AppShell showNav={!!posts.length}>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("subtitle")}</p>

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">{t("empty")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
              >
                {post.coverImage && (
                  <div className="relative h-40 w-full">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {t("publishedOn", {
                        date: format(post.publishedAt, "PP"),
                      })}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
