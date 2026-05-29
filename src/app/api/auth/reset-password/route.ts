import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Sets a new password without email (MVP).
 * For production, replace with emailed reset links.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = schema.parse(await request.json());
    const normalized = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
