"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { OCCASIONS } from "@/lib/enums/requests";
import {
  createStylingRequest,
  updateStylingRequest,
} from "@/lib/actions/requests";
import type { RequestFormState } from "@/lib/validation/request";
import { EnumSelect } from "@/components/wardrobe/EnumSelect";

export type RequestFormValues = {
  title: string;
  occasion: string;
  eventAt: string;
  notes: string;
};

const EMPTY: RequestFormValues = {
  title: "",
  occasion: "",
  eventAt: "",
  notes: "",
};

export function RequestForm({
  requestId,
  initial = EMPTY,
}: {
  requestId?: string;
  initial?: RequestFormValues;
}) {
  const locale = useLocale();
  const t = useTranslations("requests");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("requests.errors");

  const action = requestId
    ? updateStylingRequest.bind(null, locale, requestId)
    : createStylingRequest.bind(null, locale);

  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(
    action,
    undefined,
  );

  // Values echoed back by a failed submit win over the initial row values.
  const v = { ...initial, ...(state?.values ?? {}) };

  const err = (field: string) =>
    state?.fieldErrors?.[field] ? tErrors(state.fieldErrors[field]!) : undefined;

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  const cancelHref = requestId ? `/app/requests/${requestId}` : "/app/requests";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {tErrors(state.error)}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("titleField")}</span>
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={v.title}
          placeholder={t("titlePlaceholder")}
          className={inputClass}
        />
        {err("title") && (
          <span className="text-sm text-red-600">{err("title")}</span>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <EnumSelect
          name="occasion"
          namespace="occasion"
          options={OCCASIONS}
          label={t("occasion")}
          value={v.occasion}
          error={err("occasion")}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("eventAt")}
            <span className="ms-1 text-xs text-zinc-400">
              ({tCommon("optional")})
            </span>
          </span>
          <input
            type="datetime-local"
            name="eventAt"
            defaultValue={v.eventAt}
            className={inputClass}
          />
          {err("eventAt") && (
            <span className="text-sm text-red-600">{err("eventAt")}</span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {t("notes")}
          <span className="ms-1 text-xs text-zinc-400">
            ({tCommon("optional")})
          </span>
        </span>
        <textarea
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={v.notes}
          placeholder={t("notesPlaceholder")}
          className={inputClass}
        />
        {err("notes") && (
          <span className="text-sm text-red-600">{err("notes")}</span>
        )}
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? tCommon("saving") : tCommon("save")}
        </button>
        <Link
          href={cancelHref}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
