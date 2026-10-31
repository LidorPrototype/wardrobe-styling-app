"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CommentFormState } from "@/lib/actions/activity";
import { COMMENT_MAX } from "@/lib/activity/rules";

export function CommentForm({
  action,
  initialBody = "",
  submitLabel,
  onDone,
  onCancel,
}: {
  action: (prev: CommentFormState, formData: FormData) => Promise<CommentFormState>;
  initialBody?: string;
  submitLabel?: string;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("activity");
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Each success carries a new `ok`, so a second identical comment still clears.
  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    onDone?.();
  }, [state?.ok, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <textarea
        name="body"
        required
        rows={2}
        maxLength={COMMENT_MAX}
        defaultValue={initialBody}
        aria-label={t("commentLabel")}
        placeholder={t("commentPlaceholder")}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? t("saving") : (submitLabel ?? t("post"))}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-zinc-600 underline dark:text-zinc-400">
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
