import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isValidPassword,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map<string, number[]>();

/** IP real del cliente: Traefik añade la suya al final de X-Forwarded-For. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() || "local";
}

function recentFailures(ip: string): number[] {
  const now = Date.now();
  const list = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(ip, list);
  return list;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (recentFailures(ip).length >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." },
      { status: 429 },
    );
  }

  const { password } = await request.json().catch(() => ({}));
  const token = isValidPassword(password) ? createSessionToken() : null;
  if (!token) {
    recentFailures(ip).push(Date.now());
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  failures.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
