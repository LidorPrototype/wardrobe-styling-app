import { useTranslations } from "next-intl";
import type { SuggestionStatus } from "@/lib/library/rules";

const STYLES: Record<SuggestionStatus, string> = {
  suggested: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  chosen: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  worn: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  favorite: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  rejected: "bg-zinc-200 text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400",
};

export function OutfitStatusBadge({ status }: { status: SuggestionStatus }) {
  const t = useTranslations("enums.outfitStatus");
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{t(status)}</span>
  );
}
