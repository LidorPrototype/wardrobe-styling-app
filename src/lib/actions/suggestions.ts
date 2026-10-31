"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestSession } from "@/lib/guests/session";
import { SuggestionSchema, type SuggestionInput } from "@/lib/suggestions/rules";

export type SuggestionFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return SuggestionSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items: formData.getAll("item").map(String),
  });
}

// Archived items are hidden from the builder; a direct POST must not use them either.
async function itemsAreAvailable(
  client: SupabaseClient,
  wardrobeId: string,
  input: SuggestionInput,
): Promise<boolean> {
  const ids = input.items.map((i) => i.itemId);
  const { data, error } = await client
    .from("clothing_items")
    .select("id")
    .eq("wardrobe_id", wardrobeId)
    .eq("is_archived", false)
    .in("id", ids);
  if (error) throw new Error(`item check failed: ${error.message}`);
  return data.length === ids.length;
}

async function saveSuggestion(
  client: SupabaseClient,
  requestId: string,
  author: { guestIdentityId: string } | { ownerId: string },
  input: SuggestionInput,
): Promise<SuggestionFormState> {
  const { error } = await client.rpc("create_outfit_suggestion", {
    p_request_id: requestId,
    p_guest_identity_id: "guestIdentityId" in author ? author.guestIdentityId : null,
    p_owner_id: "ownerId" in author ? author.ownerId : null,
    p_title: input.title ?? null,
    p_notes: input.notes ?? null,
    p_items: input.items.map((i, index) => ({ item_id: i.itemId, slot: i.slot, sort_order: index })),
  });
  if (!error) return undefined;
  // check_violation: the request was finished in the meantime.
  return { error: error.code === "23514" ? "requestFinished" : "saveFailed" };
}

export async function createGuestSuggestion(
  locale: string,
  requestId: string,
  _prev: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const session = await getGuestSession(requestId);
  if (!session) return { error: "notSignedIn" };
  if (session.request.status === "finished") return { error: "requestFinished" };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  if (!(await itemsAreAvailable(admin, session.request.wardrobe_id, parsed.data))) {
    return { error: "invalidItem" };
  }

  const failed = await saveSuggestion(admin, requestId, { guestIdentityId: session.identityId }, parsed.data);
  if (failed) return failed;

  redirect({ href: `/guest/request/${requestId}`, locale });
}

export async function createOwnerSuggestion(
  locale: string,
  requestId: string,
  _prev: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const user = await requireUser(locale);
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("styling_requests")
    .select("id, status, wardrobe_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "saveFailed" };
  if (request.status === "finished") return { error: "requestFinished" };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await itemsAreAvailable(supabase, request.wardrobe_id, parsed.data))) {
    return { error: "invalidItem" };
  }

  const failed = await saveSuggestion(supabase, requestId, { ownerId: user.id }, parsed.data);
  if (failed) return failed;

  revalidatePath(`/${locale}/app/requests/${requestId}`);
  redirect({ href: `/app/requests/${requestId}`, locale });
}

export async function deleteGuestSuggestion(locale: string, requestId: string, suggestionId: string) {
  const session = await getGuestSession(requestId);
  if (!session || session.request.status === "finished") return;

  // Scoped to this guest: another guest's suggestion simply isn't matched.
  const { error } = await createAdminClient()
    .from("outfit_suggestions")
    .delete()
    .eq("id", suggestionId)
    .eq("request_id", requestId)
    .eq("guest_identity_id", session.identityId);
  if (error) throw new Error(`could not delete suggestion: ${error.message}`);

  revalidatePath(`/${locale}/guest/request/${requestId}`);
}

export async function deleteOwnerSuggestion(locale: string, requestId: string, suggestionId: string) {
  await requireUser(locale);
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("styling_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status === "finished") return;

  // RLS limits this to suggestions the owner wrote.
  const { error } = await supabase
    .from("outfit_suggestions")
    .delete()
    .eq("id", suggestionId)
    .eq("request_id", requestId);
  if (error) throw new Error(`could not delete suggestion: ${error.message}`);

  revalidatePath(`/${locale}/app/requests/${requestId}`);
}
