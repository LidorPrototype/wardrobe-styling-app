"use server";

import { redirect } from "@/lib/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveInvite } from "@/lib/invites/resolveInvite";
import { hashPassphrase, verifyPassphrase } from "@/lib/guests/passphrase";
import {
  GuestJoinSchema,
  isLocked,
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  nicknameKey,
} from "@/lib/guests/rules";
import { endGuestSession, startGuestSession } from "@/lib/guests/session";

export type JoinState = { error?: string; nickname?: string } | undefined;

type Identity = { id: string; passphrase_hash: string; locked_until: string | null };

async function findIdentity(requestId: string, nickname: string): Promise<Identity | null> {
  const { data, error } = await createAdminClient()
    .from("guest_identities")
    .select("id, passphrase_hash, locked_until")
    .eq("request_id", requestId)
    .eq("nickname_key", nicknameKey(nickname))
    .maybeSingle<Identity>();
  if (error) throw new Error(`guest lookup failed: ${error.message}`);
  return data;
}

export async function joinAsGuest(
  locale: string,
  token: string,
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const nickname = String(formData.get("nickname") ?? "");
  const parsed = GuestJoinSchema.safeParse({
    nickname,
    passphrase: String(formData.get("passphrase") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, nickname };

  const invite = await resolveInvite(token);
  if (invite.status === "invalid") return { error: "invalidLink", nickname };
  const requestId = invite.request.id;
  const admin = createAdminClient();

  let identity = await findIdentity(requestId, parsed.data.nickname);

  if (!identity) {
    if (invite.status === "closed") return { error: "closedNoNewJoins", nickname };

    const { data, error } = await admin
      .from("guest_identities")
      .insert({
        request_id: requestId,
        nickname: parsed.data.nickname,
        passphrase_hash: await hashPassphrase(parsed.data.passphrase),
      })
      .select("id")
      .single();

    if (data) {
      await startGuestSession(data.id, requestId);
      redirect({ href: `/guest/request/${requestId}`, locale });
    }
    // Someone took the nickname between the lookup and the insert: sign in instead.
    if (error?.code !== "23505") return { error: "joinFailed", nickname };
    identity = await findIdentity(requestId, parsed.data.nickname);
    if (!identity) return { error: "joinFailed", nickname };
  }

  // Checked before hashing so a locked nickname costs no scrypt work.
  if (isLocked(identity.locked_until)) return { error: "locked", nickname };

  if (!(await verifyPassphrase(parsed.data.passphrase, identity.passphrase_hash))) {
    const { data: lockedUntil, error } = await admin.rpc("record_guest_login_failure", {
      p_identity_id: identity.id,
      p_max_attempts: MAX_FAILED_ATTEMPTS,
      p_lock_minutes: LOCK_MINUTES,
    });
    if (error) throw new Error(`could not record failed attempt: ${error.message}`);
    return { error: isLocked(lockedUntil) ? "locked" : "wrongPassphrase", nickname };
  }

  await admin
    .from("guest_identities")
    .update({ failed_attempts: 0, locked_until: null, last_seen_at: new Date().toISOString() })
    .eq("id", identity.id);
  await startGuestSession(identity.id, requestId);
  redirect({ href: `/guest/request/${requestId}`, locale });
}

export async function leaveAsGuest(locale: string, requestId: string) {
  await endGuestSession(requestId);
  redirect({ href: `/guest/request/${requestId}`, locale });
}
