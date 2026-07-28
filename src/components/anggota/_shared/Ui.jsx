import AppIcon from "@/components/global/AppIcon";

export function PageLoading({ message = "Memuat data..." }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-text-muted shadow-sm">
        {message}
      </div>
    </div>
  );
}

export function PageError({
  title = "Data tidak dapat dimuat",
  message = "Periksa koneksi dan aturan akses Firestore.",
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
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
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({
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
    primary:
      "bg-primary text-white hover:bg-primary-hover",
    outline:
      "border border-primary text-primary hover:bg-primary/5",
    neutral:
      "border border-border text-text-muted hover:bg-input",
  };

  return (
    <button
      type="button"
      disabled
      title="Fitur akan diaktifkan pada tahap berikutnya"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold opacity-70 ${variants[variant]} ${className}`}
    >
      {icon && <AppIcon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function AttendanceBadge({ status }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-700",
    late: "bg-amber-50 text-amber-700",
    excused: "bg-blue-50 text-blue-700",
    sick: "bg-violet-50 text-violet-700",
    absent: "bg-red-50 text-red-700",
  };

  const labels = {
    present: "Hadir",
    late: "Terlambat",
    excused: "Izin",
    sick: "Sakit",
    absent: "Alpa",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-input text-text-muted"
      }`}
    >
      {labels[status] || status || "-"}
    </span>
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

  const labels = {
    draft: "Draf",
    upcoming: "Akan Datang",
    ongoing: "Berlangsung",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-input text-text-muted"
      }`}
    >
      {labels[status] || status || "-"}
    </span>
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

  const labels = {
    draft: "Draf",
    pending_review: "Menunggu Review",
    revision_required: "Perlu Revisi",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-input text-text-muted"
      }`}
    >
      {labels[status] || status || "-"}
    </span>
  );
}

export function StatCard({
  icon,
  label,
  value,
  helper,
  accent = "primary",
}) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-text">
            {value}
          </p>
          {helper && (
            <p className="mt-2 text-xs leading-5 text-text-muted">
              {helper}
            </p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            accents[accent] || accents.primary
          }`}
        >
          <AppIcon name={icon} size={23} />
        </div>
      </div>
    </article>
  );
}
