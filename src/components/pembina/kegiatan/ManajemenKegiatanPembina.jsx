"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  firstError,
  formatBytes,
  formatDate,
  formatDateTime,
  isLoading,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  ActivityStatusBadge,
  Avatar,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  ProposalStatusBadge,
  ReportStatusBadge,
  SectionHeader,
  StatCard,
  Tabs,
} from "@/components/pembina/_shared/PembinaUi";

export default function ManajemenKegiatanPembina() {
  const { colRef } = useDb();

  const activities = useCollection(() => colRef("Kegiatan"), [], {
    enabled: true,
  });
  const proposals = useCollection(() => colRef("Proposal"), [], {
    enabled: true,
  });
  const members = useCollection(() => colRef("Anggota"), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: true,
  });

  const [tab, setTab] = useState("kegiatan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loading = isLoading(activities, proposals, members, divisions);
  const error = firstError(activities, proposals, members, divisions);

  const data = useMemo(() => {
    const activityRows = rowsOf(activities);
    const proposalRows = rowsOf(proposals);
    const memberRows = rowsOf(members);
    const divisionRows = rowsOf(divisions);

    const memberMap = new Map(
      memberRows.map((item) => [item.id, item])
    );
    const divisionMap = new Map(
      divisionRows.map((item) => [item.id, item])
    );
    const activityMap = new Map(
      activityRows.map((item) => [item.id, item])
    );

    return {
      activityRows: sortDateDesc(activityRows, "startAt").map((item) => ({
        ...item,
        division: divisionMap.get(item.divisionId) || null,
        organiser: memberMap.get(item.organiserMemberId) || null,
      })),
      proposalRows: sortDateDesc(proposalRows, "submittedAt").map(
        (item) => ({
          ...item,
          activity: activityMap.get(item.activityId) || null,
          uploader: memberMap.get(item.uploadedBy) || null,
          division:
            divisionMap.get(memberMap.get(item.uploadedBy)?.divisionId) ||
            null,
        })
      ),
    };
  }, [activities, proposals, members, divisions]);

  if (loading) return <PageLoading message="Memuat manajemen kegiatan..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Program Kerja OSIS"
        title="Manajemen Kegiatan"
        description="Kelola tampilan kegiatan, review proposal, dan laporan pelaksanaan dalam satu menu."
        action={
          <DisabledAction icon="add">Tambah Kegiatan</DisabledAction>
        }
      />

      <Tabs
        value={tab}
        onChange={(value) => {
          setTab(value);
          setStatusFilter("all");
        }}
        items={[
          { value: "kegiatan", label: "Kegiatan" },
          { value: "proposal", label: "Proposal" },
          { value: "laporan", label: "Laporan" },
        ]}
      />

      {tab === "kegiatan" && (
        <ActivitiesTab
          rows={data.activityRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}

      {tab === "proposal" && (
        <ProposalsTab
          rows={data.proposalRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}

      {tab === "laporan" && (
        <ReportsTab
          rows={data.activityRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}
    </div>
  );
}

function ActivitiesTab({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const keyword = search.trim().toLowerCase();
  const filtered = rows.filter((item) => {
    return (
      (!keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.location?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)) &&
      (statusFilter === "all" || item.status === statusFilter)
    );
  });

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="event_available"
          label="Total Kegiatan"
          value={rows.length}
          helper="Seluruh kegiatan Firestore"
        />
        <StatCard
          icon="calendar_month"
          label="Akan Datang"
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
          helper="Sudah ditutup"
          accent="green"
        />
      </section>

      <FilterBar
        title="Daftar Kegiatan"
        count={filtered.length}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        options={[
          ["draft", "Draf"],
          ["upcoming", "Akan Datang"],
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
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-text">
                        {activity.title}
                      </h2>
                      <ActivityStatusBadge status={activity.status} />
                    </div>
                    <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 text-text-muted">
                      {activity.description || "Tidak ada deskripsi."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg p-2 text-text-muted opacity-60"
                  >
                    <AppIcon name="more_vert" size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5">
                <Meta label="Waktu" value={formatDateTime(activity.startAt)} />
                <Meta label="Lokasi" value={activity.location || "-"} />
                <Meta
                  label="Penyelenggara"
                  value={
                    activity.division
                      ? `Sekbid ${activity.division.code}: ${activity.division.shortName}`
                      : "Pengurus Inti"
                  }
                />
                <Meta
                  label="Peserta"
                  value={`${activity.participantCount || 0}/${
                    activity.participantCapacity || "-"
                  }`}
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
          icon="event_available"
          title="Kegiatan tidak ditemukan"
        />
      )}
    </div>
  );
}

function ProposalsTab({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const keyword = search.trim().toLowerCase();
  const filtered = rows.filter((item) => {
    return (
      (!keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.uploader?.fullName?.toLowerCase().includes(keyword) ||
        item.activity?.title?.toLowerCase().includes(keyword)) &&
      (statusFilter === "all" || item.status === statusFilter)
    );
  });

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="receipt"
          label="Total Proposal"
          value={rows.length}
          helper="Seluruh proposal kegiatan"
        />
        <StatCard
          icon="calendar_month"
          label="Menunggu"
          value={
            rows.filter((item) => item.status === "pending_review").length
          }
          helper="Menunggu review"
          accent="amber"
        />
        <StatCard
          icon="verified"
          label="Disetujui"
          value={rows.filter((item) => item.status === "approved").length}
          helper="Sudah disetujui"
          accent="green"
        />
        <StatCard
          icon="edit"
          label="Perlu Revisi"
          value={
            rows.filter((item) => item.status === "revision_required")
              .length
          }
          helper="Perlu diperbaiki"
          accent="red"
        />
      </section>

      <FilterBar
        title="Daftar Proposal"
        count={filtered.length}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        options={[
          ["draft", "Draf"],
          ["pending_review", "Menunggu Review"],
          ["revision_required", "Perlu Revisi"],
          ["approved", "Disetujui"],
          ["rejected", "Ditolak"],
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4">Nama Kegiatan</th>
                  <th className="px-5 py-4">Pengaju</th>
                  <th className="px-5 py-4">File</th>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-text">
                        {proposal.activity?.title || proposal.title}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Versi {proposal.version || 1}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={proposal.uploader?.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {proposal.uploader?.fullName || "-"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {proposal.division
                              ? `Sekbid ${proposal.division.code}`
                              : "Pengurus Inti"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-48 truncate text-sm text-text">
                        {proposal.fileName || "-"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatBytes(proposal.fileSizeBytes)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatDate(proposal.submittedAt)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <ProposalStatusBadge status={proposal.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <IconAction icon="visibility" label="Lihat File" />
                        <IconAction icon="check" label="Setujui" />
                        <IconAction icon="edit" label="Revisi" />
                        <IconAction icon="close" label="Tolak" danger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon="receipt" title="Proposal tidak ditemukan" />
          </div>
        )}
      </section>
    </div>
  );
}

function ReportsTab({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const keyword = search.trim().toLowerCase();
  const filtered = rows.filter((item) => {
    return (
      (!keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.location?.toLowerCase().includes(keyword)) &&
      (statusFilter === "all" || item.reportStatus === statusFilter)
    );
  });

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="receipt"
          label="Total Kegiatan"
          value={rows.length}
          helper="Kegiatan yang membutuhkan laporan"
        />
        <StatCard
          icon="calendar_month"
          label="Menunggu Laporan"
          value={rows.filter((item) => item.reportStatus === "pending").length}
          helper="Belum diselesaikan"
          accent="amber"
        />
        <StatCard
          icon="upload_file"
          label="Sudah Dikirim"
          value={
            rows.filter((item) => item.reportStatus === "submitted").length
          }
          helper="Menunggu validasi"
          accent="blue"
        />
        <StatCard
          icon="check"
          label="Selesai"
          value={
            rows.filter((item) => item.reportStatus === "completed").length
          }
          helper="Laporan lengkap"
          accent="green"
        />
      </section>

      <FilterBar
        title="Laporan Pelaksanaan"
        count={filtered.length}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        options={[
          ["not_started", "Belum Dimulai"],
          ["pending", "Menunggu Laporan"],
          ["submitted", "Sudah Dikirim"],
          ["completed", "Selesai"],
        ]}
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filtered.length ? (
          filtered.map((activity) => (
            <article
              key={activity.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-text">{activity.title}</h2>
                  <p className="mt-2 text-sm text-text-muted">
                    {formatDate(activity.startAt)} · {activity.location}
                  </p>
                </div>
                <ReportStatusBadge status={activity.reportStatus} />
              </div>

              <div className="mt-5 rounded-xl bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  File Laporan
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-text">
                  {activity.reportFileURL || "Belum ada file laporan"}
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <DisabledAction icon="visibility" variant="outline">
                  Lihat Laporan
                </DisabledAction>
                <DisabledAction icon="check">Validasi</DisabledAction>
              </div>
            </article>
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState icon="receipt" title="Laporan tidak ditemukan" />
          </div>
        )}
      </section>
    </div>
  );
}

function FilterBar({
  title,
  count,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  options,
}) {
  return (
    <section className="my-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="font-bold text-text">{title}</h2>
        <p className="mt-1 text-xs text-text-muted">
          {count} data ditampilkan.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari data"
          className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
        >
          <option value="all">Semua Status</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-text">
        {value}
      </p>
    </div>
  );
}

function IconAction({ icon, label, danger = false }) {
  return (
    <button
      type="button"
      disabled
      title={`${label} akan diaktifkan pada tahap berikutnya`}
      className={`rounded-lg p-2 opacity-60 ${
        danger ? "text-error-text" : "text-primary"
      }`}
    >
      <AppIcon name={icon} size={18} />
    </button>
  );
}
