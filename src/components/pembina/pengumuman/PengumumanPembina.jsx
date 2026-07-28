"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  firstError,
  formatDate,
  formatDateTime,
  isLoading,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  AnnouncementStatusBadge,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/pembina/_shared/PembinaUi";

export default function PengumumanPembina() {
  const { colRef } = useDb();

  const announcements = useCollection(
    () => colRef("Pengumuman"),
    [],
    { enabled: true }
  );
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: true,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const loading = isLoading(announcements, divisions);
  const error = firstError(announcements, divisions);

  const data = useMemo(() => {
    const divisionMap = new Map(
      rowsOf(divisions).map((item) => [item.id, item])
    );

    const rows = sortDateDesc(
      rowsOf(announcements),
      "updatedAt"
    ).map((item) => ({
      ...item,
      publicationStatus:
        item.publicationStatus ||
        (item.isPublished ? "published" : "draft"),
      targetDivisions: (item.audienceDivisionIds || [])
        .map((id) => divisionMap.get(id))
        .filter(Boolean),
    }));

    const keyword = search.trim().toLowerCase();

    return {
      rows,
      filtered: rows.filter((item) => {
        return (
          (!keyword ||
            item.title?.toLowerCase().includes(keyword) ||
            item.content?.toLowerCase().includes(keyword) ||
            item.summary?.toLowerCase().includes(keyword) ||
            item.authorName?.toLowerCase().includes(keyword)) &&
          (statusFilter === "all" ||
            item.publicationStatus === statusFilter) &&
          (categoryFilter === "all" ||
            item.category === categoryFilter)
        );
      }),
      draft: rows.filter(
        (item) => item.publicationStatus === "draft"
      ).length,
      scheduled: rows.filter(
        (item) => item.publicationStatus === "scheduled"
      ).length,
      published: rows.filter(
        (item) => item.publicationStatus === "published"
      ).length,
      archived: rows.filter(
        (item) => item.publicationStatus === "archived"
      ).length,
    };
  }, [
    announcements,
    divisions,
    statusFilter,
    categoryFilter,
    search,
  ]);

  if (loading) return <PageLoading message="Memuat pengumuman..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Pusat Informasi"
        title="Pengumuman"
        description="Kelola tampilan draf, jadwal, publikasi, target audiens, dan arsip pengumuman OSIS."
        action={
          <DisabledAction icon="add">Buat Pengumuman</DisabledAction>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="edit"
          label="Draf"
          value={data.draft}
          helper="Belum diterbitkan"
        />
        <StatCard
          icon="calendar_month"
          label="Terjadwal"
          value={data.scheduled}
          helper="Menunggu waktu publikasi"
          accent="blue"
        />
        <StatCard
          icon="campaign"
          label="Diterbitkan"
          value={data.published}
          helper="Sedang dapat dibaca"
          accent="green"
        />
        <StatCard
          icon="receipt"
          label="Diarsipkan"
          value={data.archived}
          helper="Tidak lagi ditampilkan"
          accent="amber"
        />
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <AppIcon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul atau penulis"
              className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draf</option>
            <option value="scheduled">Terjadwal</option>
            <option value="published">Diterbitkan</option>
            <option value="archived">Diarsipkan</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
          >
            <option value="all">Semua Kategori</option>
            <option value="internal">Internal</option>
            <option value="general">Umum</option>
            <option value="important">Penting</option>
            <option value="competition">Kompetisi</option>
          </select>
        </div>

        <div className="inline-flex rounded-xl bg-input p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              view === "grid"
                ? "bg-card text-primary shadow-sm"
                : "text-text-muted"
            }`}
          >
            Kartu
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              view === "list"
                ? "bg-card text-primary shadow-sm"
                : "text-text-muted"
            }`}
          >
            Daftar
          </button>
        </div>
      </section>

      {data.filtered.length ? (
        view === "grid" ? (
          <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {data.filtered.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))}
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {data.filtered.map((item) => (
                <AnnouncementRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        )
      ) : (
        <div className="mt-6">
          <EmptyState
            icon="campaign"
            title="Pengumuman tidak ditemukan"
          />
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ item }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <AnnouncementStatusBadge status={item.publicationStatus} />
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {item.category || "general"}
          </span>
        </div>

        {item.isPinned && (
          <span className="rounded-full bg-input px-3 py-1 text-[10px] font-bold text-text-muted">
            Disematkan
          </span>
        )}
      </div>

      <h2 className="mt-5 text-lg font-bold leading-7 text-text">
        {item.title}
      </h2>
      <p className="mt-3 max-h-20 overflow-hidden text-sm leading-6 text-text-muted">
        {item.content || item.summary || "-"}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-surface p-4">
        <Info label="Penulis" value={item.authorName || "-"} />
        <Info
          label="Target Role"
          value={(item.audienceRoles || []).join(", ") || "Semua"}
        />
        <Info
          label="Target Sekbid"
          value={
            item.targetDivisions.length
              ? item.targetDivisions
                  .map((division) => `Sekbid ${division.code}`)
                  .join(", ")
              : "Semua sekbid"
          }
        />
        <Info
          label="Pembaca"
          value={`${item.viewCount || 0} pembaca`}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-muted">
          {item.publicationStatus === "scheduled"
            ? `Dijadwalkan ${formatDateTime(item.scheduledAt)}`
            : `Diperbarui ${formatDate(item.updatedAt)}`}
        </p>

        <div className="flex gap-2">
          <DisabledAction icon="edit" variant="outline">
            Edit
          </DisabledAction>
          <DisabledAction
            icon={
              item.publicationStatus === "published"
                ? "block"
                : "campaign"
            }
            variant="neutral"
          >
            {item.publicationStatus === "published"
              ? "Arsipkan"
              : "Publikasikan"}
          </DisabledAction>
          <DisabledAction icon="delete" variant="danger">
            Hapus
          </DisabledAction>
        </div>
      </div>
    </article>
  );
}

function AnnouncementRow({ item }) {
  return (
    <article className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <AppIcon name="campaign" size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-text">{item.title}</h2>
          <AnnouncementStatusBadge status={item.publicationStatus} />
        </div>
        <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-text-muted">
          {item.summary || item.content}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 text-xs lg:w-72">
        <Info label="Penulis" value={item.authorName || "-"} />
        <Info label="Pembaca" value={String(item.viewCount || 0)} />
      </div>

      <DisabledAction icon="visibility" variant="outline">
        Detail
      </DisabledAction>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
