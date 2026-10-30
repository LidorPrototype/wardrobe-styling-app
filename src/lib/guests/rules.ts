import * as z from "zod";

export const NICKNAME_MAX = 30;
export const PASSPHRASE_MIN = 6;
// Caps the work a single request can force through scrypt.
export const PASSPHRASE_MAX = 200;
export const MAX_FAILED_ATTEMPTS = 10;
export const LOCK_MINUTES = 15;
export const SESSION_DAYS = 30;

// Must match the generated `nickname_key` column in guest_identities.
export function nicknameKey(nickname: string): string {
  return nickname.trim().toLowerCase();
}

export const GuestJoinSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "nicknameRequired")
    .max(NICKNAME_MAX, "nicknameTooLong"),
  // Not trimmed: spaces are part of a passphrase.
  passphrase: z
    .string()
    .min(PASSPHRASE_MIN, "passphraseTooShort")
    .max(PASSPHRASE_MAX, "passphraseTooLong")
    .refine((v) => v.trim().length > 0, "passphraseTooShort"),
});

export function isLocked(lockedUntil: string | null, now = new Date()): boolean {
  return lockedUntil !== null && new Date(lockedUntil) > now;
}

export function isSessionExpired(lastSeenAt: string, now = new Date()): boolean {
  return now.getTime() - new Date(lastSeenAt).getTime() > SESSION_DAYS * 24 * 60 * 60 * 1000;
}
