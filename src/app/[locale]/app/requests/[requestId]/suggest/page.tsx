import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { createOwnerSuggestion } from "@/lib/actions/suggestions";
import { loadRequestWardrobe } from "@/lib/suggestions/data";
import { OutfitBuilder } from "@/components/suggestions/OutfitBuilder";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function OwnerSuggestPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  await requireUser(locale);
  const t = await getTranslations("suggestions");
  const tRequests = await getTranslations("requests");
  const supabase = await createClient();

  // RLS: another owner's id yields nothing.
  const { data: request } = await supabase
    .from("styling_requests")
    .select("id, title, status, wardrobe_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) notFound();
  if (request.status === "finished") {
    redirect({ href: `/app/requests/${requestId}`, locale });
  }

  const items = await loadRequestWardrobe(request.wardrobe_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/app/requests/${requestId}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          <BackArrow /> {tRequests("backToRequest")}
        </Link>
        <p className="mt-2 text-sm text-zinc-500">{request.title}</p>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("builderTitle")}</h1>
      </div>
      <OutfitBuilder
        items={items}
        action={createOwnerSuggestion.bind(null, locale, requestId)}
        cancelHref={`/app/requests/${requestId}`}
      />
    </div>
  );
}
