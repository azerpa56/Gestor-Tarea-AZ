import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { suggestTaskFields } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Falta el texto de la tarea" }, { status: 400 });
  }

  try {
    const areas = await prisma.area.findMany({ orderBy: { order: "asc" } });
    const suggestion = await suggestTaskFields(
      text,
      areas.map((a) => a.name),
    );

    const matchedArea = areas.find(
      (a) => a.name.toLowerCase() === suggestion.areaName?.toLowerCase(),
    );

    return NextResponse.json({
      title: suggestion.title,
      areaId: matchedArea?.id ?? null,
      urgent: suggestion.urgent,
      tools: suggestion.tools,
      dueDate: suggestion.dueDate,
    });
  } catch (error) {
    console.error("Error al llamar a Gemini:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la sugerencia de IA" },
      { status: 502 },
    );
  }
}
