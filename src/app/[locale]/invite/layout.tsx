import { GuestShell, guestMetadata } from "@/components/guest/GuestShell";

export const metadata = guestMetadata;

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
