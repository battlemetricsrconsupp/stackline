import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const SESSION_COOKIE_NAME = "stackline_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieSession = {
  token: string;
};

export async function setSessionCookie(token = randomUUID()) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCookieSession(): Promise<CookieSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return token ? { token } : null;
}
