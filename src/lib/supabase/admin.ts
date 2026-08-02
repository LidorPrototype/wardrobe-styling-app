import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the SECRET key. Bypasses Row Level Security.
 *
 * SERVER ONLY. Never import this into a Client Component. Use only after
 * manually validating the caller's authorization (e.g. guest server actions
 * in later milestones). Owner-facing reads/writes should use the RLS-enforced
 * server client (./server.ts) instead.
 */
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
