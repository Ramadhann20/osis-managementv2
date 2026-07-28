"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  firstError,
  formatDate,
  isLoading,
  percentage,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  Avatar,
  DisabledAction,
  EmptyState,
  MemberStatusBadge,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/pembina/_shared/PembinaUi";

export default function DataAnggotaPembina() {
  const { colRef } = useDb();

  const members = useCollection(() => colRef("Anggota"), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: true,
  });
  const periods = useCollection(() => colRef("Periode"), [], {
    enabled: true,
  });
  const summaries = useCollection(
    () => colRef("RingkasanAbsensi"),
    [],
    { enabled: true }
  );

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const loading = isLoading(members, divisions, periods, summaries);
  const error = firstError(members, divisions, periods, summaries);

  const data = useMemo(() => {
    const divisionRows = rowsOf(divisions);
    const summaryRows = rowsOf(summaries);
    const divisionMap = new Map(
      divisionRows.map((item) => [item.id, item])
    );
    const summaryMap = new Map(
      summaryRows.map((item) => [item.memberId, item])
    );

    const official = rowsOf(members)
      .filter((item) =>
        ["active", "inactive", "suspended"].includes(
          item.membershipStatus
        )
      )
      .map((item) => ({
        ...item,
        division: divisionMap.get(item.divisionId) || null,
        summary: summaryMap.get(item.id) || null,
      }));

    const keyword = search.trim().toLowerCase();

    const filtered = sortDateDesc(official, "updatedAt").filter((item) => {
      const matchesSearch =
        !keyword ||
        item.fullName?.toLowerCase().includes(keyword) ||
        item.nis?.toLowerCase().includes(keyword) ||
        item.className?.toLowerCase().includes(keyword) ||
        item.organisationPosition?.toLowerCase().includes(keyword);

      return (
        matchesSearch &&
        (divisionFilter === "all" ||
          item.divisionId === divisionFilter) &&
        (statusFilter === "all" ||
          item.membershipStatus === statusFilter) &&
        (periodFilter === "all" || item.period === periodFilter)
      );
    });

    return {
      official,
      filtered,
      active: official.filter(
        (item) => item.membershipStatus === "active"
      ).length,
      inactive: official.filter(
        (item) => item.membershipStatus === "inactive"
      ).length,
      suspended: official.filter(
        (item) => item.membershipStatus === "suspended"
      ).length,
      divisionRows,
    };
  }, [
    members,
    divisions,
    summaries,
    search,
    divisionFilter,
    statusFilter,
    periodFilter,
  ]);

  if (loading) return <PageLoading message="Memuat data anggota..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Database Pengurus"
        title="Data Anggota OSIS"
        description="Manajemen tampilan data anggota resmi, jabatan, sekbid, status, dan ringkasan kehadiran."
        action={
          <div className="flex flex-wrap gap-3">
            <DisabledAction icon="download" variant="outline">
              Export
            </DisabledAction>
            <DisabledAction icon="add">Tambah Anggota</DisabledAction>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="groups"
          label="Total Anggota"
          value={data.official.length}
          helper="Anggota resmi seluruh status"
        />
        <StatCard
          icon="verified_user"
          label="Status Aktif"
          value={data.active}
          helper="Anggota aktif periode berjalan"
          accent="green"
        />
        <StatCard
          icon="badge"
          label="Divisi / Sekbid"
          value={data.divisionRows.length}
          helper="Jumlah unit organisasi"
          accent="blue"
        />
        <StatCard
          icon="person"
          label="Tidak Aktif"
          value={data.inactive + data.suspended}
          helper={`${data.inactive} tidak aktif, ${data.suspended} ditangguhkan`}
          accent="red"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-text">Daftar Anggota</h2>
            <p className="mt-1 text-xs text-text-muted">
              {data.filtered.length} data ditampilkan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                placeholder="Cari nama atau NIS"
                className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <select
              value={divisionFilter}
              onChange={(event) => setDivisionFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Sekbid</option>
              {data.divisionRows.map((division) => (
                <option key={division.id} value={division.id}>
                  Sekbid {division.code} - {division.shortName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>

            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Periode</option>
              {rowsOf(periods).map((period) => (
                <option key={period.id} value={period.label}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data.filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4">NIS</th>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Kelas</th>
                  <th className="px-5 py-4">Jabatan / Sekbid</th>
                  <th className="px-5 py-4">Kehadiran</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-input/40">
                    <td className="px-5 py-4 text-sm font-medium text-text">
                      {member.nis || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {member.fullName}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Bergabung {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {member.className || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-text">
                        {member.organisationPosition || "Anggota"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {member.division
                          ? `Sekbid ${member.division.code}: ${member.division.shortName}`
                          : "Pengurus Inti"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text">
                            {percentage(
                              member.summary?.attendancePercentage
                            )}
                            %
                          </span>
                          <span className="text-text-muted">
                            {member.summary?.totalActivities || 0} kegiatan
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-input">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${percentage(
                                member.summary?.attendancePercentage
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <MemberStatusBadge
                        status={member.membershipStatus}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <IconButton icon="visibility" label="Detail" />
                        <IconButton icon="edit" label="Edit" />
                        <IconButton icon="block" label="Nonaktifkan" danger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon="groups"
              title="Anggota tidak ditemukan"
              description="Coba ubah pencarian atau filter."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function IconButton({ icon, label, danger = false }) {
  return (
    <button
      type="button"
      disabled
      title={`${label} akan diaktifkan pada tahap berikutnya`}
      className={`rounded-lg p-2 opacity-60 ${
        danger ? "text-error-text" : "text-primary"
      }`}
    >
      <AppIcon name={icon} size={19} />
    </button>
  );
}
