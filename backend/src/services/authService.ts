import crypto from "node:crypto";
import type { Request } from "express";
import type { RowDataPacket } from "mysql2";
import { UserActivityMongo } from "../db/mongo.js";
import { pool, type UserRow } from "../db/mysql.js";
import { env } from "../env.js";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
}

interface TokenPayload extends AuthUser {
  exp: number;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

function signPayload(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", env.authSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", env.authSecret).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export async function login(email: string, password: string): Promise<{
  token: string;
  user: AuthUser;
} | null> {
  const [rows] = await pool.execute<UserRow[] & RowDataPacket[]>(
    `SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  const user = rows[0];
  if (!user || user.password_hash !== hashPassword(password)) return null;

  const authUser = toAuthUser(user);
  await UserActivityMongo.create({
    userId: authUser.id,
    action: "login",
    metadata: { email: authUser.email },
  });

  return {
    token: signPayload({ ...authUser, exp: Date.now() + 1000 * 60 * 60 * 8 }),
    user: authUser,
  };
}
