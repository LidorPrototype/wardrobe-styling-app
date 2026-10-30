import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const SignupSchema = z.object({
  email: z.email(),
  // Supabase default minimum is 6; require 8 for owner accounts.
  password: z.string().min(8),
});

export type AuthFormState =
  | {
      error?: string;
      fieldErrors?: {
        email?: string[];
        password?: string[];
      };
      // Echoed so a failed submit keeps the email. Never echo the password.
      email?: string;
    }
  | undefined;
