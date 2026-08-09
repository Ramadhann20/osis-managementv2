"use client";

import AppIcon from "@/components/global/AppIcon";
import { getInitials } from "./dataAnggotaHelpers";
import {
  LABEL_STATUS_KEANGGOTAAN,
  STATUS_KEANGGOTAAN,
} from "./konfigurasiDataAnggota";

export function PageLoading({ message = "Memuat data..." }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center">
      <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-text-muted shadow-sm">
        {message}
      </div>
    </div>
  );
}

export function PageError({
  title = "Data tidak dapat dimuat",
  message = "Periksa koneksi dan Firestore Security Rules.",
}) {
  return (
    <div className="flex min-h-[460px] items-center justify-center">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-bg text-error-text">
          <AppIcon name="close" size={27} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-text">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{message}</p>
      </section>
    </div>
  );
}

export function EmptyState({
  icon = "receipt",
  title = "Belum ada data",
  description = "Data akan tampil setelah tersedia di Firestore.",
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <AppIcon name={icon} size={23} />
      </div>

      <h3 className="mt-4 font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
            {description}
          </p>
        )}
      </div>

      {action}
    </header>
  );
}

export function DisabledAction({
  icon,
  children,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary: "bg-primary text-white",
    outline: "border border-primary text-primary",
    neutral: "border border-border text-text-muted",
    danger: "border border-error-text text-error-text",
  };

  return (
    <button
      type="button"
      disabled
      title="Fitur akan diaktifkan pada tahap berikutnya"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold opacity-65 ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {icon && <AppIcon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function StatCard({
  icon,
  label,
  value,
  helper,
  badge,
  accent = "primary",
}) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            accents[accent] || accents.primary
          }`}
        >
          <AppIcon name={icon} size={25} />
        </div>

        {badge && (
          <span className="rounded-full bg-input px-3 py-1 text-[10px] font-bold text-text-muted">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-text">
        {value}
      </p>

      {helper && (
        <p className="mt-3 text-xs leading-5 text-text-muted">{helper}</p>
      )}
    </article>
  );
}

export function Avatar({ name, size = "md" }) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${
        sizes[size] || sizes.md
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

function Badge({ label, className }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export function MemberStatusBadge({ status }) {
  const styles = {
    [STATUS_KEANGGOTAAN.MENUNGGU_REVIEW]: "bg-amber-50 text-amber-700",
    [STATUS_KEANGGOTAAN.DITOLAK]: "bg-red-50 text-red-700",
    [STATUS_KEANGGOTAAN.AKTIF]: "bg-emerald-50 text-emerald-700",
    [STATUS_KEANGGOTAAN.NONAKTIF]: "bg-slate-100 text-slate-700",
    [STATUS_KEANGGOTAAN.DITANGGUHKAN]: "bg-orange-50 text-orange-700",
  };

  return (
    <Badge
      label={LABEL_STATUS_KEANGGOTAAN[status] || status || "-"}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}
