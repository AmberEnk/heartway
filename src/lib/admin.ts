import { UserRole } from "@/generated/prisma/client";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(
  email?: string | null,
  role?: UserRole | string | null
): boolean {
  const adminEmails = getAdminEmails();
  const normalized = email?.toLowerCase() ?? "";
  return (
    role === UserRole.ADMIN ||
    role === "ADMIN" ||
    (adminEmails.length > 0 && adminEmails.includes(normalized))
  );
}
