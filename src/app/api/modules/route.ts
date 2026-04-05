import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/app/api/_helpers";

// GET /api/modules
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(modules);
}
