"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Free-text tags in the owner's own vocabulary — stored raw, never translated.
 * Submits one hidden `tags` field per tag so the server action can read them
 * with formData.getAll("tags").
 */
export function TagInput({ defaultTags = [] }: { defaultTags?: string[] }) {
  const t = useTranslations("wardrobe");
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");

  function addDraft(raw: string) {
    const next = [...tags];
    for (const piece of raw.split(",")) {
      const tag = piece.trim();
      if (!tag) continue;
      if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
      next.push(tag);
    }
    setTags(next.slice(0, 30));
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">
        {t("tags")}
        <span className="ms-1 text-xs text-zinc-400">({t("optional")})</span>
      </span>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((x) => x !== tag))}
              aria-label={`${t("removeTag")}: ${tag}`}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              ×
            </button>
            <input type="hidden" name="tags" value={tag} />
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          // Don't silently drop a tag the user typed but didn't commit.
          onBlur={() => draft.trim() && addDraft(draft)}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-zinc-950 outline-none dark:text-zinc-50"
        />
      </div>
      <span className="text-xs text-zinc-400">{t("tagsHint")}</span>
    </div>
  );
}
