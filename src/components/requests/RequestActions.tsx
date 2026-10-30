"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { deleteStylingRequest, setRequestStatus } from "@/lib/actions/requests";

export function RequestActions({
  locale,
  requestId,
  status,
}: {
  locale: string;
  requestId: string;
  status: string;
}) {
  const t = useTranslations("requests");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();

  const finished = status === "finished";

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {!finished && (
        <Link
          href={`/app/requests/${requestId}/edit`}
          className="text-zinc-600 underline dark:text-zinc-400"
        >
          {tCommon("edit")}
        </Link>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void setRequestStatus(locale, requestId, finished ? "open" : "finished");
          })
        }
        className="text-zinc-600 underline disabled:opacity-50 dark:text-zinc-400"
      >
        {finished ? t("reopen") : t("finish")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("confirmDelete"))) return;
          startTransition(() => {
            void deleteStylingRequest(locale, requestId);
          });
        }}
        className="text-red-600 underline disabled:opacity-50"
      >
        {tCommon("delete")}
      </button>
    </div>
  );
}
