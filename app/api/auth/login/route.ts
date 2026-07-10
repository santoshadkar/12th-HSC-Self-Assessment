import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const { rows } = await sql<{ id: number; password_hash: string }>`
    SELECT id, password_hash FROM users WHERE email = ${email}
  `;
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
