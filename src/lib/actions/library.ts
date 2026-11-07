"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { isDecision, LibraryEntrySchema, plausibleToday } from "@/lib/library/rules";

// Owner-only. RLS limits every call to the owner's own requests and library;
// record_outfit_decision sets the status and saves the library entry together.

export async function recordOutfitDecision(
  locale: string,
  requestId: string,
  suggestionId: string,
  decision: string,
  // The owner's local date, for "Mark worn" on a request without an event date.
  today?: string,
) {
  await requireUser(locale);
  if (!isDecision(decision)) return;

  const supabase = await createClient();
  const localToday = plausibleToday(today);
  const { error } = await supabase.rpc("record_outfit_decision", {
    p_suggestion_id: suggestionId,
    p_status: decision,
    ...(localToday ? { p_today: localToday } : {}),
  });
  // P0002: not one of this owner's suggestions (or just deleted).
  if (error && error.code !== "P0002") throw new Error(`could not save decision: ${error.message}`);

  revalidatePath(`/${locale}/app/requests/${requestId}`);
  revalidatePath(`/${locale}/app/library`);
}

// On error, what was typed comes back so the form can refill after React resets it.
export type LibraryEntryFormState =
  | { error?: string; ok?: number; values?: { wornOn: string; notes: string } }
  | undefined;

export async function updateLibraryEntry(
  locale: string,
  entryId: string,
  _prev: LibraryEntryFormState,
  formData: FormData,
): Promise<LibraryEntryFormState> {
  await requireUser(locale);
  const values = { wornOn: String(formData.get("wornOn") ?? ""), notes: String(formData.get("notes") ?? "") };
  const parsed = LibraryEntrySchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_library_entries")
    .update({ worn_on: parsed.data.wornOn, notes: parsed.data.notes })
    .eq("id", entryId)
    .select("id");
  if (error || data.length === 0) return { error: "saveFailed", values };

  revalidatePath(`/${locale}/app/library`);
  revalidatePath(`/${locale}/app/library/${entryId}`);
  return { ok: Date.now() };
}

export async function deleteLibraryEntry(locale: string, entryId: string) {
  await requireUser(locale);
  const supabase = await createClient();
  const { error } = await supabase.from("outfit_library_entries").delete().eq("id", entryId);
  if (error) throw new Error(`could not delete library entry: ${error.message}`);

  revalidatePath(`/${locale}/app/library`);
  redirect({ href: "/app/library", locale });
}
