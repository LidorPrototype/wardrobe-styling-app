"use server";

import { headers } from "next/headers";
import { redirect as externalRedirect } from "next/navigation";
import { redirect } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthFormState,
  LoginSchema,
  SignupSchema,
} from "@/lib/validation/auth";

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host")!;
  const protocol = h.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function login(
  locale: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submittedEmail = String(formData.get("email") ?? "");
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z_flatten(parsed.error), email: submittedEmail };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message, email: submittedEmail };
  }

  redirect({ href: "/app", locale });
}

export async function signup(
  locale: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submittedEmail = String(formData.get("email") ?? "");
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z_flatten(parsed.error), email: submittedEmail };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: error.message, email: submittedEmail };
  }

  // If email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return {
      error:
        "Check your email to confirm your account, then log in. (Disable 'Confirm email' in Supabase for instant dev login.)",
      email: submittedEmail,
    };
  }

  redirect({ href: "/app", locale });
}

export async function loginWithGoogle(locale: string) {
  const supabase = await createClient();
  const origin = await originFromHeaders();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/${locale}/auth/callback?next=/app`,
    },
  });

  if (error || !data.url) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  // data.url is an absolute Google/Supabase URL — bypass locale prefixing.
  externalRedirect(data.url);
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/login", locale });
}

function z_flatten(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const out: { email?: string[]; password?: string[] } = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password") {
      (out[key] ??= []).push(issue.message);
    }
  }
  return out;
}
