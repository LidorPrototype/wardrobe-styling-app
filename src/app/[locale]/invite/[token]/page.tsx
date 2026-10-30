import { getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/routing";
import { resolveInvite } from "@/lib/invites/resolveInvite";
import { getGuestSession } from "@/lib/guests/session";
import { RequestSummary } from "@/components/guest/RequestSummary";
import { JoinForm } from "@/components/guest/JoinForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const t = await getTranslations("guest");

  const invite = await resolveInvite(token);

  if (invite.status === "invalid") {
    return (
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t("invalidTitle")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("invalidBody")}</p>
      </div>
    );
  }

  if (await getGuestSession(invite.request.id)) {
    redirect({ href: `/guest/request/${invite.request.id}`, locale });
  }

  return (
    <div className="flex flex-col gap-6">
      <RequestSummary request={invite.request} />
      <JoinForm token={token} closed={invite.status === "closed"} />
    </div>
  );
}
