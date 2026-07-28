"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    authLoading,
    error: authError,
    clearError,
  } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidation = useMemo(
    () => ({
      minimumLength: form.password.length >= 6,
      hasLetter: /[A-Za-z]/.test(form.password),
      hasNumber: /\d/.test(form.password),
      matches:
        form.confirmPassword.length > 0 &&
        form.password === form.confirmPassword,
    }),
    [form.password, form.confirmPassword]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");

    if (authError) {
      clearError();
    }
  }

  function validateForm() {
    const email = form.email.trim();
    const username = form.username.trim();

    if (!email || !username || !form.password || !form.confirmPassword) {
      return "Semua kolom wajib diisi.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Format email tidak valid.";
    }

    if (username.length < 3) {
      return "Username minimal 3 karakter.";
    }

    if (username.length > 30) {
      return "Username maksimal 30 karakter.";
    }

    if (!/^[A-Za-z0-9._\s-]+$/.test(username)) {
      return "Username hanya boleh berisi huruf, angka, spasi, titik, garis bawah, atau tanda hubung.";
    }

    if (!passwordValidation.minimumLength) {
      return "Password minimal 6 karakter.";
    }

    if (!passwordValidation.hasLetter || !passwordValidation.hasNumber) {
      return "Password harus memiliki minimal satu huruf dan satu angka.";
    }

    if (!passwordValidation.matches) {
      return "Konfirmasi password tidak sama.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });


    } catch (error) {
      console.error("REGISTER PAGE ERROR:", error);
    }
  }

  const displayedError = formError || authError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
            <AppIcon name="person_add" size={36} />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Buat Akun</h1>
          <p className="mt-2 text-text-muted">
            Daftar untuk mulai mengakses sistem
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <Field
            id="email"
            label="Email"
            icon="mail"
            type="email"
            value={form.email}
            placeholder="Masukkan email"
            autoComplete="email"
            disabled={authLoading}
            onChange={handleChange}
          />

          <Field
            id="username"
            label="Username"
            icon="person"
            type="text"
            value={form.username}
            placeholder="Masukkan username"
            autoComplete="username"
            disabled={authLoading}
            minLength={3}
            maxLength={30}
            onChange={handleChange}
          />

          <PasswordField
            id="password"
            label="Password"
            value={form.password}
            placeholder="Minimal 6 karakter"
            visible={showPassword}
            disabled={authLoading}
            onChange={handleChange}
            onToggle={() => setShowPassword((current) => !current)}
          />

          {form.password && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <ValidationItem
                valid={passwordValidation.minimumLength}
                label="Minimal 6 karakter"
              />
              <ValidationItem
                valid={passwordValidation.hasLetter}
                label="Memiliki huruf"
              />
              <ValidationItem
                valid={passwordValidation.hasNumber}
                label="Memiliki angka"
              />
            </div>
          )}

          <PasswordField
            id="confirmPassword"
            label="Konfirmasi Password"
            value={form.confirmPassword}
            placeholder="Ulangi password"
            visible={showConfirmPassword}
            disabled={authLoading}
            onChange={handleChange}
            onToggle={() =>
              setShowConfirmPassword((current) => !current)
            }
          />

          {form.confirmPassword && (
            <ValidationItem
              valid={passwordValidation.matches}
              label={
                passwordValidation.matches
                  ? "Konfirmasi password sesuai"
                  : "Konfirmasi password belum sesuai"
              }
            />
          )}

          {displayedError && (
            <div
              className="rounded-xl bg-error-bg px-4 py-3 text-sm text-error-text"
              role="alert"
              aria-live="polite"
            >
              {displayedError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name="person_add" size={20} />
            {authLoading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
          Sudah punya akun?
          <Link
            href="/login"
            className="ml-1 font-medium text-primary hover:underline"
          >
            Masuk
          </Link>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  type,
  value,
  placeholder,
  autoComplete,
  disabled,
  onChange,
  minLength,
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-text"
      >
        {label}
      </label>

      <div className="relative">
        <AppIcon
          name={icon}
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          onChange={onChange}
          className="w-full rounded-xl border border-border bg-input py-3 pl-12 pr-4 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  placeholder,
  visible,
  disabled,
  onChange,
  onToggle,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-text"
      >
        {label}
      </label>

      <div className="relative">
        <AppIcon
          name="lock"
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />

        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete="new-password"
          disabled={disabled}
          minLength={6}
          onChange={onChange}
          className="w-full rounded-xl border border-border bg-input py-3 pl-12 pr-12 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AppIcon
            name={visible ? "visibility_off" : "visibility"}
            size={20}
          />
        </button>
      </div>
    </div>
  );
}

function ValidationItem({ valid, label }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        valid ? "text-primary" : "text-text-muted"
      }`}
    >
      <AppIcon name={valid ? "check" : "close"} size={15} />
      <span>{label}</span>
    </div>
  );
}
