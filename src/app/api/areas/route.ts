import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_AREAS = [
  { name: "Universidad", color: "#6d5ef5", order: 0 },
  { name: "Trabajo", color: "#f5a524", order: 1 },
  { name: "Otros", color: "#64748b", order: 2 },
];

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const count = await prisma.area.count();

  if (count === 0) {
    await prisma.area.createMany({ data: DEFAULT_AREAS });
  }

  const areas = await prisma.area.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(areas);
}

export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "El nombre del área es obligatorio" }, { status: 400 });
  }

  const maxOrder = await prisma.area.aggregate({ _max: { order: true } });

  const area = await prisma.area.create({
    data: {
      name: name.trim(),
      color: typeof color === "string" && color ? color : undefined,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(area, { status: 201 });
}
