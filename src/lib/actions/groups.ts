"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { GroupSchema, membershipChanges } from "@/lib/groups/rules";

// Owner-only; RLS scopes every query to the owner's own groups and entries.

// On error, what was submitted, so the form can show it again after React resets it.
export type GroupFormValues = { name?: string; description?: string; groups?: string[]; newGroup?: string };
export type GroupFormState = { error?: string; ok?: number; values?: GroupFormValues } | undefined;

function groupValues(formData: FormData) {
  return { name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? "") };
}

// 23505: the owner already has a group with this name (case and spaces ignored).
const saveError = (code: string | undefined) => (code === "23505" ? "nameTaken" : "saveFailed");

function revalidateLibrary(locale: string) {
  revalidatePath(`/${locale}/app/library`, "layout");
}

export async function createGroup(locale: string, _prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const user = await requireUser(locale);
  const values = groupValues(formData);
  const parsed = GroupSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const supabase = await createClient();
  const { error } = await supabase.from("outfit_groups").insert({ owner_id: user.id, ...parsed.data });
  if (error) return { error: saveError(error.code), values };

  revalidateLibrary(locale);
  return { ok: Date.now() };
}

export async function updateGroup(
  locale: string,
  groupId: string,
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireUser(locale);
  const values = groupValues(formData);
  const parsed = GroupSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const supabase = await createClient();
  const { data, error } = await supabase.from("outfit_groups").update(parsed.data).eq("id", groupId).select("id");
  if (error) return { error: saveError(error.code), values };
  if (data.length === 0) return { error: "saveFailed", values };

  revalidateLibrary(locale);
  return { ok: Date.now() };
}

// The outfits stay in the library; only the grouping goes.
export async function deleteGroup(locale: string, groupId: string) {
  await requireUser(locale);
  const supabase = await createClient();
  const { error } = await supabase.from("outfit_groups").delete().eq("id", groupId);
  if (error) throw new Error(`could not delete group: ${error.message}`);

  revalidateLibrary(locale);
  redirect({ href: "/app/library/groups", locale });
}

// Puts the entry in exactly the checked groups, plus a new one when named.
export async function setEntryGroups(
  locale: string,
  entryId: string,
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const user = await requireUser(locale);
  const wanted = formData.getAll("group").map(String).filter((id) => z.uuid().safeParse(id).success);
  const newName = String(formData.get("newGroup") ?? "").trim();
  const values = { groups: [...wanted], newGroup: newName };
  const supabase = await createClient();

  if (newName) {
    const parsed = GroupSchema.safeParse({ name: newName, description: "" });
    if (!parsed.success) return { error: parsed.error.issues[0].message, values };
    const { data: group, error } = await supabase
      .from("outfit_groups")
      .insert({ owner_id: user.id, ...parsed.data })
      .select("id")
      .single();
    if (error) return { error: saveError(error.code), values };
    wanted.push(group.id);
  }

  const { data: current, error: currentError } = await supabase
    .from("outfit_group_memberships")
    .select("group_id")
    .eq("entry_id", entryId);
  if (currentError) return { error: "saveFailed", values };

  const { add, remove } = membershipChanges(current.map((m) => m.group_id), wanted);
  if (remove.length > 0) {
    const { error } = await supabase
      .from("outfit_group_memberships")
      .delete()
      .eq("entry_id", entryId)
      .in("group_id", remove);
    if (error) return { error: "saveFailed", values };
  }
  if (add.length > 0) {
    // RLS rejects a group or an entry that isn't this owner's.
    const { error } = await supabase
      .from("outfit_group_memberships")
      .insert(add.map((groupId) => ({ group_id: groupId, entry_id: entryId })));
    if (error) return { error: "saveFailed", values };
  }

  revalidateLibrary(locale);
  return { ok: Date.now() };
}
