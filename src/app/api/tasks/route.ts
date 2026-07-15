import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category, Status } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const urgent = searchParams.get("urgent");

  const tasks = await prisma.task.findMany({
    where: {
      ...(category && Object.values(Category).includes(category as Category)
        ? { category: category as Category }
        : {}),
      ...(status && Object.values(Status).includes(status as Status)
        ? { status: status as Status }
        : {}),
      ...(urgent === "true" ? { urgent: true } : {}),
    },
    orderBy: [{ urgent: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category, urgent, dueDate, tools, status } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description ?? null,
      category: category ?? undefined,
      urgent: Boolean(urgent),
      dueDate: dueDate ? new Date(dueDate) : null,
      tools: Array.isArray(tools) ? tools : [],
      status: status ?? undefined,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
