"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function CommunityTabs() {
  const t = useTranslations("community");
  const pathname = usePathname();
  const onForum = pathname.startsWith("/forum");

  return (
    <nav
      className="mb-6 flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1"
      aria-label={t("title")}
    >
      <Link
        href="/blog"
        className={cn(
          "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
          !onForum
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        )}
      >
        {t("blog")}
      </Link>
      <Link
        href="/forum"
        className={cn(
          "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
          onForum
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        )}
      >
        {t("forum")}
      </Link>
    </nav>
  );
}
