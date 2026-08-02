import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures an owner has a profile row and at least one wardrobe. Idempotent, and
 * cached per render pass so the layout and page can both await it without
 * duplicating writes or racing each other. Runs as the logged-in user, so RLS
 * confines all writes to that owner's own rows.
 */
const ensureOwnerBootstrap = cache(async (user: User) => {
  const supabase = await createClient();

  // Profile: create on first visit (covers both email/password and OAuth).
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email ??
        null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  // Default wardrobe: create only if the owner has none yet.
  const { data: wardrobes } = await supabase
    .from("wardrobes")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (!wardrobes || wardrobes.length === 0) {
    await supabase
      .from("wardrobes")
      .insert({ owner_id: user.id, name: "My Wardrobe" });
  }
});

/**
 * Server-side gate for owner-only pages. Redirects logged-out users to the
 * localized login page; otherwise returns the authenticated user after
 * ensuring their profile + default wardrobe exist.
 *
 * Call this in any owner page/action *before* querying owner data — do not rely
 * on the layout having run first, because Next.js renders layouts and pages
 * concurrently.
 */
export const requireUser = cache(async (locale: string): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    // redirect() throws, so this is unreachable at runtime.
    throw new Error("unreachable");
  }

  await ensureOwnerBootstrap(user);
  return user;
});
