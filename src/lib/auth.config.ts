import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export interface UserSession {
  id: number;
  username: string;
  role: "student" | "instructor";
  avatarUrl?: string | null;
}

export const AUTH_COOKIE_NAME = "course_compass_session";

export const AUTH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "lax",
  maxAge: 1 * 24 * 60 * 60, // 1 day in seconds
};
