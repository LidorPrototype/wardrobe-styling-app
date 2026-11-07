// Content-Security-Policy for one response. Scripts need this request's
// nonce (Next.js adds it to its own scripts); styles allow inline because
// next/image and some components set style attributes.
export function contentSecurityPolicy(nonce: string, { dev }: { dev: boolean }): string {
  const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  const directives = [
    "default-src 'self'",
    // React uses eval for better error stacks in development only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Wardrobe photos are signed Supabase Storage URLs; uploads preview as blobs.
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self'",
    `connect-src 'self' ${supabase}`,
    // Google sign-in redirects through Supabase to Google after the form posts.
    `form-action 'self' ${supabase} https://accounts.google.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}
