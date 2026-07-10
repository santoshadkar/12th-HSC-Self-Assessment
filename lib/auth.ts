import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const SESSION_COOKIE = "hsc_session";
const SESSION_DAYS = 30;

export type SessionUser = { id: number; name: string; email: string };

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId: number): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt
  );
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id AS id, u.name AS name, u.email AS email, s.expires_at AS expiresAt
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as { id: number; name: string; email: string; expiresAt: number } | undefined;
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
}

export function deleteSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
