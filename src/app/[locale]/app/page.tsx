import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Gate + bootstrap must complete before querying owner data. Cached, so this
  // does not duplicate the work already done by the app layout.
  const user = await requireUser(locale);

  const t = await getTranslations("app");
  const supabase = await createClient();

  const { data: wardrobe } = await supabase
    .from("wardrobes")
    .select("name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {t("dashboardTitle")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {t("defaultWardrobe")}: <strong>{wardrobe?.name ?? "—"}</strong>
      </p>
    </div>
  );
}
