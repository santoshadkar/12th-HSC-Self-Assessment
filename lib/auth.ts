import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sql } from "./db";

export const SESSION_COOKIE = "hsc_session";
const SESSION_DAYS = 30;

export type SessionUser = { id: number; name: string; email: string };

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function createSession(
  userId: number
): Promise<{ token: string; expiresAt: number }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await sql`
    INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})
  `;
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await sql<{
    id: number;
    name: string;
    email: string;
    expires_at: string | number;
  }>`
    SELECT u.id AS id, u.name AS name, u.email AS email, s.expires_at AS expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
  `;
  const row = rows[0];
  if (!row) return null;

  if (Number(row.expires_at) < Date.now()) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
}

export async function deleteSession(token: string) {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}
