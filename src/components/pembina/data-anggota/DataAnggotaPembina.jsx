"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import BadanPengurusSection, {
  isBadanPengurus,
  isBadanPengurusDivision,
  sortBadanPengurus,
  sortSekbidMembers,
} from "./sub-components/BadanPengurusSection";
import PendingReviewSection from "./sub-components/PendingReviewSection";
import { useAnggotaDetailOverlay } from "./sub-components/AnggotaDetailOverlay";

export default function DataAnggotaPembina() {
  const { colRef } = useDb();
  const { openAnggotaDetail } = useAnggotaDetailOverlay();

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
  const tableScrollRef = useRef(null);

  const currentPeriod = "2026/2027";

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

    const memberRows = rowsOf(members).map((item) => ({
      ...item,
      division: divisionMap.get(item.divisionId) || null,
      summary: summaryMap.get(item.id) || null,
    }));

    const official = memberRows.filter((item) =>
      ["active", "inactive", "suspended"].includes(
        item.membershipStatus
      )
    );

    const pendingMembers = sortDateDesc(
      memberRows
        .filter(
          (item) => item.membershipStatus === "pending_review"
        )
        .map((item) => ({
          ...item,
          reviewSubmittedAt:
            item.submittedAt || item.createdAt || item.updatedAt,
        })),
      "reviewSubmittedAt"
    );

    const keyword = search.trim().toLowerCase();

    const matchesSearch = (item) =>
      !keyword ||
      item.fullName?.toLowerCase().includes(keyword) ||
      item.nis?.toLowerCase().includes(keyword) ||
      item.className?.toLowerCase().includes(keyword) ||
      item.organisationPosition?.toLowerCase().includes(keyword);

    const matchesBaseFilters = (item) =>
      (statusFilter === "all" ||
        item.membershipStatus === statusFilter) &&
      (periodFilter === "all" || item.period === periodFilter);

    const allBoardMembers = official.filter(isBadanPengurus);
    const allSekbidMembers = official.filter(
      (item) => !isBadanPengurus(item)
    );

    // Badan Pengurus selalu ditampilkan secara utuh dan tidak ikut
    // terpengaruh pencarian maupun filter sekbid, status, dan periode.
    const boardMembers = sortBadanPengurus(allBoardMembers);

    const filteredSekbidMembers = allSekbidMembers.filter(
      (item) =>
        matchesBaseFilters(item) &&
        matchesSearch(item) &&
        (divisionFilter === "all" ||
          item.divisionId === divisionFilter)
    );

    // Saat satu sekbid dipilih, Ketua Sekbid berada pada urutan pertama.
    const filtered =
      divisionFilter === "all"
        ? sortDateDesc(filteredSekbidMembers, "updatedAt")
        : sortSekbidMembers(filteredSekbidMembers);

    // Badan Pengurus tidak ditampilkan pada dropdown Sekbid.
    const sekbidRows = divisionRows.filter(
      (division) => !isBadanPengurusDivision(division)
    );

    const hasStoredBoardDivision = divisionRows.some(
      isBadanPengurusDivision
    );

    return {
      official,
      pendingMembers,
      filtered,
      boardMembers,
      active: official.filter(
        (item) => item.membershipStatus === "active"
      ).length,
      inactive: official.filter(
        (item) => item.membershipStatus === "inactive"
      ).length,
      suspended: official.filter(
        (item) => item.membershipStatus === "suspended"
      ).length,
      sekbidRows,
      divisionTotal:
        sekbidRows.length +
        (hasStoredBoardDivision || allBoardMembers.length ? 1 : 0),
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

  useEffect(() => {
    // Pastikan tabel kembali ke sisi kiri setelah isi/filter berubah.
    // Ini mencegah tabel terlihat bergeser apabila sebelumnya pengguna
    // sempat melakukan horizontal scroll.
    tableScrollRef.current?.scrollTo({ left: 0, top: 0 });
  }, [search, divisionFilter, statusFilter, periodFilter]);

  if (loading) return <PageLoading message="Memuat data anggota..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div className="min-w-0">
      <PageHeading
        eyebrow="Database Pengurus"
        title={`Data Anggota OSIS Periode ${currentPeriod}`}
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
          value={data.divisionTotal}
          helper="Termasuk Badan Pengurus"
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

      <PendingReviewSection members={data.pendingMembers} />

      <BadanPengurusSection members={data.boardMembers} />

      <section className="mt-7 min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-text">Daftar Anggota Sekbid</h2>
            <p className="mt-1 text-xs text-text-muted">
              {data.filtered.length} data ditampilkan.
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
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
              className="min-h-11 min-w-0 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Sekbid</option>
              {data.sekbidRows.map((division) => (
                <option key={division.id} value={division.id}>
                  Sekbid {division.code} - {division.shortName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 min-w-0 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>

            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
              className="min-h-11 min-w-0 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
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

        <div ref={tableScrollRef} className="w-full min-w-0 overflow-x-auto">
          {data.filtered.length ? (
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4">NIS</th>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Kelas</th>
                  <th className="px-5 py-4">Jabatan / Sekbid</th>
                  <th className="px-5 py-4">Kehadiran</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="w-14 px-5 py-4" aria-label="Buka detail" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.filtered.map((member) => (
                  <tr
                    key={member.id}
                    role="button"
                    tabIndex={0}
                    title={`Lihat detail ${member.fullName || "anggota"}`}
                    onClick={() => openAnggotaDetail(member)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openAnggotaDetail(member);
                      }
                    }}
                    className="group cursor-pointer transition-colors hover:bg-input/60 focus-visible:bg-input/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
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
                          : "Belum memiliki sekbid"}
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
                    <td className="w-14 px-5 py-4 text-right">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition group-hover:translate-x-0.5 group-hover:bg-primary/10 group-hover:text-primary">
                        <AppIcon name="chevron_right" size={21} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="min-h-44 p-5">
              <EmptyState
                icon="groups"
                title="Anggota sekbid tidak ditemukan"
                description="Coba ubah pencarian atau filter yang digunakan."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}