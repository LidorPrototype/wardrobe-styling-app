"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";

export function LikeButton({
  liked,
  count,
  likers,
  action,
}: {
  liked: boolean;
  count: number;
  // Already formatted, e.g. "Alice, Bob and 2 more".
  likers: string | null;
  // null: the viewer can't like this one (their own, or a finished request).
  action: (() => Promise<void>) | null;
}) {
  const t = useTranslations("activity");
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ liked, count });

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <button
        type="button"
        disabled={!action || pending}
        aria-pressed={action ? optimistic.liked : undefined}
        aria-label={optimistic.liked ? t("unlike") : t("like")}
        title={action ? undefined : t("cannotLike")}
        onClick={() =>
          action &&
          startTransition(async () => {
            setOptimistic({
              liked: !optimistic.liked,
              count: optimistic.count + (optimistic.liked ? -1 : 1),
            });
            await action();
          })
        }
        className={`flex items-center gap-1 rounded-full border px-3 py-1 disabled:cursor-default ${
          optimistic.liked
            ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
            : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        } ${action ? "" : "opacity-70"}`}
      >
        <svg viewBox="0 0 20 20" aria-hidden className="size-4" fill={optimistic.liked ? "currentColor" : "none"}>
          <path
            d="M10 17s-6.5-4-6.5-8.5A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 6.5 2.5C16.5 13 10 17 10 17z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span>{optimistic.count}</span>
      </button>
      {likers && <span className="truncate text-xs text-zinc-500">{likers}</span>}
    </div>
  );
}
