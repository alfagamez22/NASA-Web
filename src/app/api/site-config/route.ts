import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

const DEFAULTS = {
  id: "singleton",
  contactEmail: "gtnocradioaccess@globe.com.ph",
  headerTitle: "NASA",
  headerSubtitle: "",
  footerTitle: "NASA",
  footerSubtitle: "NETWORK OPERATIONS & ASSURANCE CENTER",
  footerAbout: "ABOUT",
  footerSubmit: "SUBMIT TOOL",
  footerPrivacy: "PRIVACY",
  footerTerms: "TERMS",
  footerFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX.",
  knowMoreHeading: "KNOW MORE ABOUT...",
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

  const data: Record<string, string> = {};
  const allowedFields = [
    "contactEmail", "headerTitle", "headerSubtitle",
    "footerTitle", "footerSubtitle", "footerAbout", "footerSubmit",
    "footerPrivacy", "footerTerms", "footerFeedback", "knowMoreHeading",
  ];
  for (const field of allowedFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { ...DEFAULTS, ...data },
  });

  return NextResponse.json(config);
}
