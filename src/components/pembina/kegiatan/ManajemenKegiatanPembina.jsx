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
  StatCard,
  Tabs,
} from "@/components/pembina/_shared/PembinaUi";
import ProgramKerjaSection from "./sub-components/ProgramKerjaSection";
import RapatSection from "./sub-components/RapatSection";
import { BadgeStatus } from "./sub-components/KegiatanSectionUi";
import { useSeleksiKegiatanOverlay } from "./sub-components/SeleksiKegiatanOverlay";
import {
  FIELD,
  JENIS_KEGIATAN,
  KOLEKSI,
  OPSI_STATUS_LAPORAN,
  OPSI_STATUS_PROPOSAL,
  STATUS_KEANGGOTAAN,
  STATUS_LAPORAN,
  STATUS_PROPOSAL,
} from "./konfigurasiManajemenKegiatan";

export default function ManajemenKegiatanPembina() {
  const { colRef } = useDb();

  // Semua nama collection dipusatkan di konfigurasi modul.
  const kegiatan = useCollection(() => colRef(KOLEKSI.KEGIATAN), [], {
    enabled: true,
  });
  const proposal = useCollection(() => colRef(KOLEKSI.PROPOSAL), [], {
    enabled: true,
  });
  const anggota = useCollection(() => colRef(KOLEKSI.ANGGOTA), [], {
    enabled: true,
  });
  const divisi = useCollection(() => colRef(KOLEKSI.DIVISI), [], {
    enabled: true,
  });

  const [tab, setTab] = useState("kegiatan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [jenisKegiatan, setJenisKegiatan] = useState(JENIS_KEGIATAN.PROGRAM_KERJA);

  const loading = isLoading(kegiatan, proposal, anggota, divisi);
  const error = firstError(kegiatan, proposal, anggota, divisi);

  const data = useMemo(() => {
    const barisKegiatan = rowsOf(kegiatan);
    const barisProposal = rowsOf(proposal);
    const barisAnggota = rowsOf(anggota);
    const barisDivisi = rowsOf(divisi);

    const petaAnggota = new Map(barisAnggota.map((item) => [item.id, item]));
    const petaDivisi = new Map(barisDivisi.map((item) => [item.id, item]));
    const petaKegiatan = new Map(barisKegiatan.map((item) => [item.id, item]));

    return {
      barisAnggota: barisAnggota.filter((item) =>
        [
          STATUS_KEANGGOTAAN.AKTIF,
          STATUS_KEANGGOTAAN.NONAKTIF,
          STATUS_KEANGGOTAAN.DITANGGUHKAN,
        ].includes(item[FIELD.ANGGOTA.STATUS_KEANGGOTAAN])
      ),

      barisDivisi,

      barisKegiatan: sortDateDesc(
        barisKegiatan,
        FIELD.KEGIATAN.WAKTU_MULAI
      ).map((item) => ({
        ...item,
        // Data baru wajib memakai enum Indonesia. Jika kosong, dianggap Program Kerja.
        jenisKegiatan:
          item[FIELD.KEGIATAN.JENIS] === JENIS_KEGIATAN.RAPAT
            ? JENIS_KEGIATAN.RAPAT
            : JENIS_KEGIATAN.PROGRAM_KERJA,
        divisi: petaDivisi.get(item[FIELD.KEGIATAN.ID_DIVISI]) || null,
        penanggungJawab:
          petaAnggota.get(item[FIELD.KEGIATAN.ID_PENANGGUNG_JAWAB]) || null,
      })),

      barisProposal: sortDateDesc(
        barisProposal,
        FIELD.PROPOSAL.DIAJUKAN_PADA
      ).map((item) => {
        const pengunggah =
          petaAnggota.get(item[FIELD.PROPOSAL.ID_PENGUNGGAH]) || null;

        return {
          ...item,
          kegiatan: petaKegiatan.get(item[FIELD.PROPOSAL.ID_KEGIATAN]) || null,
          pengunggah,
          divisi: petaDivisi.get(pengunggah?.[FIELD.ANGGOTA.ID_DIVISI]) || null,
        };
      }),
    };
  }, [kegiatan, proposal, anggota, divisi]);

  const { openSeleksiKegiatan } = useSeleksiKegiatanOverlay({
    proposals: data.barisProposal,
    divisions: data.barisDivisi,
    members: data.barisAnggota,
    onCreated: (selectedType) => {
      setTab("kegiatan");
      setJenisKegiatan(selectedType);
      setSearch("");
      setStatusFilter("semua");
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
          setStatusFilter("semua");
        }}
        items={[
          { value: "kegiatan", label: "Kegiatan" },
          { value: "proposal", label: "Proposal" },
          { value: "laporan", label: "Laporan" },
        ]}
      />

      {tab === "kegiatan" && (
        <ActivitiesTab
          rows={data.barisKegiatan}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          activityType={jenisKegiatan}
          setActivityType={setJenisKegiatan}
        />
      )}

      {tab === "proposal" && (
        <ProposalsTab
          rows={data.barisProposal}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}

      {tab === "laporan" && (
        <ReportsTab
          rows={data.barisKegiatan}
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
    (item) => item.jenisKegiatan === JENIS_KEGIATAN.PROGRAM_KERJA
  );
  const meetingRows = rows.filter(
    (item) => item.jenisKegiatan === JENIS_KEGIATAN.RAPAT
  );

  const handleTypeChange = (value) => {
    setActivityType(value);
    setSearch("");
    setStatusFilter("semua");
  };

  const typeSelector = (
    <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Tipe Kegiatan
        </p>
        <h2 className="mt-1 font-bold text-text">Pilih Program Kerja atau Rapat</h2>
        <p className="mt-1 text-xs leading-5 text-text-muted">
          Setiap tipe ditampilkan dan dikelola melalui komponen terpisah.
        </p>
      </div>

      <Tabs
        value={activityType}
        onChange={handleTypeChange}
        items={[
          {
            value: JENIS_KEGIATAN.PROGRAM_KERJA,
            label: `Program Kerja (${workProgramRows.length})`,
          },
          {
            value: JENIS_KEGIATAN.RAPAT,
            label: `Rapat (${meetingRows.length})`,
          },
        ]}
      />
    </section>
  );

  return (
    <div className="mt-6">
      {activityType === JENIS_KEGIATAN.PROGRAM_KERJA && (
        <ProgramKerjaSection
          rows={workProgramRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeSelector={typeSelector}
        />
      )}

      {activityType === JENIS_KEGIATAN.RAPAT && (
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

function ProposalsTab({ rows, search, setSearch, statusFilter, setStatusFilter }) {
  const keyword = search.trim().toLowerCase();
  const filtered = rows.filter((item) => {
    return (
      (!keyword ||
        item.namaKegiatan?.toLowerCase().includes(keyword) ||
        item.pengunggah?.namaLengkap?.toLowerCase().includes(keyword) ||
        item.kegiatan?.namaKegiatan?.toLowerCase().includes(keyword) ||
        item.kegiatan?.idReferensi?.toLowerCase().includes(keyword)) &&
      (statusFilter === "semua" || item.status === statusFilter)
    );
  });

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="receipt" label="Total Proposal" value={rows.length} helper="Seluruh proposal kegiatan" />
        <StatCard
          icon="calendar_month"
          label="Menunggu"
          value={rows.filter((item) => item.status === STATUS_PROPOSAL.MENUNGGU_REVIEW).length}
          helper="Menunggu review"
          accent="amber"
        />
        <StatCard
          icon="verified"
          label="Disetujui"
          value={rows.filter((item) => item.status === STATUS_PROPOSAL.DISETUJUI).length}
          helper="Sudah disetujui"
          accent="green"
        />
        <StatCard
          icon="edit"
          label="Perlu Revisi"
          value={rows.filter((item) => item.status === STATUS_PROPOSAL.PERLU_REVISI).length}
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
        options={OPSI_STATUS_PROPOSAL}
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
                        {proposal.kegiatan?.namaKegiatan || proposal.namaKegiatan || "-"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Versi {proposal.versi || 1}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={proposal.pengunggah?.namaLengkap} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {proposal.pengunggah?.namaLengkap || "-"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {proposal.divisi
                              ? `Sekbid ${proposal.divisi.kode || "-"}`
                              : "Pengurus Inti"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-48 truncate text-sm text-text">
                        {proposal.namaFile || "-"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatBytes(proposal.ukuranFileByte)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatDate(proposal.diajukanPada)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <BadgeStatus status={proposal.status} jenis="proposal" />
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

function ReportsTab({ rows, search, setSearch, statusFilter, setStatusFilter }) {
  const keyword = search.trim().toLowerCase();
  const filtered = rows.filter((item) => {
    return (
      (!keyword ||
        item.namaKegiatan?.toLowerCase().includes(keyword) ||
        item.idReferensi?.toLowerCase().includes(keyword) ||
        item.lokasi?.toLowerCase().includes(keyword)) &&
      (statusFilter === "semua" || item.statusLaporan === statusFilter)
    );
  });

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="receipt" label="Total Kegiatan" value={rows.length} helper="Kegiatan yang membutuhkan laporan" />
        <StatCard
          icon="calendar_month"
          label="Menunggu Laporan"
          value={rows.filter((item) => item.statusLaporan === STATUS_LAPORAN.MENUNGGU).length}
          helper="Belum diselesaikan"
          accent="amber"
        />
        <StatCard
          icon="upload_file"
          label="Sudah Dikirim"
          value={rows.filter((item) => item.statusLaporan === STATUS_LAPORAN.DIAJUKAN).length}
          helper="Menunggu validasi"
          accent="blue"
        />
        <StatCard
          icon="check"
          label="Selesai"
          value={rows.filter((item) => item.statusLaporan === STATUS_LAPORAN.SELESAI).length}
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
        options={OPSI_STATUS_LAPORAN}
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
                  <p className="font-mono text-[10px] font-bold text-primary">
                    {activity.idReferensi || "-"}
                  </p>
                  <h2 className="mt-1 font-bold text-text">{activity.namaKegiatan}</h2>
                  <p className="mt-2 text-sm text-text-muted">
                    {formatDate(activity.waktuMulai)} · {activity.lokasi}
                  </p>
                </div>
                <BadgeStatus status={activity.statusLaporan} jenis="laporan" />
              </div>

              <div className="mt-5 rounded-xl bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  File Laporan
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-text">
                  {activity.urlFileLaporan || "Belum ada file laporan"}
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <DisabledAction icon="visibility" variant="outline">Lihat Laporan</DisabledAction>
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
        <p className="mt-1 text-xs text-text-muted">{count} data ditampilkan.</p>
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
          <option value="semua">Semua Status</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
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
      className={`rounded-lg p-2 opacity-60 ${danger ? "text-error-text" : "text-primary"}`}
    >
      <AppIcon name={icon} size={18} />
    </button>
  );
}
