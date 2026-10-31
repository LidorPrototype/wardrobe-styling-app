import "server-only";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSecretToken, hashSecretToken } from "@/lib/invites/token";
import { guestSafeDisplayName } from "@/lib/profile/displayName";
import { isSessionExpired, SESSION_DAYS } from "@/lib/guests/rules";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One cookie per request, so a browser can be a guest on several requests.
const cookieName = (requestId: string) => `guest_${requestId}`;

export type GuestSession = {
  sessionId: string;
  identityId: string;
  nickname: string;
  request: {
    id: string;
    title: string;
    occasion: string | null;
    event_at: string | null;
    notes: string | null;
    status: string;
    wardrobe_id: string;
    ownerName: string | null;
  };
};

type SessionRow = {
  id: string;
  last_seen_at: string;
  guest_identities: { id: string; nickname: string };
  styling_requests: Omit<GuestSession["request"], "ownerName"> & {
    owner: { display_name: string | null } | null;
  };
};

// Call only from a Server Function: it sets the cookie.
export async function startGuestSession(identityId: string, requestId: string) {
  const token = generateSecretToken();
  const admin = createAdminClient();

  const { error } = await admin.from("guest_sessions").insert({
    guest_identity_id: identityId,
    request_id: requestId,
    session_token_hash: hashSecretToken(token),
  });
  if (error) throw new Error(`could not start guest session: ${error.message}`);

  (await cookies()).set(cookieName(requestId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getGuestSession(requestId: string): Promise<GuestSession | null> {
  // A malformed id would make Postgres reject the uuid comparison.
  if (!UUID.test(requestId)) return null;
  const token = (await cookies()).get(cookieName(requestId))?.value;
  if (!token) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("guest_sessions")
    .select(
      "id, last_seen_at, guest_identities!inner(id, nickname), styling_requests!inner(id, title, occasion, event_at, notes, status, wardrobe_id, owner:profiles(display_name))",
    )
    .eq("session_token_hash", hashSecretToken(token))
    .eq("request_id", requestId)
    .maybeSingle<SessionRow>();

  if (error) throw new Error(`guest session lookup failed: ${error.message}`);
  if (!data || isSessionExpired(data.last_seen_at)) return null;

  // Sliding expiry, written at most hourly to avoid a write per page view.
  if (Date.now() - new Date(data.last_seen_at).getTime() > 60 * 60 * 1000) {
    const now = new Date().toISOString();
    await admin.from("guest_sessions").update({ last_seen_at: now }).eq("id", data.id);
    await admin.from("guest_identities").update({ last_seen_at: now }).eq("id", data.guest_identities.id);
  }

  const { owner, ...request } = data.styling_requests;
  return {
    sessionId: data.id,
    identityId: data.guest_identities.id,
    nickname: data.guest_identities.nickname,
    request: { ...request, ownerName: guestSafeDisplayName(owner?.display_name) },
  };
}

// Call only from a Server Function: it deletes the cookie.
export async function endGuestSession(requestId: string) {
  const store = await cookies();
  const token = store.get(cookieName(requestId))?.value;
  if (token) {
    await createAdminClient()
      .from("guest_sessions")
      .delete()
      .eq("session_token_hash", hashSecretToken(token));
  }
  store.delete(cookieName(requestId));
}
