import { GuestShell, guestMetadata } from "@/components/guest/GuestShell";

export const metadata = guestMetadata;

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <GuestShell wide>{children}</GuestShell>;
}
