"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  firstError,
  formatBytes,
  formatDate,
  isLoading,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  Avatar,
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  ProposalStatusBadge,
  ReportStatusBadge,
  StatCard,
  Tabs,
} from "@/components/pembina/_shared/PembinaUi";
import ProgramKerjaSection from "./sub-components/ProgramKerjaSection";
import RapatSection from "./sub-components/RapatSection";
import { useSeleksiKegiatanOverlay } from "./sub-components/SeleksiKegiatanOverlay";

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
  const [activityType, setActivityType] = useState("work_program");

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
      memberRows: memberRows.filter((item) =>
        ["active", "inactive", "suspended"].includes(item.membershipStatus)
      ),
      divisionRows,
      activityRows: sortDateDesc(activityRows, "startAt").map((item) => ({
        ...item,
        // Data lama tanpa activityType tetap dianggap sebagai Program Kerja.
        activityType:
          item.activityType === "meeting" ? "meeting" : "work_program",
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

  const { openSeleksiKegiatan } = useSeleksiKegiatanOverlay({
    proposals: data.proposalRows,
    divisions: data.divisionRows,
    members: data.memberRows,
    onCreated: (selectedType) => {
      setTab("kegiatan");
      setActivityType(selectedType);
      setSearch("");
      setStatusFilter("all");
    },
  });

  if (loading) return <PageLoading message="Memuat manajemen kegiatan..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Program Kerja OSIS"
        title="Manajemen Kegiatan"
        description="Kelola tampilan kegiatan, review proposal, dan laporan pelaksanaan dalam satu menu."
        action={
          <button
            type="button"
            onClick={openSeleksiKegiatan}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0"
          >
            <AppIcon name="add" size={19} />
            Tambah Kegiatan
          </button>
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
          activityType={activityType}
          setActivityType={setActivityType}
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
  activityType,
  setActivityType,
}) {
  const workProgramRows = rows.filter(
    (item) => item.activityType === "work_program"
  );
  const meetingRows = rows.filter(
    (item) => item.activityType === "meeting"
  );

  const handleTypeChange = (value) => {
    setActivityType(value);
    setSearch("");
    setStatusFilter("all");
  };

  const typeSelector = (
    <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Tipe Kegiatan
        </p>
        <h2 className="mt-1 font-bold text-text">
          Pilih Program Kerja atau Rapat
        </h2>
        <p className="mt-1 text-xs leading-5 text-text-muted">
          Setiap tipe ditampilkan dan dikelola melalui komponen terpisah.
        </p>
      </div>

      <Tabs
        value={activityType}
        onChange={handleTypeChange}
        items={[
          {
            value: "work_program",
            label: `Program Kerja (${workProgramRows.length})`,
          },
          {
            value: "meeting",
            label: `Rapat (${meetingRows.length})`,
          },
        ]}
      />
    </section>
  );

  return (
    <div className="mt-6">
      {activityType === "work_program" && (
        <ProgramKerjaSection
          rows={workProgramRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeSelector={typeSelector}
        />
      )}

      {activityType === "meeting" && (
        <RapatSection
          rows={meetingRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeSelector={typeSelector}
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