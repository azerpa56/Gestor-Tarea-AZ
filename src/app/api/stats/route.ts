import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const areas = await prisma.area.findMany({
    orderBy: { order: "asc" },
    include: { tasks: { select: { status: true } } },
  });

  const stats = areas.map((area) => {
    const total = area.tasks.length;
    const done = area.tasks.filter((t) => t.status === "DONE").length;
    const pending = total - done;
    const percentDone = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      id: area.id,
      name: area.name,
      color: area.color,
      total,
      done,
      pending,
      percentDone,
    };
  });

  const overall = {
    total: stats.reduce((sum, a) => sum + a.total, 0),
    done: stats.reduce((sum, a) => sum + a.done, 0),
  };

  return NextResponse.json({
    areas: stats,
    overall: {
      ...overall,
      percentDone: overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0,
    },
  });
}
