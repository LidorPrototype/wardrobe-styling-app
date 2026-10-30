import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { toDateTimeInputValue } from "@/lib/requests/eventDate";
import { RequestForm } from "@/components/requests/RequestForm";
import { BackArrow } from "@/components/layout/BackArrow";

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  await requireUser(locale);

  const t = await getTranslations("requests");
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("styling_requests")
    .select("id, title, occasion, event_at, notes, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) notFound();

  // A finished request is read-only — don't render a form that cannot save.
  if (request.status === "finished") {
    redirect({ href: `/app/requests/${requestId}`, locale });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/app/requests/${requestId}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          <BackArrow /> {t("backToRequest")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("editRequestTitle")}
        </h1>
      </div>

      <RequestForm
        requestId={request.id}
        initial={{
          title: request.title,
          occasion: request.occasion ?? "",
          eventAt: toDateTimeInputValue(request.event_at),
          notes: request.notes ?? "",
        }}
      />
    </div>
  );
}
