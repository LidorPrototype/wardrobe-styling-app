"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Decision } from "@/lib/library/rules";

const ACTIONS: Exclude<Decision, "suggested">[] = ["chosen", "worn", "favorite", "rejected"];

export function DecisionButtons({
  status,
  action,
}: {
  status: string;
  action: (decision: Decision) => Promise<void>;
}) {
  const t = useTranslations("library");
  const [pending, startTransition] = useTransition();
  const decide = (decision: Decision) => startTransition(() => action(decision));

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${pending ? "opacity-50" : ""}`}>
      <span className="text-xs text-zinc-500">{t("decide")}</span>
      {ACTIONS.map((decision) => (
        <button
          key={decision}
          type="button"
          disabled={pending}
          onClick={() => decide(decision)}
          // chosen/worn/favorite can repeat: each click saves another library entry.
          aria-pressed={status === decision}
          className={`rounded-md border px-2.5 py-1 ${
            status === decision
              ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
              : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          {t(`actions.${decision}`)}
        </button>
      ))}
      {status !== "suggested" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("suggested")}
          className="text-xs text-zinc-600 underline dark:text-zinc-400"
        >
          {t("clear")}
        </button>
      )}
    </div>
  );
}
