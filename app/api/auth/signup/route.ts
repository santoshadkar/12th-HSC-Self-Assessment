import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 409 }
    );
  }

  const info = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hashPassword(password));

  const { token, expiresAt } = createSession(Number(info.lastInsertRowid));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
