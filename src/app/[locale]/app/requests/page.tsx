import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "@/components/requests/RequestCard";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  const t = await getTranslations("requests");
  const supabase = await createClient();

  const { data } = await supabase
    .from("styling_requests")
    .select("id, title, occasion, event_at, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const open = rows.filter((r) => r.status !== "finished");
  const finished = rows.filter((r) => r.status === "finished");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">
            {t("requestCount", { count: rows.length })}
          </p>
        </div>
        <Link
          href="/app/requests/new"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          {t("addRequest")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">{t("empty")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {open.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                {t("openSection")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {open.map((row) => (
                  <RequestCard key={row.id} request={row} />
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                {t("finishedSection")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {finished.map((row) => (
                  <RequestCard key={row.id} request={row} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
