import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const pathWithoutLocale = pathname.replace(/^\/(en|mn|mn-Inner)/, "") || "/";
      const isProtected = ["/discover", "/matches", "/messages", "/profile", "/settings", "/onboarding"].some(
        (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
      );
      const isAdmin = pathWithoutLocale.startsWith("/admin");
      if (isProtected || isAdmin) return !!auth;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      } else if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const userId = (token.id ?? token.sub) as string;
        session.user.id = userId;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
