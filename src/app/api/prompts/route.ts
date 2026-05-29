import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const prompts = await prisma.prompt.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ prompts });
}
