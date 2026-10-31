"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createInviteLink, revokeInviteLink } from "@/lib/actions/invites";
import { DisplayNameField } from "@/components/profile/DisplayNameField";

export function InvitePanel({
  locale,
  requestId,
  hasActiveLink,
  finished,
  displayName,
  joinedGuests,
}: {
  locale: string;
  requestId: string;
  hasActiveLink: boolean;
  finished: boolean;
  displayName: string | null;
  joinedGuests: React.ReactNode;
}) {
  const t = useTranslations("invites");
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  function create() {
    if (hasActiveLink && !window.confirm(t("confirmReplace"))) return;
    setError(null);
    startTransition(async () => {
      const result = await createInviteLink(locale, requestId);
      if (result.error || !result.token) {
        setError(result.error ?? "createFailed");
        return;
      }
      // No locale prefix: the guest's own browser language picks /en or /he.
      setUrl(`${window.location.origin}/invite/${result.token}`);
      setCopied(false);
    });
  }

  function revoke() {
    if (!window.confirm(t("confirmRevoke"))) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteLink(locale, requestId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setUrl(null);
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // The link is shown only once, so a silent failure would lose it.
      linkRef.current?.select();
      setError("copyFailed");
    }
  }

  const buttonClass =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50";

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{t("title")}</h2>
        <p className="text-sm text-zinc-500">
          {finished ? t("finishedHint") : url || hasActiveLink ? t("activeHint") : t("noneHint")}
        </p>
      </div>

      <DisplayNameField locale={locale} initial={displayName} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${error}`)}
        </p>
      )}

      {url && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={linkRef}
              readOnly
              value={url}
              aria-label={t("linkLabel")}
              onFocus={(e) => e.currentTarget.select()}
              dir="ltr"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button type="button" onClick={copy} className={buttonClass}>
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">{t("shownOnce")}</p>
        </div>
      )}

      {!finished && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={create} disabled={pending} className={buttonClass}>
            {url || hasActiveLink ? t("regenerate") : t("create")}
          </button>
          {(url || hasActiveLink) && (
            <button
              type="button"
              onClick={revoke}
              disabled={pending}
              className="rounded-md px-3 py-1.5 text-sm text-red-600 underline disabled:opacity-50"
            >
              {t("revoke")}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">{joinedGuests}</div>
    </section>
  );
}
