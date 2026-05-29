"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  try {
    const result = await signIn("credentials", {
      email: normalized,
      password,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      return { ok: false as const, error: "invalid_credentials" };
    }

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false as const, error: "invalid_credentials" };
    }
    throw error;
  }
}
