"use client";

import { ErrorState } from "@/components/layout/ErrorState";

// Inside the app shell, so the navigation stays usable.
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return <ErrorState retry={retry} homeHref="/app" />;
}
