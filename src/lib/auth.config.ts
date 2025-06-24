
import type { CookieSerializeOptions } from 'cookie';

export interface UserSession {
  id: number; // User's numeric ID
  username: string;
  role: 'student' | 'instructor';
  avatarUrl?: string | null;
}

export const AUTH_COOKIE_NAME = 'course_compass_session';

export const AUTH_COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', 
  path: '/',
  sameSite: 'lax', // CSRF protection
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
