"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  formatShortDate,
  formatTime,
  sortByDateDescending,
} from "@/components/anggota/_shared/formatters";
import {
  AttendanceBadge,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/anggota/_shared/Ui";

export default function AbsensiAnggota() {
  const { member, memberId, loading: memberLoading, error: memberError } =
    useCurrentMember();
  const { colRef, query, where, limit } = useDb();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const attendance = useCollection(
    () =>
      query(
        colRef("Absensi"),
        where("memberId", "==", memberId)
      ),
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const summaries = useCollection(
    () =>
      query(
        colRef("RingkasanAbsensi"),
        where("memberId", "==", memberId),
        limit(1)
      ),
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const activities = useCollection(
    () => colRef("Kegiatan"),
    [],
    { enabled: true }
  );

  const loading =
    memberLoading ||
    attendance.loading ||
    summaries.loading ||
    activities.loading;

  const error =
    memberError ||
    attendance.error ||
    summaries.error ||
    activities.error;

  const rows = useMemo(() => {
    const activityMap = new Map(
      (activities.data || []).map((item) => [item.id, item])
    );

    return sortByDateDescending(
      attendance.data || [],
      "createdAt"
    )
      .map((record) => ({
        ...record,
        activity: activityMap.get(record.activityId) || null,
      }))
      .filter((record) => {
        const keyword = search.trim().toLowerCase();
        const matchesSearch =
          !keyword ||
          record.activity?.title
            ?.toLowerCase()
            .includes(keyword) ||
          record.activity?.location
            ?.toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          record.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [
    activities.data,
    attendance.data,
    search,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const stored = summaries.data?.[0];

    if (stored) return stored;

    const records = attendance.data || [];

    return {
      totalActivities: records.length,
      presentCount: records.filter(
        (item) => item.status === "present"
      ).length,
      lateCount: records.filter(
        (item) => item.status === "late"
      ).length,
      excusedCount: records.filter(
        (item) =>
          item.status === "excused" ||
          item.status === "sick"
      ).length,
      absentCount: records.filter(
        (item) => item.status === "absent"
      ).length,
      attendancePercentage: records.length
        ? Math.round(
            (records.filter((item) =>
              ["present", "late"].includes(item.status)
            ).length /
              records.length) *
              100
          )
        : 0,
    };
  }, [attendance.data, summaries.data]);

  if (loading) {
    return <PageLoading message="Memuat histori kehadiran..." />;
  }

  if (error) {
    return <PageError />;
  }

  if (!member) {
    return (
      <PageError
        title="Profil anggota tidak ditemukan"
        message="Histori absensi hanya dapat ditampilkan jika akun terhubung ke dokumen Anggota."
      />
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Kehadiran Anggota"
        title="Histori Kehadiran"
        description={`Rekap kehadiran ${member.fullName} pada kegiatan OSIS.`}
        action={
          <div className="flex flex-wrap gap-3">
            <DisabledAction icon="download" variant="neutral">
              Export PDF
            </DisabledAction>
            <DisabledAction icon="download">
              Export Excel
            </DisabledAction>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="event_available"
          label="Total Presensi"
          value={summary.totalActivities || 0}
          helper={`${summary.attendancePercentage || 0}% tingkat kehadiran`}
        />
        <StatCard
          icon="check"
          label="Hadir"
          value={summary.presentCount || 0}
          helper="Hadir tepat waktu."
          accent="green"
        />
        <StatCard
          icon="calendar_month"
          label="Terlambat"
          value={summary.lateCount || 0}
          helper="Kehadiran setelah waktu mulai."
          accent="amber"
        />
        <StatCard
          icon="close"
          label="Izin, Sakit, atau Alpa"
          value={
            (summary.excusedCount || 0) +
            (summary.sickCount || 0) +
            (summary.absentCount || 0)
          }
          helper="Kehadiran tidak penuh."
          accent="red"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-text">
              Daftar Kehadiran
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {rows.length} data ditampilkan.
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
                className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
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
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="excused">Izin</option>
              <option value="sick">Sakit</option>
              <option value="absent">Alpa</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="fact_check"
              title="Data kehadiran tidak ditemukan"
              description="Coba ubah kata pencarian atau filter status."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Kegiatan
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Tanggal
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Check In
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Check Out
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Catatan
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((record) => (
                  <tr key={record.id} className="hover:bg-input/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text">
                        {record.activity?.title ||
                          "Kegiatan tidak ditemukan"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {record.activity?.location || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatShortDate(
                        record.activity?.startAt ||
                          record.createdAt
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatTime(record.checkInAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatTime(record.checkOutAt)}
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-sm text-text-muted">
                      {record.note || "-"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <AttendanceBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
