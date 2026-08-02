import { requireUser } from "@/lib/auth/requireUser";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  return (
    <AppShell locale={locale} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
