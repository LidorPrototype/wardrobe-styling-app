import { notFound } from "next/navigation";

// Unknown paths under a locale render the translated not-found page.
export default function CatchAll() {
  notFound();
}
