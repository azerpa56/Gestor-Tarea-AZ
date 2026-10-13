import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Status } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const { searchParams } = request.nextUrl;
  const areaId = searchParams.get("areaId");
  const status = searchParams.get("status");
  const urgent = searchParams.get("urgent");

  const tasks = await prisma.task.findMany({
    where: {
      ...(areaId ? { areaId } : {}),
      ...(status && Object.values(Status).includes(status as Status)
        ? { status: status as Status }
        : {}),
      ...(urgent === "true" ? { urgent: true } : {}),
    },
    include: { area: true },
    orderBy: [{ urgent: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const { title, description, areaId, urgent, dueDate, tools, status } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  if (!areaId || typeof areaId !== "string") {
    return NextResponse.json({ error: "El área es obligatoria" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description ?? null,
      areaId,
      urgent: Boolean(urgent),
      dueDate: dueDate ? new Date(dueDate) : null,
      tools: Array.isArray(tools) ? tools : [],
      status: status ?? undefined,
    },
    include: { area: true },
  });

  return NextResponse.json(task, { status: 201 });
}
