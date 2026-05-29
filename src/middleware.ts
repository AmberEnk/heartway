import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(en|mn|mn-Inner)(\/|$)/);
  const locale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = pathname.replace(/^\/(en|mn|mn-Inner)/, "") || "/";

  const isAdmin = pathWithoutLocale.startsWith("/admin");

  if (isAdmin && req.auth) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const email = req.auth.user?.email?.toLowerCase() ?? "";
    const role = (req.auth.user as { role?: string })?.role;
    const isAdminUser =
      role === "ADMIN" || (adminEmails.length > 0 && adminEmails.includes(email));
    if (!isAdminUser) {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
