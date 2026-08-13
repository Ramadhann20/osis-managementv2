"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { isBadanPengurusHarian } from "@/components/anggota/_shared/AksesOrganisasi";
import PengumumanFormOverlay from "@/components/pengumuman/PengumumanFormOverlay";
import PengumumanDetailOverlay from "@/components/pengumuman/PengumumanDetailOverlay";
import {
  FILTER_PENGUMUMAN,
  KOLEKSI_PENGUMUMAN,
  OPSI_FILTER_PENGUMUMAN,
  cocokFilterPengumuman,
  cocokPencarianPengumuman,
  formatTanggalPengumuman,
  getAudienceType,
  isPengumumanPenting,
  labelAudiensPengumuman,
  labelDivisi,
  rowsOf,
  sortPengumuman,
} from "@/components/pengumuman/konfigurasiPengumuman";

export default function PengumumanPembina() {
  const { user, userDoc } = useAuth();
  const { colRef, deleteDoc } = useDb();

  const announcements = useCollection(() => colRef(KOLEKSI_PENGUMUMAN), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], { enabled: true });

  const [filter, setFilter] = useState(FILTER_PENGUMUMAN.SEMUA);
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [detailAnnouncement, setDetailAnnouncement] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const divisionRows = rowsOf(divisions);
  const divisionMap = useMemo(
    () => new Map(divisionRows.map((item) => [item.id, item])),
    [divisionRows]
  );

  // BPH bukan target "Sekbid internal". Karena itu pilihan internal hanya
  // memuat divisi selain Badan Pengurus Harian.
  const targetableDivisions = useMemo(
    () =>
      divisionRows
        .filter((division) => !isBadanPengurusHarian(division))
        .sort((a, b) =>
          labelDivisi(a).localeCompare(labelDivisi(b), "id")
        ),
    [divisionRows]
  );

  const data = useMemo(() => {
    const all = sortPengumuman(
      rowsOf(announcements).filter((item) => item.isPublished !== false)
    );

    const filtered = all.filter(
      (item) =>
        cocokFilterPengumuman(item, filter) &&
        cocokPencarianPengumuman(item, search)
    );

    return {
      all,
      filtered,
      important: all.filter(isPengumumanPenting),
      internal: all.filter((item) => getAudienceType(item) === "internal"),
      general: all.filter((item) => getAudienceType(item) !== "internal"),
    };
  }, [announcements, filter, search]);

  const editor = useMemo(
    () => ({
      type: "pembina",
      id: userDoc?.id || user?.uid || null,
      userId: user?.uid || userDoc?.uid || null,
      name:
        userDoc?.namaLengkap ||
        userDoc?.username ||
        user?.displayName ||
        "Pembina OSIS",
      position: "Pembina OSIS",
      divisionId: null,
      divisionName: null,
      canTargetAnyDivision: true,
      fixedInternalDivisionId: null,
    }),
    [user, userDoc]
  );

  const openCreate = () => {
    setEditingAnnouncement(null);
    setComposerOpen(true);
  };

  const openEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setComposerOpen(true);
  };

  const handleDelete = async (announcement) => {
    if (!announcement?.id || deletingId) return;

    const approved = window.confirm(
      `Hapus pengumuman "${announcement.title || "Pengumuman"}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!approved) return;

    setDeletingId(announcement.id);
    try {
      await deleteDoc(KOLEKSI_PENGUMUMAN, announcement.id);
      if (detailAnnouncement?.id === announcement.id) {
        setDetailAnnouncement(null);
      }
    } catch (error) {
      console.error("HAPUS PENGUMUMAN ERROR:", error);
      window.alert("Pengumuman belum berhasil dihapus.");
    } finally {
      setDeletingId("");
    }
  };

  if (announcements.loading || divisions.loading) {
    return <PembinaState icon="campaign" title="Memuat pengumuman..." />;
  }

  if (announcements.error || divisions.error) {
    return (
      <PembinaState
        icon="error_outline"
        title="Pengumuman belum dapat dimuat"
        description={
          announcements.error?.message || divisions.error?.message || "Terjadi kesalahan."
        }
      />
    );
  }

  const featured = data.important[0] || data.all[0] || null;
  const feedRows = data.filtered.filter((item) => item.id !== featured?.id);

  return (
    <div className="space-y-7">
      {/*
       * Layout sengaja memakai hero + bento metrics + editorial feed agar
       * halaman Pengumuman memiliki identitas sendiri, tetapi tetap memakai
       * token warna/theme yang sama dengan modul lain.
       */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <article className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary-hover p-6 text-white shadow-sm sm:p-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-white/5 blur-2xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
              <AppIcon name="campaign" size={15} />
              Pusat Informasi OSIS
            </span>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Kelola pengumuman organisasi tanpa membuat informasi tercecer.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
              Pembina dapat menerbitkan informasi untuk seluruh anggota atau
              mengarahkannya khusus ke satu Sekbid. Informasi penting dapat
              diberi mark agar selalu tampil lebih menonjol.
            </p>

            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <AppIcon name="add" size={19} />
              Buat Pengumuman
            </button>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-1">
          <MetricCard
            icon="campaign"
            label="Diterbitkan"
            value={data.all.length}
            helper="Total informasi aktif"
          />
          <MetricCard
            icon="notifications"
            label="Ditandai Penting"
            value={data.important.length}
            helper="Diprioritaskan di daftar"
            accent="amber"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <AppIcon name="groups" size={22} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                Distribusi Informasi
              </p>
              <h2 className="font-bold text-text">Jangkauan Pengumuman</h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric label="Umum" value={data.general.length} />
            <MiniMetric label="Internal" value={data.internal.length} />
          </div>

          <p className="mt-4 text-xs leading-5 text-text-muted">
            Pengumuman internal hanya ditampilkan kepada Sekbid tujuan. BPH tetap
            dapat memantau seluruh informasi dari akun anggota.
          </p>
        </div>

        <div className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Arsip Informasi
              </p>
              <h2 className="mt-1 text-lg font-bold text-text">Cari dan Saring</h2>
            </div>

            <div className="relative w-full md:w-72">
              <AppIcon
                name="search"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul atau penulis"
                className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {OPSI_FILTER_PENGUMUMAN.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filter === value
                    ? "bg-primary text-white"
                    : "bg-surface text-text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featured && cocokFilterPengumuman(featured, filter) && cocokPencarianPengumuman(featured, search) && (
        <FeaturedAnnouncement
          announcement={featured}
          divisionMap={divisionMap}
          onOpen={() => setDetailAnnouncement(featured)}
          onEdit={() => openEdit(featured)}
          onDelete={() => handleDelete(featured)}
          deleting={deletingId === featured.id}
        />
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Pengumuman Lainnya
            </p>
            <h2 className="mt-1 text-xl font-bold text-text">Feed Informasi</h2>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {data.filtered.length} data
          </span>
        </div>

        {feedRows.length ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {feedRows.map((announcement, index) => (
              <PembinaAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                divisionMap={divisionMap}
                index={index}
                onOpen={() => setDetailAnnouncement(announcement)}
                onEdit={() => openEdit(announcement)}
                onDelete={() => handleDelete(announcement)}
                deleting={deletingId === announcement.id}
              />
            ))}
          </div>
        ) : (
          <PembinaState
            icon="campaign"
            title="Tidak ada pengumuman pada filter ini"
            description="Coba ubah filter atau kata pencarian."
            compact
          />
        )}
      </section>

      {composerOpen && (
        <PengumumanFormOverlay
          editor={editor}
          divisions={targetableDivisions}
          initialAnnouncement={editingAnnouncement}
          onClose={() => {
            setComposerOpen(false);
            setEditingAnnouncement(null);
          }}
        />
      )}

      {detailAnnouncement && (
        <PengumumanDetailOverlay
          announcement={detailAnnouncement}
          divisionMap={divisionMap}
          onClose={() => setDetailAnnouncement(null)}
        />
      )}
    </div>
  );
}

function FeaturedAnnouncement({
  announcement,
  divisionMap,
  onOpen,
  onEdit,
  onDelete,
  deleting,
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-card to-card shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr]">
        <button
          type="button"
          onClick={onOpen}
          className="p-6 text-left transition hover:bg-white/30 sm:p-7"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              <AppIcon name="notifications" size={14} />
              Sorotan
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold text-text-muted">
              {labelAudiensPengumuman(announcement, divisionMap)}
            </span>
          </div>

          <h2 className="mt-5 max-w-3xl text-xl font-bold leading-8 text-text sm:text-2xl">
            {announcement.title}
          </h2>
          <p className="mt-3 max-w-3xl line-clamp-3 text-sm leading-7 text-text-muted">
            {announcement.content || announcement.summary}
          </p>
        </button>

        <div className="flex flex-col justify-between border-t border-amber-200/70 bg-white/35 p-6 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Diterbitkan
            </p>
            <p className="mt-2 text-sm font-bold text-text">
              {announcement.authorName || "Pembina OSIS"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {formatTanggalPengumuman(announcement.publishedAt, { withTime: true })}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold text-text hover:border-primary/30 hover:text-primary"
            >
              <AppIcon name="edit" size={17} />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <AppIcon name="delete" size={17} />
              {deleting ? "Menghapus" : "Hapus"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PembinaAnnouncementCard({
  announcement,
  divisionMap,
  index,
  onOpen,
  onEdit,
  onDelete,
  deleting,
}) {
  const important = isPengumumanPenting(announcement);
  const internal = getAudienceType(announcement) === "internal";
  const offsetClass = index % 3 === 1 ? "lg:translate-y-3" : "";

  return (
    <article
      className={`flex min-h-72 flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${offsetClass}`}
    >
      <button type="button" onClick={onOpen} className="flex-1 p-5 text-left sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              internal
                ? "bg-blue-50 text-blue-700"
                : "bg-primary/10 text-primary"
            }`}
          >
            <AppIcon name={internal ? "groups" : "campaign"} size={14} />
            {labelAudiensPengumuman(announcement, divisionMap)}
          </span>

          {important && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AppIcon name="notifications" size={17} />
            </span>
          )}
        </div>

        <h3 className="mt-5 text-lg font-bold leading-7 text-text">
          {announcement.title}
        </h3>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-muted">
          {announcement.content || announcement.summary || "Tidak ada isi pengumuman."}
        </p>
      </button>

      <div className="border-t border-border bg-surface/70 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-text">
              {announcement.authorName || "Pengurus OSIS"}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {formatTanggalPengumuman(announcement.publishedAt)}
            </p>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit pengumuman"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-card hover:text-primary"
            >
              <AppIcon name="edit" size={17} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Hapus pengumuman"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <AppIcon name="delete" size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ icon, label, value, helper, accent = "primary" }) {
  const className =
    accent === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-primary/10 text-primary";

  return (
    <article className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}>
        <AppIcon name={icon} size={20} />
      </span>
      <p className="mt-5 text-3xl font-bold tracking-tight text-text">{value}</p>
      <p className="mt-1 text-sm font-bold text-text">{label}</p>
      <p className="mt-1 text-xs text-text-muted">{helper}</p>
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="mt-1 text-xs font-semibold text-text-muted">{label}</p>
    </div>
  );
}

function PembinaState({ icon, title, description, compact = false }) {
  return (
    <div
      className={`rounded-[24px] border border-dashed border-border bg-card text-center ${
        compact ? "p-8" : "p-12"
      }`}
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <AppIcon name={icon} size={24} />
      </span>
      <h2 className="mt-4 font-bold text-text">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
