import AppIcon from "@/components/global/AppIcon";
import {
  activityStatusLabel,
  announcementStatusLabel,
  attendanceStatusLabel,
  getInitials,
  memberStatusLabel,
  proposalStatusLabel,
  reportStatusLabel,
} from "./firestoreHelpers";

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

export function SectionHeader({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppIcon name={icon} size={21} />
          </div>
        )}

        <div>
          <h2 className="font-bold text-text">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
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

export function Tabs({ items, value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-input p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
            value === item.value
              ? "bg-card text-primary shadow-sm"
              : "text-text-muted hover:text-text"
          }`}
        >
          {item.label}
        </button>
      ))}
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
    pending_review: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-slate-100 text-slate-700",
    suspended: "bg-orange-50 text-orange-700",
  };

  return (
    <Badge
      label={memberStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}

export function AttendanceStatusBadge({ status }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-700",
    late: "bg-amber-50 text-amber-700",
    excused: "bg-blue-50 text-blue-700",
    sick: "bg-violet-50 text-violet-700",
    absent: "bg-red-50 text-red-700",
  };

  return (
    <Badge
      label={attendanceStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}

export function ActivityStatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    upcoming: "bg-blue-50 text-blue-700",
    ongoing: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <Badge
      label={activityStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}

export function ProposalStatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-amber-50 text-amber-700",
    revision_required: "bg-orange-50 text-orange-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <Badge
      label={proposalStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}

export function AnnouncementStatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-blue-50 text-blue-700",
    published: "bg-emerald-50 text-emerald-700",
    archived: "bg-amber-50 text-amber-700",
  };

  return (
    <Badge
      label={announcementStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}

export function ReportStatusBadge({ status }) {
  const styles = {
    not_started: "bg-slate-100 text-slate-700",
    pending: "bg-amber-50 text-amber-700",
    submitted: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
  };

  return (
    <Badge
      label={reportStatusLabel(status)}
      className={styles[status] || "bg-input text-text-muted"}
    />
  );
}
