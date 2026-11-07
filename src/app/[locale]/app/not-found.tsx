import { NotFoundState } from "@/components/layout/NotFoundState";

// Inside the app shell, so the navigation stays usable.
export default function AppNotFound() {
  return <NotFoundState homeHref="/app" />;
}
