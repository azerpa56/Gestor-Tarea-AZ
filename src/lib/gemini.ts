import { GoogleGenerativeAI } from "@google/generative-ai";

export type TaskSuggestion = {
  category: "UNIVERSIDAD" | "TRABAJO" | "OTROS";
  urgent: boolean;
  tools: string[];
  dueDate: string | null;
  title: string | null;
};

const MODEL_NAME = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function suggestTaskFields(text: string): Promise<TaskSuggestion> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `Eres un asistente que clasifica tareas pendientes de una persona a partir de una descripción en lenguaje natural (puede venir de texto escrito o de un dictado por voz, en español).

Fecha de hoy: ${today}

Descripción de la tarea: """${text}"""

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicación) con esta forma exacta:
{
  "title": "título corto de la tarea (máximo 8 palabras) o null si no se puede inferir",
  "category": "UNIVERSIDAD" | "TRABAJO" | "OTROS",
  "urgent": true | false,
  "tools": ["herramienta1", "herramienta2"],
  "dueDate": "YYYY-MM-DD" | null
}

Reglas:
- "category": UNIVERSIDAD si menciona clases, exámenes, tareas académicas, profesores, universidad; TRABAJO si menciona trabajo, oficina, jefe, reuniones, clientes, proyectos laborales; OTROS en cualquier otro caso.
- "urgent": true si el texto sugiere urgencia, un plazo muy próximo (hoy/mañana), o usa palabras como "urgente", "importante", "ya", "ahora".
- "tools": lista breve de herramientas u objetos necesarios para realizar la tarea (ej. "laptop", "calculadora", "libro de cálculo"), vacío si no se mencionan ni se pueden inferir con confianza.
- "dueDate": si el texto menciona una fecha o día relativo (ej. "el viernes", "mañana", "el 20"), conviértelo a fecha absoluta ISO usando la fecha de hoy como referencia. Si no hay ninguna indicación de fecha, usa null.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const jsonText = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  const parsed = JSON.parse(jsonText);

  return {
    title: typeof parsed.title === "string" ? parsed.title : null,
    category: ["UNIVERSIDAD", "TRABAJO", "OTROS"].includes(parsed.category)
      ? parsed.category
      : "OTROS",
    urgent: Boolean(parsed.urgent),
    tools: Array.isArray(parsed.tools) ? parsed.tools.filter((t: unknown) => typeof t === "string") : [],
    dueDate: typeof parsed.dueDate === "string" ? parsed.dueDate : null,
  };
}
