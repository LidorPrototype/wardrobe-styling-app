"use client";

import { ErrorState } from "@/components/layout/ErrorState";

export default function LocaleError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col p-6">
      <ErrorState retry={retry} homeHref="/" />
    </main>
  );
}
