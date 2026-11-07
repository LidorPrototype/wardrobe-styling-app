import { NotFoundState } from "@/components/layout/NotFoundState";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col justify-center p-6">
      <NotFoundState homeHref="/" />
    </main>
  );
}
