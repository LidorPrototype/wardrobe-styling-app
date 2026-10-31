"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { CommentFormState } from "@/lib/actions/activity";
import { CommentForm } from "@/components/activity/CommentForm";

export function CommentItem({
  author,
  meta,
  body,
  editAction,
  deleteAction,
}: {
  author: string;
  // Relative time, plus "(edited)" when it was changed.
  meta: string;
  body: string;
  editAction: ((prev: CommentFormState, formData: FormData) => Promise<CommentFormState>) | null;
  deleteAction: (() => Promise<void>) | null;
}) {
  const t = useTranslations("activity");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const stopEditing = useCallback(() => setEditing(false), []);

  return (
    <li className={`flex flex-col gap-1 ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{author}</span>
        <span className="text-zinc-500">{meta}</span>
        {!editing && editAction && (
          <button type="button" onClick={() => setEditing(true)} className="text-zinc-600 underline dark:text-zinc-400">
            {t("edit")}
          </button>
        )}
        {!editing && deleteAction && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(t("confirmDelete"))) return;
              startTransition(() => deleteAction());
            }}
            className="text-red-600 underline disabled:opacity-50"
          >
            {t("delete")}
          </button>
        )}
      </div>
      {editing && editAction ? (
        <CommentForm
          action={editAction}
          initialBody={body}
          submitLabel={t("save")}
          onDone={stopEditing}
          onCancel={stopEditing}
        />
      ) : (
        <p className="whitespace-pre-line break-words text-sm text-zinc-700 dark:text-zinc-300">{body}</p>
      )}
    </li>
  );
}
