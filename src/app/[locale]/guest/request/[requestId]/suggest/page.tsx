import { getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/routing";
import { getGuestSession } from "@/lib/guests/session";
import { createGuestSuggestion } from "@/lib/actions/suggestions";
import { loadRequestWardrobe } from "@/lib/suggestions/data";
import { GuestSignedOut } from "@/components/guest/GuestSignedOut";
import { OutfitBuilder } from "@/components/suggestions/OutfitBuilder";

export default async function GuestSuggestPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  const t = await getTranslations("suggestions");

  const session = await getGuestSession(requestId);
  if (!session) return <GuestSignedOut />;
  if (session.request.status === "finished") {
    redirect({ href: `/guest/request/${requestId}`, locale });
  }

  const items = await loadRequestWardrobe(session.request.wardrobe_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-zinc-500">{session.request.title}</p>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("builderTitle")}</h1>
      </div>
      <OutfitBuilder
        items={items}
        action={createGuestSuggestion.bind(null, locale, requestId)}
        cancelHref={`/guest/request/${requestId}`}
      />
    </div>
  );
}
