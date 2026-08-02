"use client";

import { useTranslations } from "next-intl";

/**
 * Renders a closed-list field. `options` are language-neutral codes; the labels
 * come from the `enums.<namespace>` translation namespace, so the same stored
 * code reads correctly in every locale.
 */
export function EnumSelect({
  name,
  namespace,
  options,
  label,
  value,
  onChange,
  required = false,
  error,
}: {
  name: string;
  namespace: "category" | "subcategory" | "color" | "season" | "formality";
  options: readonly string[];
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
  const tEnum = useTranslations(`enums.${namespace}`);
  const tWardrobe = useTranslations("wardrobe");

  const common = {
    id: name,
    name,
    required,
    className:
      "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
  };

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">
        {label}
        {!required && (
          <span className="ms-1 text-xs text-zinc-400">
            ({tWardrobe("optional")})
          </span>
        )}
      </span>
      <select
        {...common}
        {...(onChange
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : { defaultValue: value ?? "" })}
      >
        <option value="">{tWardrobe("selectPlaceholder")}</option>
        {options.map((code) => (
          <option key={code} value={code}>
            {tEnum(code)}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}
