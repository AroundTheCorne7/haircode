"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tenantSlug: z.string().min(1, "Salon identifier is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message ?? "Invalid credentials");
        return;
      }
      const loginResponse = await res.json() as { accessToken: string; salonName?: string; email?: string };
      localStorage.setItem("hc_token", loginResponse.accessToken);
      // Also set cookie so Next.js middleware can protect dashboard routes
      document.cookie = `hc_token=${loginResponse.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      if (loginResponse.salonName) localStorage.setItem("hc_salon_name", loginResponse.salonName);
      if (loginResponse.email) localStorage.setItem("hc_user_email", loginResponse.email);
      router.push("/dashboard");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl p-8 shadow-xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Salon Identifier</label>
        <input
          {...register("tenantSlug")}
          type="text"
          autoComplete="organization"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="your-salon-slug"
        />
        {errors.tenantSlug && <p className="mt-1 text-xs text-red-500">{errors.tenantSlug.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="you@salon.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
