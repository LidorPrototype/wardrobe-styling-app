"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateDisplayName } from "@/lib/actions/profile";
import { DISPLAY_NAME_MAX } from "@/lib/profile/displayName";

export function DisplayNameField({ locale, initial }: { locale: string; initial: string | null }) {
  const t = useTranslations("invites");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial ?? "");
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateDisplayName(locale, value);
      if (result.error) {
        setStatus(result.error);
        return;
      }
      setValue(result.value ?? "");
      setStatus("saved");
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-1 text-sm">
      <label htmlFor="owner-display-name" className="text-zinc-700 dark:text-zinc-300">
        {t("ownerName")}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="owner-display-name"
          value={value}
          maxLength={DISPLAY_NAME_MAX}
          placeholder={t("ownerNamePlaceholder")}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50"
        >
          {pending ? tCommon("saving") : tCommon("save")}
        </button>
      </div>
      {status === "saved" ? (
        <span className="text-xs text-emerald-700 dark:text-emerald-400">{t("ownerNameSaved")}</span>
      ) : status !== "idle" ? (
        <span role="alert" className="text-xs text-red-600">
          {t(`errors.${status}`)}
        </span>
      ) : (
        <span className="text-xs text-zinc-500">{t("ownerNameHint")}</span>
      )}
    </form>
  );
}
