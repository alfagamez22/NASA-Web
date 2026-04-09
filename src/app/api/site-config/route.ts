import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

const DEFAULTS: Record<string, unknown> = {
  id: "singleton",
  contactEmail: "gtnocradioaccess@globe.com.ph",
  headerTitle: "NASA",
  headerSubtitle: "",
  headerImage: "",
  footerTitle: "NASA",
  footerSubtitle: "NETWORK OPERATIONS & ASSURANCE CENTER",
  footerAbout: "ABOUT",
  footerSubmit: "SUBMIT TOOL",
  footerPrivacy: "PRIVACY",
  footerTerms: "TERMS",
  footerFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX.",
  footerSignoff: "HAVE A NICE DAY!",
  footerImage: "",
  knowMoreHeading: "KNOW MORE ABOUT...",
  reportHeading: "RAN REPORT",
  reportSubheading: "OFFICIAL NETWORK PHYSICAL LOCATION COUNT",
  teamDriveHeading: "TEAM DRIVE",
  teamDriveNotice: "*** THIS PAGE IS FOR NOC RAN USERS ONLY ***",
  teamDriveNoticeVisible: true,
  driveLabel: "DRIVE:",
  driveUrl: "",
  ranConfigHeading: "RAN CONFIGURATION PPM",
  ranConfigUrl: "",
  tdBottomTeams: "NTG | OSCC | TAC | RAN",
  tdBottomFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX. Just SCAN or CLICK the QR Code.",
  tdBottomSignoff: "Have a nice day!",
  qrUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform",
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

  const data: Record<string, unknown> = {};
  const stringFields = [
    "contactEmail", "headerTitle", "headerSubtitle", "headerImage",
    "footerTitle", "footerSubtitle", "footerAbout", "footerSubmit",
    "footerPrivacy", "footerTerms", "footerFeedback", "footerSignoff", "footerImage",
    "knowMoreHeading",
    "reportHeading", "reportSubheading",
    "teamDriveHeading", "teamDriveNotice",
    "driveLabel", "driveUrl", "ranConfigHeading", "ranConfigUrl",
    "tdBottomTeams", "tdBottomFeedback", "tdBottomSignoff",
    "qrUrl",
  ];
  const boolFields = ["teamDriveNoticeVisible"];

  for (const field of stringFields) {
    if (body[field] !== undefined) data[field] = String(body[field]);
  }
  for (const field of boolFields) {
    if (body[field] !== undefined) data[field] = Boolean(body[field]);
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { ...DEFAULTS, ...data },
  });

  return NextResponse.json(config);
}
