import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/wardrobe/images";
import { EVENT_TIME_ZONE, toFormattableDate } from "@/lib/requests/eventDate";
import { RequestActions } from "@/components/requests/RequestActions";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { InvitePanel } from "@/components/requests/InvitePanel";
import { guestSafeDisplayName } from "@/lib/profile/displayName";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  const user = await requireUser(locale);

  const t = await getTranslations("requests");
  const tCommon = await getTranslations("common");
  const tOccasion = await getTranslations("enums.occasion");
  const format = await getFormatter();
  const supabase = await createClient();

  // RLS: another owner's id yields nothing.
  const { data: request } = await supabase
    .from("styling_requests")
    .select("id, title, occasion, event_at, notes, status, wardrobe_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) notFound();

  // MVP: a request exposes the owner's whole active wardrobe.
  const { data: items } = await supabase
    .from("clothing_items")
    .select("id, name, category, image_path")
    .eq("owner_id", user.id)
    .eq("wardrobe_id", request.wardrobe_id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const { data: activeInvite, error: inviteError } = await supabase
    .from("invite_tokens")
    .select("id")
    .eq("request_id", request.id)
    .is("revoked_at", null)
    .maybeSingle();
  if (inviteError) throw new Error(`invite lookup failed: ${inviteError.message}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  if (profileError) throw new Error(`profile lookup failed: ${profileError.message}`);

  const wardrobeItems = items ?? [];
  const urlMap = await signImageUrls(wardrobeItems.map((i) => i.image_path));

  const eventDate = toFormattableDate(request.event_at);
  const finished = request.status === "finished";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/app/requests"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          <BackArrow /> {t("backToRequests")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {request.title}
          </h1>
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {finished && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {t("finishedNotice")}
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("occasion")}
          </dt>
          <dd className="text-zinc-950 dark:text-zinc-50">
            {request.occasion ? tOccasion(request.occasion) : tCommon("notSet")}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("eventAt")}
          </dt>
          <dd className="text-zinc-950 dark:text-zinc-50">
            {eventDate
              ? format.dateTime(eventDate, {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: EVENT_TIME_ZONE,
                })
              : tCommon("notSet")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {t("notes")}
          </dt>
          <dd className="whitespace-pre-line text-zinc-950 dark:text-zinc-50">
            {request.notes ?? tCommon("notSet")}
          </dd>
        </div>
      </dl>

      <RequestActions
        locale={locale}
        requestId={request.id}
        status={request.status}
      />

      <InvitePanel
        locale={locale}
        requestId={request.id}
        hasActiveLink={Boolean(activeInvite)}
        finished={finished}
        displayName={guestSafeDisplayName(profile.display_name)}
      />

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div>
          <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
            {t("availableItems")}
          </h2>
          <p className="text-sm text-zinc-500">{t("availableItemsHint")}</p>
        </div>

        {wardrobeItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            {t("noWardrobeItems")}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {wardrobeItems.map((item, index) => {
              const url = item.image_path
                ? (urlMap.get(item.image_path) ?? null)
                : null;
              return (
                <div key={item.id} className="flex flex-col gap-1">
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {url && (
                      <Image
                        src={url}
                        alt={item.name}
                        fill
                        unoptimized
                        loading={index < 6 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="line-clamp-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
