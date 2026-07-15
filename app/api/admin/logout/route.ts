import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/src/lib/admin-auth";

// Reachable only with a valid session (proxy-protected), which is fine — you
// must be logged in to log out. Clears the session cookie.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
