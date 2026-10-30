"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";

export type InviteActionResult = { token?: string; error?: string };

// The raw token is returned once and never stored; only its hash is saved.
export async function createInviteLink(
  locale: string,
  requestId: string,
): Promise<InviteActionResult> {
  await requireUser(locale);
  const supabase = await createClient();

  const token = generateInviteToken();
  const { error } = await supabase.rpc("rotate_invite_token", {
    p_request_id: requestId,
    p_token_hash: hashInviteToken(token),
  });

  if (error) {
    return { error: error.code === "23514" ? "requestFinished" : "createFailed" };
  }

  revalidatePath(`/${locale}/app/requests/${requestId}`);
  return { token };
}

export async function revokeInviteLink(
  locale: string,
  requestId: string,
): Promise<InviteActionResult> {
  await requireUser(locale);
  const supabase = await createClient();

  const { error } = await supabase
    .from("invite_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .is("revoked_at", null);

  if (error) return { error: "revokeFailed" };

  revalidatePath(`/${locale}/app/requests/${requestId}`);
  return {};
}
