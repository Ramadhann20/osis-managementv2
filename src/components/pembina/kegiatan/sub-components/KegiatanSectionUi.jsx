"use client";

export function KegiatanFilterBar({
  eyebrow = "Manajemen Kegiatan",
  title,
  count,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  options,
  searchPlaceholder = "Cari kegiatan",
}) {
  return (
    <header className="my-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
          {count} data ditampilkan. Gunakan pencarian atau status untuk
          mempersempit daftar.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none transition focus:border-primary sm:min-w-64"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none transition focus:border-primary sm:w-auto sm:min-w-44"
        >
          <option value="all">Semua Status</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

export function KegiatanMeta({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-text">
        {value || "-"}
      </p>
    </div>
  );
}

export function activityMatchesSearch(item, keyword) {
  if (!keyword) return true;

  return Boolean(
    item.title?.toLowerCase().includes(keyword) ||
      item.location?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.division?.shortName?.toLowerCase().includes(keyword) ||
      item.organiser?.fullName?.toLowerCase().includes(keyword)
  );
}

export function organiserLabel(activity) {
  if (activity?.division) {
    return `Sekbid ${activity.division.code}: ${activity.division.shortName}`;
  }

  if (activity?.organiser?.fullName) {
    return activity.organiser.fullName;
  }

  return "Pengurus Inti";
}