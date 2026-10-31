"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { GroupFormState } from "@/lib/actions/groups";
import { GROUP_NAME_MAX } from "@/lib/groups/rules";

export function EntryGroupsForm({
  groups,
  memberOf,
  action,
}: {
  groups: { id: string; name: string }[];
  memberOf: string[];
  action: (prev: GroupFormState, formData: FormData) => Promise<GroupFormState>;
}) {
  const t = useTranslations("groups");
  const [state, formAction, pending] = useActionState(action, undefined);
  // React resets the form after each submit: to what was saved, or on error
  // to what was submitted.
  const checked = state?.values?.groups ?? memberOf;

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
      {groups.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("noGroupsYet")}</p>
      ) : (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{t("groupsLegend")}</legend>
          {groups.map((g) => (
            <label
              key={g.id}
              className="flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-1 text-sm has-checked:border-zinc-950 has-checked:bg-zinc-100 dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-800"
            >
              <input type="checkbox" name="group" value={g.id} defaultChecked={checked.includes(g.id)} />
              <span className="text-zinc-800 dark:text-zinc-200">{g.name}</span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">{t("newGroupField")}</span>
        <input
          name="newGroup"
          defaultValue={state?.values?.newGroup ?? ""}
          maxLength={GROUP_NAME_MAX}
          placeholder={t("namePlaceholder")}
          className="w-full max-w-xs rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
      >
        {pending ? t("saving") : t("saveGroups")}
      </button>
    </form>
  );
}
