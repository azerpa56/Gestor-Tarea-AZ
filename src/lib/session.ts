import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tareas_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secret(): string | null {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** Token `exp.firma`: solo el servidor (con SESSION_SECRET) puede emitirlo. */
export function createSessionToken(): string | null {
  const key = secret();
  if (!key) return null;
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${exp}.${sign(exp, key)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [exp, signature] = token.split(".");
  if (!exp || !signature || Number(exp) * 1000 < Date.now()) return false;
  const expected = Buffer.from(sign(exp, key));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isValidPassword(password: unknown): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  const a = createHmac("sha256", "cmp").update(password).digest();
  const b = createHmac("sha256", "cmp").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Defensa en profundidad para las rutas de la API, además de src/proxy.ts. */
export async function requireSession(): Promise<NextResponse | null> {
  const store = await cookies();
  if (isValidSessionToken(store.get(SESSION_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "No autenticado" }, { status: 401 });
}
