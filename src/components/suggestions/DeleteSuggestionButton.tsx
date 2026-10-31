"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

export function DeleteSuggestionButton({ action }: { action: () => Promise<void> }) {
  const t = useTranslations("suggestions");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("confirmDelete"))) return;
        startTransition(() => action());
      }}
      className="text-xs text-red-600 underline disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
