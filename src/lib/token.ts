import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/AppError";

type TokenPayload = {
  sub: string;
  exp: number;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function sign(body: string): string {
  return createHmac("sha256", env.dashboard.secret)
    .update(body)
    .digest("base64url");
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function signDashboardToken(email: string): string {
  const payload: TokenPayload = {
    sub: email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyDashboardToken(token: string): string {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    throw new UnauthorizedError("Please sign in again.");
  }
  if (!equal(signature, sign(body))) {
    throw new UnauthorizedError("Please sign in again.");
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    throw new UnauthorizedError("Please sign in again.");
  }

  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedError("Your session expired. Please sign in again.");
  }

  return payload.sub;
}

export function passwordsMatch(given: string, expected: string): boolean {
  return equal(given, expected);
}
