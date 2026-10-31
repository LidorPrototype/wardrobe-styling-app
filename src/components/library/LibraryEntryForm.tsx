"use client";

import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { LibraryEntryFormState } from "@/lib/actions/library";
import { LIBRARY_NOTES_MAX } from "@/lib/library/rules";

export function LibraryEntryForm({
  wornOn,
  notes,
  action,
  deleteAction,
}: {
  wornOn: string | null;
  notes: string | null;
  action: (prev: LibraryEntryFormState, formData: FormData) => Promise<LibraryEntryFormState>;
  deleteAction: () => Promise<void>;
}) {
  const t = useTranslations("library");
  const [state, formAction, pending] = useActionState(action, undefined);
  const [deleting, startDelete] = useTransition();

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state?.ok && !pending && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {t("saved")}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("wornOnField")}</span>
        <input type="date" name="wornOn" defaultValue={wornOn ?? ""} className={`${inputClass} w-fit`} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("notesField")}</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={LIBRARY_NOTES_MAX}
          defaultValue={notes ?? ""}
          placeholder={t("notesPlaceholder")}
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (!window.confirm(t("confirmDelete"))) return;
            startDelete(() => deleteAction());
          }}
          className="text-sm text-red-600 underline disabled:opacity-50"
        >
          {t("delete")}
        </button>
      </div>
    </form>
  );
}
