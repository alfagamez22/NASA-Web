import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

const DEFAULTS = {
  id: "singleton",
  contactEmail: "gtnocradioaccess@globe.com.ph",
};

// GET /api/site-config
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: DEFAULTS,
  });

  return NextResponse.json(config);
}

// PUT /api/site-config
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {
      contactEmail: body.contactEmail,
    },
    create: {
      ...DEFAULTS,
      contactEmail: body.contactEmail ?? DEFAULTS.contactEmail,
    },
  });

  return NextResponse.json(config);
}
