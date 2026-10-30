import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
// base64url of 32 bytes, no padding.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateSecretToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

// A fast hash is enough here: the token is random, not a guessable password.
export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isWellFormedInviteToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export type InviteStatus = "valid" | "invalid" | "closed";

export function classifyInvite(
  invite: { revoked_at: string | null; request_status: string } | null,
): InviteStatus {
  if (!invite || invite.revoked_at) return "invalid";
  if (invite.request_status === "finished") return "closed";
  return "valid";
}
