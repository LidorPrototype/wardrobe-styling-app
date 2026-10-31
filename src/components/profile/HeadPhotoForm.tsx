"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { removeHeadPhoto, uploadHeadPhoto, type HeadPhotoState } from "@/lib/actions/profile";

export function HeadPhotoForm({ currentUrl }: { currentUrl: string | null }) {
  const locale = useLocale();
  const t = useTranslations("profile");
  const tErrors = useTranslations("wardrobe.errors");
  const [state, action, pending] = useActionState<HeadPhotoState, FormData>(
    uploadHeadPhoto.bind(null, locale),
    undefined,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();
  const shown = preview ?? currentUrl;

  return (
    <form action={action} className="flex flex-col gap-3 text-sm">
      <div className="flex items-center gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          {shown && <Image src={shown} alt={t("headPhoto")} fill unoptimized sizes="96px" className="object-cover" />}
        </div>
        <p className="text-zinc-500">{t("headPhotoHint")}</p>
      </div>

      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />

      {state?.error && (
        <p role="alert" className="text-red-600">
          {tErrors(state.error)}
        </p>
      )}
      {state?.saved && <p className="text-emerald-700 dark:text-emerald-400">{t("saved")}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? t("uploading") : currentUrl ? t("replace") : t("upload")}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={removing}
            onClick={() => {
              if (!window.confirm(t("confirmRemove"))) return;
              startRemoving(() => removeHeadPhoto(locale));
            }}
            className="text-red-600 underline disabled:opacity-50"
          >
            {t("remove")}
          </button>
        )}
      </div>
    </form>
  );
}
