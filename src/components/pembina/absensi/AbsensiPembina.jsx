"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  attendanceStatusLabel,
  firstError,
  formatDate,
  formatDateTime,
  isLoading,
  percentage,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  AttendanceStatusBadge,
  Avatar,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  SectionHeader,
  StatCard,
  Tabs,
} from "@/components/pembina/_shared/PembinaUi";

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "sick", label: "Sakit" },
  { value: "excused", label: "Izin" },
  { value: "absent", label: "Alpa" },
];

export default function AbsensiPembina() {
  const { colRef } = useDb();

  const members = useCollection(() => colRef("Anggota"), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: true,
  });
  const activities = useCollection(() => colRef("Kegiatan"), [], {
    enabled: true,
  });
  const sessions = useCollection(() => colRef("SesiAbsensi"), [], {
    enabled: true,
  });
  const records = useCollection(() => colRef("Absensi"), [], {
    enabled: true,
  });
  const summaries = useCollection(
    () => colRef("RingkasanAbsensi"),
    [],
    { enabled: true }
  );

  const [tab, setTab] = useState("input");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");

  const loading = isLoading(
    members,
    divisions,
    activities,
    sessions,
    records,
    summaries
  );
  const error = firstError(
    members,
    divisions,
    activities,
    sessions,
    records,
    summaries
  );

  const data = useMemo(() => {
    const memberRows = rowsOf(members);
    const divisionRows = rowsOf(divisions);
    const activityRows = rowsOf(activities);
    const sessionRows = sortDateDesc(rowsOf(sessions), "startAt");
    const recordRows = rowsOf(records);
    const summaryRows = rowsOf(summaries);

    const divisionMap = new Map(
      divisionRows.map((item) => [item.id, item])
    );
    const activityMap = new Map(
      activityRows.map((item) => [item.id, item])
    );
    const memberMap = new Map(
      memberRows.map((item) => [item.id, item])
    );

    return {
      memberRows,
      divisionRows,
      sessionRows: sessionRows.map((item) => ({
        ...item,
        activity: activityMap.get(item.activityId) || null,
      })),
      recordRows,
      summaryRows: summaryRows.map((item) => ({
        ...item,
        member: memberMap.get(item.memberId) || null,
        division:
          divisionMap.get(memberMap.get(item.memberId)?.divisionId) ||
          null,
      })),
      divisionMap,
    };
  }, [members, divisions, activities, sessions, records, summaries]);

  useEffect(() => {
    if (!selectedSessionId && data.sessionRows.length) {
      const firstOpen =
        data.sessionRows.find((item) => item.status === "open") ||
        data.sessionRows[0];
      setSelectedSessionId(firstOpen.id);
    }
  }, [data.sessionRows, selectedSessionId]);

  if (loading) return <PageLoading message="Memuat absensi anggota..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Kehadiran Organisasi"
        title="Absensi Anggota"
        description="Pilih sesi kegiatan untuk melihat input kehadiran atau buka rekap kehadiran seluruh anggota."
        action={
          <div className="flex flex-wrap gap-3">
            <DisabledAction icon="download" variant="outline">
              Export
            </DisabledAction>
            <DisabledAction icon="add">Buat Sesi</DisabledAction>
          </div>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "input", label: "Input Absensi" },
          { value: "rekap", label: "Rekap Kehadiran" },
        ]}
      />

      {tab === "input" ? (
        <InputAttendance
          data={data}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
          search={search}
          setSearch={setSearch}
          divisionFilter={divisionFilter}
          setDivisionFilter={setDivisionFilter}
        />
      ) : (
        <AttendanceRecap
          data={data}
          search={search}
          setSearch={setSearch}
          divisionFilter={divisionFilter}
          setDivisionFilter={setDivisionFilter}
        />
      )}
    </div>
  );
}

function InputAttendance({
  data,
  selectedSessionId,
  setSelectedSessionId,
  search,
  setSearch,
  divisionFilter,
  setDivisionFilter,
}) {
  const selectedSession = data.sessionRows.find(
    (item) => item.id === selectedSessionId
  );

  const sessionRecords = data.recordRows.filter(
    (item) => item.sessionId === selectedSessionId
  );
  const recordMap = new Map(
    sessionRecords.map((item) => [item.memberId, item])
  );

  const expectedIds = selectedSession?.expectedMemberIds || [];
  const expectedSet = new Set(expectedIds);

  const members = data.memberRows
    .filter(
      (item) =>
        item.membershipStatus === "active" &&
        (!expectedIds.length || expectedSet.has(item.id))
    )
    .filter((item) => {
      const keyword = search.trim().toLowerCase();
      return (
        (!keyword ||
          item.fullName?.toLowerCase().includes(keyword) ||
          item.nis?.toLowerCase().includes(keyword)) &&
        (divisionFilter === "all" ||
          item.divisionId === divisionFilter)
      );
    });

  const counts = Object.fromEntries(
    ATTENDANCE_OPTIONS.map((option) => [
      option.value,
      sessionRecords.filter((item) => item.status === option.value)
        .length,
    ])
  );

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <SectionHeader
            icon="event_available"
            title="Pilih Sesi Kegiatan"
            description="Data kehadiran ditampilkan berdasarkan sesi yang dipilih."
          />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Sesi Absensi
              </label>
              <select
                value={selectedSessionId}
                onChange={(event) =>
                  setSelectedSessionId(event.target.value)
                }
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
              >
                {data.sessionRows.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.activity?.title || session.title} -{" "}
                    {formatDate(session.startAt)}
                  </option>
                ))}
              </select>
            </div>

            <InfoBox
              label="Tanggal Pelaksanaan"
              value={formatDateTime(selectedSession?.startAt)}
            />
            <InfoBox
              label="Lokasi"
              value={selectedSession?.activity?.location || "-"}
            />
            <InfoBox
              label="Status Sesi"
              value={
                selectedSession?.status === "open"
                  ? "Sedang Dibuka"
                  : selectedSession?.status === "closed"
                    ? "Sudah Ditutup"
                    : "Draf"
              }
            />
          </div>
        </article>

        <article className="rounded-2xl bg-primary p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
            Ringkasan Sementara
          </p>
          <p className="mt-4 text-4xl font-bold">
            {(counts.present || 0) + (counts.late || 0)}
            <span className="text-lg font-medium opacity-70">
              /{selectedSession?.expectedMemberIds?.length || members.length}
            </span>
          </p>
          <p className="mt-2 text-sm opacity-80">Hadir dan terlambat</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <SummaryBox label="Sakit / Izin" value={(counts.sick || 0) + (counts.excused || 0)} />
            <SummaryBox label="Alpa" value={counts.absent || 0} />
          </div>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-text">Daftar Kehadiran Anggota</h2>
            <p className="mt-1 text-xs text-text-muted">
              Status yang tampil merupakan data Firestore saat ini.
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari anggota"
                className="min-h-11 rounded-xl border border-border bg-input pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <select
              value={divisionFilter}
              onChange={(event) =>
                setDivisionFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Divisi</option>
              {data.divisionRows.map((division) => (
                <option key={division.id} value={division.id}>
                  Sekbid {division.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {members.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4">NIS</th>
                  <th className="px-5 py-4">Nama Anggota</th>
                  <th className="px-5 py-4">Divisi</th>
                  <th className="px-5 py-4 text-center">
                    Status Kehadiran
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {members.map((member) => {
                  const record = recordMap.get(member.id);

                  return (
                    <tr key={member.id} className="hover:bg-input/40">
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {member.nis}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-text">
                              {member.fullName}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {member.organisationPosition || "Anggota"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {data.divisionMap.get(member.divisionId)
                          ? `Sekbid ${
                              data.divisionMap.get(member.divisionId).code
                            }`
                          : "Pengurus Inti"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          {ATTENDANCE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              disabled
                              className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase ${
                                record?.status === option.value
                                  ? statusButtonClass(option.value)
                                  : "border-border text-text-muted"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {record?.note && (
                          <p className="mt-2 text-center text-xs text-text-muted">
                            {record.note}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon="groups" title="Anggota tidak ditemukan" />
          </div>
        )}

        <div className="flex justify-end border-t border-border p-5">
          <DisabledAction icon="check">Simpan Absensi</DisabledAction>
        </div>
      </section>
    </div>
  );
}

function AttendanceRecap({
  data,
  search,
  setSearch,
  divisionFilter,
  setDivisionFilter,
}) {
  const keyword = search.trim().toLowerCase();

  const summaries = data.summaryRows.filter((item) => {
    return (
      item.member &&
      (!keyword ||
        item.member.fullName?.toLowerCase().includes(keyword) ||
        item.member.nis?.toLowerCase().includes(keyword)) &&
      (divisionFilter === "all" ||
        item.member.divisionId === divisionFilter)
    );
  });

  const average = summaries.length
    ? percentage(
        summaries.reduce(
          (total, item) =>
            total + Number(item.attendancePercentage || 0),
          0
        ) / summaries.length
      )
    : 0;

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="groups"
          label="Anggota Direkap"
          value={summaries.length}
          helper="Anggota dengan data ringkasan"
        />
        <StatCard
          icon="fact_check"
          label="Rata-rata Kehadiran"
          value={`${average}%`}
          helper="Rata-rata seluruh anggota"
          accent="green"
        />
        <StatCard
          icon="event_available"
          label="Total Sesi"
          value={data.sessionRows.length}
          helper="Seluruh sesi absensi"
          accent="blue"
        />
        <StatCard
          icon="check"
          label="Sesi Selesai"
          value={
            data.sessionRows.filter((item) => item.status === "closed")
              .length
          }
          helper="Sesi yang sudah ditutup"
          accent="violet"
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader
            icon="fact_check"
            title="Rekap Kehadiran per Anggota"
            description={`${summaries.length} anggota ditampilkan.`}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau NIS"
              className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
            />
            <select
              value={divisionFilter}
              onChange={(event) =>
                setDivisionFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
            >
              <option value="all">Semua Divisi</option>
              {data.divisionRows.map((division) => (
                <option key={division.id} value={division.id}>
                  Sekbid {division.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {summaries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4">Anggota</th>
                  <th className="px-5 py-4">Kegiatan</th>
                  <th className="px-5 py-4">Hadir</th>
                  <th className="px-5 py-4">Terlambat</th>
                  <th className="px-5 py-4">Izin / Sakit</th>
                  <th className="px-5 py-4">Alpa</th>
                  <th className="px-5 py-4">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((summary) => (
                  <tr key={summary.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={summary.member.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {summary.member.fullName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {summary.member.nis}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {summary.totalActivities || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {summary.presentCount || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {summary.lateCount || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {(summary.excusedCount || 0) +
                        (summary.sickCount || 0)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {summary.absentCount || 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-36">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-primary">
                            {percentage(
                              summary.attendancePercentage
                            )}
                            %
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-input">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${percentage(
                                summary.attendancePercentage
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon="fact_check" title="Rekap tidak ditemukan" />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          icon="calendar_month"
          title="Histori Sesi"
          description="Sesi absensi terbaru pada kegiatan OSIS."
        />

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.sessionRows.slice(0, 6).map((session) => {
            const sessionRecords = data.recordRows.filter(
              (item) => item.sessionId === session.id
            );

            return (
              <article
                key={session.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {session.activity?.title || session.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDateTime(session.startAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-input px-3 py-1 text-[10px] font-bold text-text-muted">
                    {session.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {ATTENDANCE_OPTIONS.map((option) => (
                    <span
                      key={option.value}
                      className="rounded-lg bg-card px-3 py-2 text-xs text-text-muted"
                    >
                      {attendanceStatusLabel(option.value)}:{" "}
                      <strong className="text-text">
                        {
                          sessionRecords.filter(
                            (item) => item.status === option.value
                          ).length
                        }
                      </strong>
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-[10px] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function statusButtonClass(status) {
  return (
    {
      present: "border-primary bg-primary text-white",
      late: "border-amber-500 bg-amber-500 text-white",
      sick: "border-violet-500 bg-violet-500 text-white",
      excused: "border-blue-500 bg-blue-500 text-white",
      absent: "border-red-500 bg-red-500 text-white",
    }[status] || "border-border text-text-muted"
  );
}
