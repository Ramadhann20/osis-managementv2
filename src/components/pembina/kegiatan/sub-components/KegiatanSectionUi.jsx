"use client";

import { LABEL_STATUS } from "../konfigurasiManajemenKegiatan";

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
          <option value="semua">Semua Status</option>
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

export function kegiatanCocokPencarian(item, keyword) {
  if (!keyword) return true;

  return Boolean(
    item.namaKegiatan?.toLowerCase().includes(keyword) ||
      item.idReferensi?.toLowerCase().includes(keyword) ||
      item.lokasi?.toLowerCase().includes(keyword) ||
      item.deskripsi?.toLowerCase().includes(keyword) ||
      item.divisi?.namaSingkat?.toLowerCase().includes(keyword) ||
      item.penanggungJawab?.namaLengkap?.toLowerCase().includes(keyword)
  );
}

export function labelPenyelenggara(kegiatan) {
  if (kegiatan?.divisi) {
    const kode = kegiatan.divisi.kode ? ` ${kegiatan.divisi.kode}` : "";
    const nama = kegiatan.divisi.namaSingkat || kegiatan.divisi.nama || "Tanpa nama";
    return `Sekbid${kode}: ${nama}`;
  }

  if (kegiatan?.penanggungJawab?.namaLengkap) {
    return kegiatan.penanggungJawab.namaLengkap;
  }

  return "Pengurus Inti";
}

const WARNA_STATUS = {
  draf: "bg-input text-text-muted",
  terencana: "bg-slate-100 text-slate-700",
  akan_datang: "bg-blue-50 text-blue-700",
  berlangsung: "bg-amber-50 text-amber-700",
  selesai: "bg-green-50 text-green-700",
  dibatalkan: "bg-red-50 text-red-700",
  belum_diajukan: "bg-slate-100 text-slate-700",
  diajukan: "bg-blue-50 text-blue-700",
  menunggu_review: "bg-amber-50 text-amber-700",
  perlu_revisi: "bg-red-50 text-red-700",
  disetujui: "bg-green-50 text-green-700",
  ditolak: "bg-red-50 text-red-700",
  belum_dimulai: "bg-slate-100 text-slate-700",
  menunggu: "bg-amber-50 text-amber-700",
};

export function BadgeStatus({ status, jenis = "kegiatan" }) {
  const label = LABEL_STATUS[jenis]?.[status] || status || "-";
  const warna = WARNA_STATUS[status] || "bg-input text-text-muted";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${warna}`}
    >
      {label}
    </span>
  );
}
