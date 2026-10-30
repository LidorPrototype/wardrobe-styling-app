import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/server";

const ensureOwnerBootstrap = cache(async (user: User) => {
  const supabase = await createClient();

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
 * Await this in every owner page and action before querying owner data. Next.js
 * renders layouts and pages concurrently, so the layout may not have created
 * the profile and wardrobe yet. `cache()` makes repeated calls share one run.
 */
export const requireUser = cache(async (locale: string): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  await ensureOwnerBootstrap(user);
  return user;
});
