"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestSession } from "@/lib/guests/session";
import { CommentSchema } from "@/lib/activity/rules";

// Likes and comments. Guests write with the secret key after the session
// check, scoped to their own identity; owners write through RLS. The SQL
// guards (finished request, guest of this request, no self-likes) back both.

export type CommentFormState = { error?: string; ok?: number } | undefined;

type Writer = { client: SupabaseClient; path: string } & (
  | { kind: "guest"; identityId: string }
  | { kind: "owner"; ownerId: string }
);

// null when the viewer is signed out or the request is finished (read-only).
async function guestWriter(locale: string, requestId: string): Promise<Writer | null> {
  const session = await getGuestSession(requestId);
  if (!session || session.request.status === "finished") return null;
  return {
    kind: "guest",
    client: createAdminClient(),
    identityId: session.identityId,
    path: `/${locale}/guest/request/${requestId}`,
  };
}

async function ownerWriter(locale: string, requestId: string): Promise<Writer | null> {
  const user = await requireUser(locale);
  const supabase = await createClient();
  // RLS: another owner's request yields nothing.
  const { data: request } = await supabase
    .from("styling_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status === "finished") return null;
  return { kind: "owner", client: supabase, ownerId: user.id, path: `/${locale}/app/requests/${requestId}` };
}

// The column and value that identify the writer as an author.
function authorKey(writer: Writer): [string, string] {
  return writer.kind === "guest" ? ["guest_identity_id", writer.identityId] : ["owner_id", writer.ownerId];
}

function authorColumns(writer: Writer) {
  const [column, value] = authorKey(writer);
  return { [column]: value };
}

async function toggleLike(writer: Writer | null, suggestionId: string) {
  if (!writer) return;

  const { data: removed, error: deleteError } = await writer.client
    .from("votes")
    .delete()
    .eq("suggestion_id", suggestionId)
    .eq(...authorKey(writer))
    .select("id");
  if (deleteError) throw new Error(`could not remove like: ${deleteError.message}`);

  if (removed.length === 0) {
    const { error } = await writer.client
      .from("votes")
      .insert({ suggestion_id: suggestionId, ...authorColumns(writer) });
    // 23505: a double click already liked it. 23514: own suggestion, another
    // request's suggestion, or the request was just finished.
    if (error && error.code !== "23505" && error.code !== "23514") {
      throw new Error(`could not like: ${error.message}`);
    }
  }
  revalidatePath(writer.path);
}

export async function toggleGuestLike(locale: string, requestId: string, suggestionId: string) {
  await toggleLike(await guestWriter(locale, requestId), suggestionId);
}

export async function toggleOwnerLike(locale: string, requestId: string, suggestionId: string) {
  await toggleLike(await ownerWriter(locale, requestId), suggestionId);
}

async function addComment(
  writer: Writer | null,
  requestId: string,
  suggestionId: string | null,
  formData: FormData,
): Promise<CommentFormState> {
  if (!writer) return { error: "readOnly" };
  const parsed = CommentSchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await writer.client.from("comments").insert({
    request_id: requestId,
    suggestion_id: suggestionId,
    body: parsed.data.body,
    ...authorColumns(writer),
  });
  if (error) return { error: error.code === "23514" ? "readOnly" : "saveFailed" };

  revalidatePath(writer.path);
  // A fresh value each time tells the form to clear itself.
  return { ok: Date.now() };
}

export async function addGuestComment(
  locale: string,
  requestId: string,
  suggestionId: string | null,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  return addComment(await guestWriter(locale, requestId), requestId, suggestionId, formData);
}

export async function addOwnerComment(
  locale: string,
  requestId: string,
  suggestionId: string | null,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  return addComment(await ownerWriter(locale, requestId), requestId, suggestionId, formData);
}

async function editComment(
  writer: Writer | null,
  requestId: string,
  commentId: string,
  formData: FormData,
): Promise<CommentFormState> {
  if (!writer) return { error: "readOnly" };
  const parsed = CommentSchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Only the author edits, the owner included.
  const { data, error } = await writer.client
    .from("comments")
    .update({ body: parsed.data.body })
    .eq("id", commentId)
    .eq("request_id", requestId)
    .eq(...authorKey(writer))
    .select("id");
  if (error) return { error: error.code === "23514" ? "readOnly" : "saveFailed" };
  if (data.length === 0) return { error: "saveFailed" };

  revalidatePath(writer.path);
  return { ok: Date.now() };
}

export async function editGuestComment(
  locale: string,
  requestId: string,
  commentId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  return editComment(await guestWriter(locale, requestId), requestId, commentId, formData);
}

export async function editOwnerComment(
  locale: string,
  requestId: string,
  commentId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  return editComment(await ownerWriter(locale, requestId), requestId, commentId, formData);
}

export async function deleteGuestComment(locale: string, requestId: string, commentId: string) {
  const writer = await guestWriter(locale, requestId);
  if (!writer) return;
  // Scoped to this guest: other people's comments simply aren't matched.
  const { error } = await writer.client
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("request_id", requestId)
    .eq(...authorKey(writer));
  if (error) throw new Error(`could not delete comment: ${error.message}`);
  revalidatePath(writer.path);
}

export async function deleteOwnerComment(locale: string, requestId: string, commentId: string) {
  const writer = await ownerWriter(locale, requestId);
  if (!writer) return;
  // RLS lets the owner delete any comment on their own request.
  const { error } = await writer.client
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("request_id", requestId);
  if (error) throw new Error(`could not delete comment: ${error.message}`);
  revalidatePath(writer.path);
}
