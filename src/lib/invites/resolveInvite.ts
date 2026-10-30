import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyInvite,
  hashInviteToken,
  isWellFormedInviteToken,
} from "@/lib/invites/token";
import { guestSafeDisplayName } from "@/lib/profile/displayName";

export type InviteRequest = {
  id: string;
  title: string;
  occasion: string | null;
  event_at: string | null;
  notes: string | null;
  ownerName: string | null;
};

export type ResolvedInvite =
  | { status: "invalid" }
  | { status: "closed" | "valid"; request: InviteRequest };

type InviteRow = {
  revoked_at: string | null;
  styling_requests: Omit<InviteRequest, "ownerName"> & {
    status: string;
    owner: { display_name: string | null } | null;
  };
};

// Guests have no Supabase session, so this reads with the secret key; the
// token itself is the authorization. Only guest-safe request fields leave here.
export async function resolveInvite(token: string): Promise<ResolvedInvite> {
  if (!isWellFormedInviteToken(token)) return { status: "invalid" };

  const { data, error } = await createAdminClient()
    .from("invite_tokens")
    .select(
      "revoked_at, styling_requests!inner(id, title, occasion, event_at, notes, status, owner:profiles(display_name))",
    )
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle<InviteRow>();

  // A failed lookup must not be reported to the guest as an invalid link.
  if (error) throw new Error(`invite lookup failed: ${error.message}`);

  const status = classifyInvite(
    data && { revoked_at: data.revoked_at, request_status: data.styling_requests.status },
  );
  if (status === "invalid" || !data) return { status: "invalid" };

  const { id, title, occasion, event_at, notes, owner } = data.styling_requests;
  return {
    status,
    request: {
      id,
      title,
      occasion,
      event_at,
      notes,
      ownerName: guestSafeDisplayName(owner?.display_name),
    },
  };
}
