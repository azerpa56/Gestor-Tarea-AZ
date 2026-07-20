import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, include: { area: true } });

  if (!task) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, areaId, urgent, dueDate, tools, status } = body;

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(areaId !== undefined ? { areaId } : {}),
        ...(urgent !== undefined ? { urgent: Boolean(urgent) } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(tools !== undefined ? { tools: Array.isArray(tools) ? tools : [] } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: { area: true },
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
}
