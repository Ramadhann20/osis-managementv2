"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  formatDateTime,
  sortByDateDescending,
  toDate,
} from "@/components/anggota/_shared/formatters";
import {
  ActivityStatusBadge,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/anggota/_shared/Ui";

export default function KegiatanAnggota() {
  const { colRef } = useDb();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const activities = useCollection(
    () => colRef("Kegiatan"),
    [],
    { enabled: true }
  );

  const divisions = useCollection(
    () => colRef("Divisi"),
    [],
    { enabled: true }
  );

  const proposals = useCollection(
    () => colRef("Proposal"),
    [],
    { enabled: true }
  );

  const loading =
    activities.loading ||
    divisions.loading ||
    proposals.loading;

  const error =
    activities.error ||
    divisions.error ||
    proposals.error;

  const data = useMemo(() => {
    const divisionMap = new Map(
      (divisions.data || []).map((item) => [item.id, item])
    );
    const proposalMap = new Map(
      (proposals.data || []).map((item) => [item.id, item])
    );

    const all = sortByDateDescending(
      activities.data || [],
      "startAt"
    ).map((activity) => ({
      ...activity,
      division: divisionMap.get(activity.divisionId) || null,
      proposal: proposalMap.get(activity.proposalId) || null,
    }));

    const filtered = all.filter((activity) => {
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        activity.title?.toLowerCase().includes(keyword) ||
        activity.location?.toLowerCase().includes(keyword) ||
        activity.description?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        activity.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return {
      all,
      filtered,
      upcoming: all.filter(
        (item) => item.status === "upcoming"
      ).length,
      ongoing: all.filter(
        (item) => item.status === "ongoing"
      ).length,
      completed: all.filter(
        (item) => item.status === "completed"
      ).length,
    };
  }, [
    activities.data,
    divisions.data,
    proposals.data,
    search,
    statusFilter,
  ]);

  if (loading) {
    return <PageLoading message="Memuat kegiatan OSIS..." />;
  }

  if (error) {
    return <PageError />;
  }

  return (
    <div>
      <PageHeading
        eyebrow="Agenda Organisasi"
        title="Kegiatan OSIS"
        description="Daftar rapat, program kerja, workshop, dan kegiatan sekolah."
        action={
          <DisabledAction icon="event_available">
            Ajukan Kegiatan
          </DisabledAction>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="calendar_month"
          label="Total Kegiatan"
          value={data.all.length}
          helper="Seluruh kegiatan pada database."
        />
        <StatCard
          icon="event_available"
          label="Akan Datang"
          value={data.upcoming}
          helper="Kegiatan yang belum dimulai."
          accent="blue"
        />
        <StatCard
          icon="calendar_month"
          label="Berlangsung"
          value={data.ongoing}
          helper="Kegiatan yang sedang berjalan."
          accent="amber"
        />
        <StatCard
          icon="check"
          label="Selesai"
          value={data.completed}
          helper="Kegiatan yang telah ditutup."
          accent="green"
        />
      </section>

      <section className="mt-7">
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-text">
              Daftar Kegiatan
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {data.filtered.length} kegiatan ditampilkan.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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
                placeholder="Cari kegiatan atau lokasi"
                className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-72"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draf</option>
              <option value="upcoming">Akan Datang</option>
              <option value="ongoing">Berlangsung</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        {data.filtered.length === 0 ? (
          <EmptyState
            icon="event_available"
            title="Kegiatan tidak ditemukan"
            description="Coba ubah kata pencarian atau filter status."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {data.filtered.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityCard({ activity }) {
  const startDate = toDate(activity.startAt);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-white">
            <span className="text-[10px] font-semibold uppercase">
              {startDate
                ? new Intl.DateTimeFormat("id-ID", {
                    month: "short",
                  }).format(startDate)
                : "-"}
            </span>
            <span className="text-xl font-bold leading-none">
              {startDate
                ? new Intl.DateTimeFormat("id-ID", {
                    day: "2-digit",
                  }).format(startDate)
                : "-"}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-text">
                {activity.title}
              </h2>
              <ActivityStatusBadge status={activity.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">
              {activity.description || "Tidak ada deskripsi."}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="rounded-lg p-2 text-text-muted opacity-60"
        >
          <AppIcon name="more_vert" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <MetaItem
          label="Waktu"
          value={formatDateTime(activity.startAt)}
        />
        <MetaItem
          label="Lokasi"
          value={activity.location || "-"}
        />
        <MetaItem
          label="Penyelenggara"
          value={
            activity.division
              ? `Sekbid ${activity.division.code}: ${activity.division.shortName}`
              : "Pengurus Inti OSIS"
          }
        />
        <MetaItem
          label="Peserta"
          value={`${activity.participantCount || 0}/${
            activity.participantCapacity || "-"
          } peserta`}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-muted">
          Proposal:{" "}
          <span className="font-semibold text-text">
            {activity.proposal
              ? activity.proposal.status
              : "Tidak terhubung"}
          </span>
        </p>

        <DisabledAction
          icon="chevron_right"
          variant="outline"
          className="sm:min-w-32"
        >
          Detail
        </DisabledAction>
      </div>
    </article>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-text">
        {value}
      </p>
    </div>
  );
}
