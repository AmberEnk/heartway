import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!session) return { session: null, error: unauthorized() };

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = session.user.email?.toLowerCase() ?? "";
  const isAdmin =
    session.user.role === UserRole.ADMIN ||
    (adminEmails.length > 0 && adminEmails.includes(email));

  if (!isAdmin) {
    return { session: null, error: forbidden() };
  }

  return { session, error: null };
}
