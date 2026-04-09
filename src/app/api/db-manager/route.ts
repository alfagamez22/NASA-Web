import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/app/api/_helpers";

// GET /api/db-manager — list saved queries
export async function GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const queries = await prisma.superAdminSavedQuery.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json(queries);
}

// POST /api/db-manager — execute a query or save one
export async function POST(req: NextRequest) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { action, sql, name, id } = (await req.json()) as {
    action: "execute" | "save" | "delete";
    sql?: string;
    name?: string;
    id?: string;
  };

  if (action === "execute") {
    if (!sql?.trim()) return NextResponse.json({ error: "SQL required" }, { status: 400 });

    // Security: only allow SELECT and certain read-only statements
    const trimmed = sql.trim().toUpperCase();
    const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"];
    const firstWord = trimmed.split(/\s+/)[0];
    if (forbidden.includes(firstWord)) {
      return NextResponse.json({ error: "Only read-only queries (SELECT, EXPLAIN, SHOW) are allowed" }, { status: 403 });
    }

    // Additional safety: block any semicolons followed by write operations (multi-statement injection)
    if ((sql.match(/;/g) || []).length > 1) {
      return NextResponse.json({ error: "Multi-statement queries are not allowed" }, { status: 403 });
    }

    try {
      const result = await prisma.$queryRawUnsafe(sql.trim());
      const rows = Array.isArray(result) ? result : [result];
      // Limit returned rows
      const limited = rows.slice(0, 500);
      const columns = limited.length > 0 ? Object.keys(limited[0] as Record<string, unknown>) : [];

      return NextResponse.json({
        columns,
        rows: limited.map((r) => {
          const row: Record<string, unknown> = {};
          for (const col of columns) {
            const val = (r as Record<string, unknown>)[col];
            // Convert BigInt to string for JSON serialization
            row[col] = typeof val === "bigint" ? val.toString() : val;
          }
          return row;
        }),
        rowCount: rows.length,
        truncated: rows.length > 500,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Query failed" }, { status: 400 });
    }
  }

  if (action === "save") {
    if (!sql?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "Name and SQL required" }, { status: 400 });
    }

    const saved = await prisma.superAdminSavedQuery.create({
      data: {
        name: name.trim(),
        queryText: sql.trim(),
        userId: session!.user.id,
      },
    });

    return NextResponse.json(saved);
  }

  if (action === "delete") {
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.superAdminSavedQuery.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
