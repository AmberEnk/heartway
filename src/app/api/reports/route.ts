import { ReportReason } from "@/generated/prisma/client";
import { requireSession, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  reportedId: z.string(),
  reason: z.enum(ReportReason),
  details: z.string().max(1000).optional(),
  messageId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const data = schema.parse(await request.json());

    if (data.reportedId === session.user.id) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedId: data.reportedId,
        reason: data.reason,
        details: data.details,
        messageId: data.messageId,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
