import { LoadingState } from "@/components/layout/LoadingState";

export default function GuestLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <LoadingState />
    </div>
  );
}
