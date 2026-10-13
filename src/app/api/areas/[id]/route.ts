import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const { name, color, order } = body;

  try {
    const area = await prisma.area.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });

    return NextResponse.json(area);
  } catch {
    return NextResponse.json({ error: "Área no encontrada" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const taskCount = await prisma.task.count({ where: { areaId: id } });
  if (taskCount > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${taskCount} tarea(s) en esta área` },
      { status: 409 },
    );
  }

  try {
    await prisma.area.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Área no encontrada" }, { status: 404 });
  }
}
