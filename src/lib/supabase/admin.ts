import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses RLS. Use only after checking the caller's authorization yourself;
// owner reads/writes belong on the RLS-enforced client in ./server.ts.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
