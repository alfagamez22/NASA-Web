import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/teams — includes spine, teams with members
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const type = req.nextUrl.searchParams.get("type"); // "spine" | "teams"

  if (type === "spine") {
    const spine = await prisma.spineMember.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(spine);
  }

  const teams = await prisma.team.findMany({
    orderBy: { seqId: "asc" },
    include: { members: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(teams);
}

// POST /api/teams
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "spine") {
    const spine = await prisma.spineMember.create({
      data: { name: body.name, role: body.role, img: body.img ?? "/placeholder.jpg", order: body.order ?? 0 },
    });
    return NextResponse.json(spine, { status: 201 });
  }

  const team = await prisma.team.create({
    data: { seqId: body.seqId, label: body.label },
  });
  return NextResponse.json(team, { status: 201 });
}

// PUT /api/teams
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "spine") {
    const spine = await prisma.spineMember.update({
      where: { id: body.id },
      data: { name: body.name, role: body.role, img: body.img, order: body.order },
    });
    return NextResponse.json(spine);
  }

  if (body.type === "member") {
    const member = await prisma.teamMember.update({
      where: { id: body.id },
      data: { name: body.name, img: body.img, role: body.role, order: body.order },
    });
    return NextResponse.json(member);
  }

  const team = await prisma.team.update({
    where: { id: body.id },
    data: { label: body.label },
  });
  return NextResponse.json(team);
}

// DELETE /api/teams?id=xxx&type=spine|team|member
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (type === "spine") {
    await prisma.spineMember.delete({ where: { id } });
  } else if (type === "member") {
    await prisma.teamMember.delete({ where: { id } });
  } else {
    await prisma.team.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
