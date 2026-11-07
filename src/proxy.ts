import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { contentSecurityPolicy } from "@/lib/security/csp";

const handleI18nRouting = createMiddleware(routing);

// Locale routing, the per-request CSP nonce, and Supabase session refresh.
// Access control is enforced by requireUser() and RLS, not here.
export async function proxy(incoming: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, { dev: process.env.NODE_ENV === "development" });

  // Next.js reads the nonce from the request's CSP header while rendering;
  // next-intl passes these headers on.
  const headers = new Headers(incoming.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const request = new NextRequest(incoming, { headers });

  const response = handleI18nRouting(request);
  response.headers.set("Content-Security-Policy", csp);

  // Rotated auth cookies go on both the request (for downstream rendering) and
  // the next-intl response.
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
