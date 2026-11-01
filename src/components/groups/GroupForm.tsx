"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { GroupFormState } from "@/lib/actions/groups";
import { GROUP_DESCRIPTION_MAX, GROUP_NAME_MAX } from "@/lib/groups/rules";

export function GroupForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  // Editing an existing group; without it the form creates one. React clears
  // the form after each submit; on error it refills from state.values.
  initial?: { name: string; description: string | null };
  submitLabel: string;
}) {
  const t = useTranslations("groups");
  const [state, formAction, pending] = useActionState(action, undefined);

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state?.ok && initial && !pending && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {t("saved")}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("nameField")}</span>
        <input
          name="name"
          required
          maxLength={GROUP_NAME_MAX}
          defaultValue={state?.values?.name ?? initial?.name ?? ""}
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("descriptionField")}</span>
        <input
          name="description"
          maxLength={GROUP_DESCRIPTION_MAX}
          defaultValue={state?.values?.description ?? initial?.description ?? ""}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
      >
        {pending ? t("saving") : submitLabel}
      </button>
    </form>
  );
}
