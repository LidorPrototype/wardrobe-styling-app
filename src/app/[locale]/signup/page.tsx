import { AuthForm } from "@/components/auth/AuthForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function SignupPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-16">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}
