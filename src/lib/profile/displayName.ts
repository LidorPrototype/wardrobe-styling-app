export const DISPLAY_NAME_MAX = 40;

export type DisplayNameInput =
  | { ok: true; value: string | null }
  | { ok: false; error: "nameInvalid" };

// Shown to anyone holding an invite link, so it must never be an email.
export function parseDisplayName(raw: string): DisplayNameInput {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > DISPLAY_NAME_MAX || value.includes("@")) {
    return { ok: false, error: "nameInvalid" };
  }
  return { ok: true, value };
}

// Older profiles defaulted display_name to the account email; treat those as unset.
export function guestSafeDisplayName(stored: string | null | undefined): string | null {
  const value = stored?.trim();
  return value && !value.includes("@") ? value : null;
}
