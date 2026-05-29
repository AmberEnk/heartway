import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";

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

  if (!isAdminUser(session.user.email, session.user.role)) {
    return { session: null, error: forbidden() };
  }

  return { session, error: null };
}
