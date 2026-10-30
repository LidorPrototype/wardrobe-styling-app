"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { toStoredTimestamp } from "@/lib/requests/eventDate";
import {
  StylingRequestSchema,
  type RequestFormState,
} from "@/lib/validation/request";

/** Field values echoed back so a failed submit does not wipe the form. */
function echo(formData: FormData): Record<string, string> {
  return {
    title: String(formData.get("title") ?? ""),
    occasion: String(formData.get("occasion") ?? ""),
    eventAt: String(formData.get("eventAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createStylingRequest(
  locale: string,
  _prevState: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const user = await requireUser(locale);
  const supabase = await createClient();
  const values = echo(formData);

  const parsed = StylingRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  // The request's own wardrobe — MVP has exactly one per owner.
  const { data: wardrobe } = await supabase
    .from("wardrobes")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wardrobe) {
    return { error: "saveFailed", values };
  }

  const { data: created, error } = await supabase
    .from("styling_requests")
    .insert({
      owner_id: user.id,
      wardrobe_id: wardrobe.id,
      title: parsed.data.title,
      occasion: parsed.data.occasion ?? null,
      event_at: toStoredTimestamp(parsed.data.eventAt),
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "saveFailed", values };
  }

  revalidatePath(`/${locale}/app/requests`);
  redirect({ href: `/app/requests/${created.id}`, locale });
}

export async function updateStylingRequest(
  locale: string,
  requestId: string,
  _prevState: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  await requireUser(locale);
  const supabase = await createClient();
  const values = echo(formData);

  // RLS also enforces ownership; this gives a clean error instead of a no-op.
  const { data: existing } = await supabase
    .from("styling_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) {
    return { error: "notFound", values };
  }
  // A DB trigger rejects this too — checked here to return a readable message
  // rather than surfacing a raw Postgres error.
  if (existing.status === "finished") {
    return { error: "finishedReadOnly", values };
  }

  const parsed = StylingRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const { error } = await supabase
    .from("styling_requests")
    .update({
      title: parsed.data.title,
      occasion: parsed.data.occasion ?? null,
      event_at: toStoredTimestamp(parsed.data.eventAt),
      notes: parsed.data.notes ?? null,
    })
    .eq("id", requestId);

  if (error) {
    return { error: "saveFailed", values };
  }

  revalidatePath(`/${locale}/app/requests`);
  redirect({ href: `/app/requests/${requestId}`, locale });
}

export async function setRequestStatus(
  locale: string,
  requestId: string,
  status: "open" | "finished",
) {
  await requireUser(locale);
  const supabase = await createClient();

  await supabase
    .from("styling_requests")
    .update({
      status,
      finished_at: status === "finished" ? new Date().toISOString() : null,
    })
    .eq("id", requestId);

  revalidatePath(`/${locale}/app/requests`);
  revalidatePath(`/${locale}/app/requests/${requestId}`);
}

export async function deleteStylingRequest(locale: string, requestId: string) {
  await requireUser(locale);
  const supabase = await createClient();

  await supabase.from("styling_requests").delete().eq("id", requestId);

  revalidatePath(`/${locale}/app/requests`);
  redirect({ href: "/app/requests", locale });
}
