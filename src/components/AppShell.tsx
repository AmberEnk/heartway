"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Compass,
  Heart,
  MessageCircle,
  User,
  BookOpen,
  MessagesSquare,
  Settings,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = session
    ? [
        { href: "/discover", icon: Compass, label: t("discover") },
        { href: "/matches", icon: Heart, label: t("matches") },
        { href: "/messages", icon: MessageCircle, label: t("messages") },
        { href: "/blog", icon: BookOpen, label: t("blog") },
        { href: "/forum", icon: MessagesSquare, label: t("forum") },
        { href: "/profile", icon: User, label: t("profile") },
      ]
    : [
        { href: "/blog", icon: BookOpen, label: t("blog") },
        { href: "/forum", icon: MessagesSquare, label: t("forum") },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="safe-top sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-[var(--primary)]">
            Heartway
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {session ? (
              <Link href="/settings" className="rounded-full p-2 hover:bg-[var(--border)]">
                <Settings className="h-5 w-5" aria-label={t("settings")} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
                >
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>

      {showNav && session && (
        <nav className="safe-bottom sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg justify-around py-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
                    active ? "text-[var(--primary)]" : "text-[var(--muted)]"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
