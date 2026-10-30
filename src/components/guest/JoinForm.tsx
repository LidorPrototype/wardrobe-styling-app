"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { joinAsGuest, type JoinState } from "@/lib/actions/guests";
import { NICKNAME_MAX, PASSPHRASE_MAX, PASSPHRASE_MIN } from "@/lib/guests/rules";

export function JoinForm({ token, closed }: { token: string; closed: boolean }) {
  const locale = useLocale();
  const t = useTranslations("guest");
  const [state, action, pending] = useActionState<JoinState, FormData>(
    joinAsGuest.bind(null, locale, token),
    undefined,
  );

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
          {closed ? t("signBackInTitle") : t("joinTitle")}
        </h2>
        <p className="text-sm text-zinc-500">{closed ? t("closedSignInHint") : t("joinHint")}</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("nickname")}</span>
        <input
          name="nickname"
          required
          maxLength={NICKNAME_MAX}
          autoComplete="nickname"
          defaultValue={state?.nickname ?? ""}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("passphrase")}</span>
        {/* Never echoed back after a failed submit. */}
        <input
          name="passphrase"
          type="password"
          required
          minLength={PASSPHRASE_MIN}
          maxLength={PASSPHRASE_MAX}
          autoComplete="current-password"
          className={inputClass}
        />
        <span className="text-xs text-zinc-500">{t("passphraseHint", { min: PASSPHRASE_MIN })}</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
      >
        {pending ? t("joining") : closed ? t("signIn") : t("join")}
      </button>
    </form>
  );
}
