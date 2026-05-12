"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { login, register } from "@/services/authService";
import { unwrapAxiosError } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const tier = useAuthStore((state) => state.tier);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (mode === "register") {
      if (name.length < 2) {
        setMessage("Please enter a valid full name.");
        return;
      }

      if (password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const session =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      setSession(session);
      setMessage(
        mode === "login"
          ? "Login successful."
          : "Account created successfully.",
      );
    } catch (error) {
      setMessage(unwrapAxiosError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="section-shell grid gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Login or create your account
        </h1>

        {user ? (
          <div className="mt-8 space-y-5 rounded-[28px] border border-slate-100 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-zenvy-ink">{user.name}</p>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-zenvy-ink">
                {user.role}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Access</p>
                <p className="mt-2 text-lg font-semibold text-zenvy-ink">JWT Active</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Wishlist</p>
                <p className="mt-2 text-lg font-semibold text-zenvy-ink">{wishlistCount} saved</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mode</p>
                <p className="mt-2 text-lg font-semibold text-zenvy-ink">{tier ?? "gold"}</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-[28px] border border-slate-100 bg-white p-6"
          >
            <div className="flex gap-2 rounded-full bg-slate-100 p-1">
              {(["login", "register"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold ${
                    mode === option ? "bg-zenvy-ink text-white" : "text-slate-500"
                  }`}
                  onClick={() => {
                    setMode(option);
                    setMessage("");
                  }}
                >
                  {option === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {mode === "register" ? (
              <input
                name="name"
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                required
              />
            ) : null}

            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              required
            />

            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {mode === "register" ? (
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-zenvy-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
              </button>
            </div>

            {message ? (
              <p className="text-sm text-slate-600">{message}</p>
            ) : (
              <p className="text-xs leading-6 text-slate-400">
                If the backend is offline, ZENVY can still create and use a local preview account instead of showing a raw network failure.
              </p>
            )}
          </form>
        )}
      </section>

      <section className="grid gap-6">
        {[
          {
            icon: ShieldCheck,
            title: "JWT + refresh flow",
            text: "The frontend is wired to backend login, register, and protected endpoints with local preview fallback.",
          },
          {
            icon: Sparkles,
            title: "Auth methods mapped",
            text: "Email login is active now, and the UI still has clean room for future phone OTP, Google, and passkey expansion.",
          },
        ].map((item) => (
          <div key={item.title} className="glass-panel rounded-[34px] p-6">
            <item.icon className="h-6 w-6 text-zenvy-rose" />
            <h2 className="mt-4 text-2xl font-semibold text-zenvy-ink">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
