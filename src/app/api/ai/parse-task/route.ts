import { type NextRequest, NextResponse } from "next/server";
import { suggestTaskFields } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Falta el texto de la tarea" }, { status: 400 });
  }

  try {
    const suggestion = await suggestTaskFields(text);
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Error al llamar a Gemini:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la sugerencia de IA" },
      { status: 502 },
    );
  }
}
