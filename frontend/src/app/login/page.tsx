"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  full_name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.post("/auth/register", {
          full_name: data.full_name,
          email: data.email,
          password: data.password,
        });
      }
      const res = await api.post("/auth/login", { email: data.email, password: data.password });
      const userRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      setAuth(userRes.data, res.data);
      router.push(redirect);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-star-white">Akash</h1>
          <p className="text-white/50 text-sm mt-2">Sign in to name your star</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-space-800 rounded-xl p-1 mb-6">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "bg-star-blue text-space-950" : "text-white/50"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="form-label">Full Name</label>
              <input {...register("full_name", { required: true })} placeholder="Your full name" className="form-input" />
            </div>
          )}
          <div>
            <label className="form-label">Email</label>
            <input {...register("email", { required: true })} type="email" placeholder="you@example.com" className="form-input" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input {...register("password", { required: true, minLength: 8 })} type="password" placeholder="••••••••" className="form-input" />
            {mode === "register" && (
              <p className="text-white/30 text-xs mt-1">Min 8 characters, at least one uppercase and one number</p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full btn-primary py-4">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-white/30 text-sm mt-6">
          <Link href="/" className="text-star-blue">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
