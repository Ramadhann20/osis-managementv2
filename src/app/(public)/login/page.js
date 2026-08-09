"use client";

import { useState } from "react";
import Link from "next/link";


import { usePathname, useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {

  const router = useRouter()

  const {
    login,
    authLoading,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (error) {
      clearError();
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      clearError();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await login(email, password);
     
    } catch (loginError) {
      console.error("LOGIN PAGE ERROR:", loginError);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-white shadow-sm">
            <img
              src="/images/logo-osis-mutiara.jpeg"
              alt="Logo OSIS SMA Mutiara"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Selamat Datang</h1>
          <p className="mt-2 text-text-muted">
            Login untuk mengakses sistem
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-text"
            >
              Email
            </label>

            <div className="relative">
              <AppIcon
                name="mail"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Masukkan email"
                autoComplete="email"
                disabled={authLoading}
                onChange={handleEmailChange}
                className="w-full rounded-xl border border-border bg-input py-3 pl-12 pr-4 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-text"
            >
              Password
            </label>

            <div className="relative">
              <AppIcon
                name="lock"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="Masukkan password"
                autoComplete="current-password"
                disabled={authLoading}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-border bg-input py-3 pl-12 pr-12 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                required
              />

              <button
                type="button"
                disabled={authLoading}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppIcon
                  name={showPassword ? "visibility_off" : "visibility"}
                  size={20}
                />
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl bg-error-bg px-4 py-3 text-sm text-error-text"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {authLoading ? "Memproses..." : "Masuk"}
            <AppIcon name="arrow_forward" size={20} />
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
          Belum punya akun?
          <Link
            href="/register"
            className="ml-1 font-medium text-primary hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </section>
    </main>
  );
}
