"use client";

import AppIcon from "@/components/global/AppIcon";
import { formatDateTime } from "@/components/pembina/_shared/firestoreHelpers";
import {
  ActivityStatusBadge,
  DisabledAction,
  EmptyState,
  StatCard,
} from "@/components/pembina/_shared/PembinaUi";
import {
  activityMatchesSearch,
  KegiatanFilterBar,
  KegiatanMeta,
  organiserLabel,
} from "./KegiatanSectionUi";

function participantLabel(activity) {
  const count = activity?.participantCount || 0;

  if (activity?.participantCapacity) {
    return `${count}/${activity.participantCapacity}`;
  }

  return `${count} peserta`;
}

export default function RapatSection({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeSelector,
}) {
  const keyword = search.trim().toLowerCase();

  const filtered = rows.filter(
    (item) =>
      activityMatchesSearch(item, keyword) &&
      (statusFilter === "all" || item.status === statusFilter)
  );

  return (
    <div>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="groups"
          label="Total Rapat"
          value={rows.length}
          helper="Seluruh agenda rapat OSIS"
        />
        <StatCard
          icon="calendar_month"
          label="Terjadwal"
          value={rows.filter((item) => item.status === "upcoming").length}
          helper="Belum dimulai"
          accent="blue"
        />
        <StatCard
          icon="fact_check"
          label="Berlangsung"
          value={rows.filter((item) => item.status === "ongoing").length}
          helper="Sedang dilaksanakan"
          accent="amber"
        />
        <StatCard
          icon="check"
          label="Selesai"
          value={rows.filter((item) => item.status === "completed").length}
          helper="Rapat telah ditutup"
          accent="green"
        />
      </section>

      {typeSelector}

      <KegiatanFilterBar
        eyebrow="Agenda Organisasi"
        title="Daftar Rapat"
        count={filtered.length}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchPlaceholder="Cari rapat"
        options={[
          ["draft", "Draf"],
          ["upcoming", "Terjadwal"],
          ["ongoing", "Berlangsung"],
          ["completed", "Selesai"],
          ["cancelled", "Dibatalkan"],
        ]}
      />

      {filtered.length ? (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((activity) => (
            <article
              key={activity.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Rapat
                      </span>
                      <ActivityStatusBadge status={activity.status} />
                    </div>

                    <h2 className="mt-3 font-bold text-text">
                      {activity.title || "Rapat tanpa judul"}
                    </h2>

                    <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 text-text-muted">
                      {activity.description || "Tidak ada agenda atau deskripsi."}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    aria-label="Menu rapat"
                    className="rounded-lg p-2 text-text-muted opacity-60"
                  >
                    <AppIcon name="more_vert" size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <KegiatanMeta
                  label="Waktu"
                  value={formatDateTime(activity.startAt)}
                />
                <KegiatanMeta
                  label="Lokasi"
                  value={activity.location || "-"}
                />
                <KegiatanMeta
                  label="Penyelenggara"
                  value={organiserLabel(activity)}
                />
                <KegiatanMeta
                  label="Peserta Rapat"
                  value={participantLabel(activity)}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface p-4">
                <DisabledAction icon="visibility" variant="neutral">
                  Detail
                </DisabledAction>
                <DisabledAction icon="edit" variant="outline">
                  Edit
                </DisabledAction>
                <DisabledAction icon="block" variant="danger">
                  Batalkan
                </DisabledAction>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon="groups"
          title="Rapat tidak ditemukan"
          description="Coba ubah pencarian atau filter status."
        />
      )}
    </div>
  );
}