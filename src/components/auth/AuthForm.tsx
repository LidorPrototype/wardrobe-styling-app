"use client";

import { useActionState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { login, loginWithGoogle, signup } from "@/lib/actions/auth";
import type { AuthFormState } from "@/lib/validation/auth";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const locale = useLocale();
  const t = useTranslations("auth");

  const action = (mode === "login" ? login : signup).bind(null, locale);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );

  const googleAction = loginWithGoogle.bind(null, locale);

  // The password is never echoed back, so focus it for retyping.
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state?.error || state?.fieldErrors?.password) {
      passwordRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {t(mode === "login" ? "loginTitle" : "signupTitle")}
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">{t("email")}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            // React resets the form to defaultValue after an action.
            defaultValue={state?.email ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {state?.fieldErrors?.email && (
            <span className="text-sm text-red-600">{t("emailInvalid")}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("password")}
          </span>
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            ref={passwordRef}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {state?.fieldErrors?.password && (
            <span className="text-sm text-red-600">{t("passwordMin")}</span>
          )}
        </label>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {t(mode === "login" ? "loginButton" : "signupButton")}
        </button>
      </form>

      <form action={googleAction}>
        <button
          type="submit"
          className="w-full rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-950 dark:border-zinc-700 dark:text-zinc-50"
        >
          {t("googleButton")}
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "login" ? (
          <>
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-medium underline">
              {t("signupLink")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-medium underline">
              {t("loginLink")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
