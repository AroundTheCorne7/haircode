import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-wide">HairCode™</h1>
          <p className="text-white/60 mt-2 text-sm">Professional Decision Engine</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
