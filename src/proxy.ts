import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/**
 * Proxy (Next.js 16's renamed Middleware). Runs on every matched request and:
 *  1. Applies next-intl locale routing (detection, /en /he prefixing, rewrite).
 *  2. Refreshes the Supabase auth session cookies on the resulting response.
 *
 * Route protection is NOT done here (optimistic checks only). Real enforcement
 * lives server-side in requireUser() + RLS.
 */
export async function proxy(request: NextRequest) {
  // 1. next-intl builds the response (redirect / rewrite + NEXT_LOCALE cookie).
  const response = handleI18nRouting(request);

  // 2. Refresh Supabase session, writing any rotated auth cookies onto both the
  //    incoming request (for downstream) and the outgoing next-intl response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
