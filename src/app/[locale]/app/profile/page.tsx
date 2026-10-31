import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { signImageUrl } from "@/lib/wardrobe/images";
import { guestSafeDisplayName } from "@/lib/profile/displayName";
import { DisplayNameField } from "@/components/profile/DisplayNameField";
import { HeadPhotoForm } from "@/components/profile/HeadPhotoForm";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("profile");
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, head_photo_path")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`profile lookup failed: ${error.message}`);

  const headUrl = await signImageUrl(profile.head_photo_path);

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("intro")}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("headPhoto")}</h2>
        <HeadPhotoForm currentUrl={headUrl} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("name")}</h2>
        <DisplayNameField locale={locale} initial={guestSafeDisplayName(profile.display_name)} />
      </section>
    </div>
  );
}
