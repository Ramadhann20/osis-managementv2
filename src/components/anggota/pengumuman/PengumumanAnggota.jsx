"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  formatShortDate,
  getAnnouncementCategoryLabel,
  sortByDateDescending,
} from "@/components/anggota/_shared/formatters";
import {
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
} from "@/components/anggota/_shared/Ui";

export default function PengumumanAnggota() {
  const { colRef } = useDb();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const announcements = useCollection(
    () => colRef("Pengumuman"),
    [],
    { enabled: true }
  );

  const data = useMemo(() => {
    const all = sortByDateDescending(
      (announcements.data || []).filter(
        (item) =>
          item.isPublished !== false &&
          (!Array.isArray(item.audienceRoles) ||
            item.audienceRoles.includes("anggota"))
      ),
      "publishedAt"
    ).sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return Number(b.isPinned) - Number(a.isPinned);
    });

    return all.filter((announcement) => {
      const keyword = search.trim().toLowerCase();

      const matchesCategory =
        category === "all" ||
        announcement.category === category;

      const matchesSearch =
        !keyword ||
        announcement.title
          ?.toLowerCase()
          .includes(keyword) ||
        announcement.summary
          ?.toLowerCase()
          .includes(keyword) ||
        announcement.content
          ?.toLowerCase()
          .includes(keyword) ||
        announcement.authorName
          ?.toLowerCase()
          .includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [announcements.data, category, search]);

  if (announcements.loading) {
    return <PageLoading message="Memuat pengumuman..." />;
  }

  if (announcements.error) {
    return <PageError />;
  }

  return (
    <div>
      <PageHeading
        eyebrow="Pusat Informasi"
        title="Pengumuman OSIS"
        description="Informasi resmi, agenda, dan pemberitahuan terbaru untuk anggota."
        action={
          <DisabledAction icon="campaign">
            Buat Pengumuman
          </DisabledAction>
        }
      />

      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Semua"],
            ["internal", "Internal"],
            ["general", "Umum"],
            ["important", "Penting"],
            ["competition", "Kompetisi"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                category === value
                  ? "bg-primary text-white"
                  : "bg-input text-text-muted hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <AppIcon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pengumuman atau penulis"
            className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-80"
          />
        </div>
      </section>

      {data.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="Pengumuman tidak ditemukan"
          description="Coba ubah kategori atau kata pencarian."
        />
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {data.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }) {
  const priorityStyle = {
    urgent: "bg-red-50 text-red-700",
    high: "bg-amber-50 text-amber-700",
    normal: "bg-primary/10 text-primary",
  };

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {getAnnouncementCategoryLabel(
              announcement.category
            )}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              priorityStyle[announcement.priority] ||
              priorityStyle.normal
            }`}
          >
            {announcement.priority === "urgent"
              ? "Mendesak"
              : announcement.priority === "high"
                ? "Prioritas Tinggi"
                : "Normal"}
          </span>
        </div>

        {announcement.isPinned && (
          <span className="rounded-full bg-input px-3 py-1 text-[10px] font-semibold text-text-muted">
            Disematkan
          </span>
        )}
      </div>

      <h2 className="mt-5 text-lg font-bold leading-7 text-text">
        {announcement.title}
      </h2>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-muted">
        {announcement.content ||
          announcement.summary ||
          "Tidak ada isi pengumuman."}
      </p>

      <div className="mt-5 rounded-xl bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(announcement.authorName || "A")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">
              {announcement.authorName ||
                "Pengurus OSIS"}
            </p>
            <p className="truncate text-xs text-text-muted">
              {announcement.authorPosition || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted">
            Diterbitkan
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {formatShortDate(announcement.publishedAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {announcement.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <AppIcon name="receipt" size={16} />
              {announcement.attachments.length} lampiran
            </span>
          )}

          <DisabledAction
            icon={
              announcement.action?.type === "download"
                ? "download"
                : "chevron_right"
            }
            variant="outline"
          >
            {announcement.action?.label || "Lihat Detail"}
          </DisabledAction>
        </div>
      </div>
    </article>
  );
}
