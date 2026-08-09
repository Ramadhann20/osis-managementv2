"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";
import { formatDateTime } from "@/components/pembina/_shared/firestoreHelpers";
import {
  JENIS_KEGIATAN,
  STATUS_KEGIATAN,
  STATUS_PROPOSAL,
} from "../konfigurasiManajemenKegiatan";
import PilihPesertaKegiatanOverlay from "./PilihPesertaKegiatanOverlay";
import { finalisasiKegiatan } from "./finalisasiKegiatan";

function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function labelDivisi(divisi) {
  return divisi?.namaSingkat || divisi?.nama || "Pengurus OSIS";
}

function labelJenis(value) {
  return value === JENIS_KEGIATAN.RAPAT ? "Rapat" : "Program Kerja";
}

function labelStatusProposal(status) {
  return (
    {
      belum_diajukan: "Belum Diajukan",
      diajukan: "Diajukan",
      menunggu_review: "Menunggu Review",
      perlu_revisi: "Perlu Revisi",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
    }[status] || status || "Belum Diajukan"
  );
}

function formatDateRange(activity) {
  if (!activity?.waktuMulai) return "Belum ditentukan";
  if (!activity?.waktuSelesai) return formatDateTime(activity.waktuMulai);
  return `${formatDateTime(activity.waktuMulai)} – ${formatDateTime(
    activity.waktuSelesai
  )}`;
}

function formatDuration(activity) {
  const minutes = Number(activity?.durasiMenit);
  if (Number.isFinite(minutes) && minutes > 0) {
    const jam = Math.floor(minutes / 60);
    const menit = minutes % 60;
    return [jam ? `${jam} jam` : "", menit ? `${menit} menit` : ""]
      .filter(Boolean)
      .join(" ");
  }

  const start = toDate(activity?.waktuMulai);
  const end = toDate(activity?.waktuSelesai);
  if (!start || !end) return "Belum ditentukan";

  const diff = Math.round((end.getTime() - start.getTime()) / 60000);
  if (diff <= 0) return "Belum ditentukan";
  const jam = Math.floor(diff / 60);
  const menit = diff % 60;
  return [jam ? `${jam} jam` : "", menit ? `${menit} menit` : ""]
    .filter(Boolean)
    .join(" ");
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function snapshotMap(usulanPeserta) {
  return new Map(
    (Array.isArray(usulanPeserta?.daftar) ? usulanPeserta.daftar : [])
      .filter((item) => item?.idAnggota)
      .map((item) => [item.idAnggota, item])
  );
}

export function useKegiatanDetailsOverlay() {
  const { openOverlay, closeOverlay } = useOverlay();

  const openKegiatanDetails = useCallback(
    (activity) => {
      if (!activity) return;
      openOverlay({
        closeOnBackdrop: true,
        className: "px-3 py-4 sm:px-6",
        content: (
          <KegiatanDetailsModal
            activity={activity}
            onClose={() => closeOverlay()}
          />
        ),
      });
    },
    [openOverlay, closeOverlay]
  );

  return { openKegiatanDetails };
}

export default function KegiatanDetailsModal({ activity, onClose }) {
  const { db, colRef, updateDoc, serverTimestamp } = useDb();
  const [visible, setVisible] = useState(false);
  const [proposal, setProposal] = useState(activity?.proposal || null);
  const [reviewing, setReviewing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(
    [
      STATUS_KEGIATAN.AKAN_DATANG,
      STATUS_KEGIATAN.BERLANGSUNG,
      STATUS_KEGIATAN.SELESAI,
    ].includes(activity?.status)
  );
  const [participantPickerMode, setParticipantPickerMode] = useState(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState(() =>
    new Set(
      activity?.pesertaFinal?.idAnggota ||
        activity?.usulanPeserta?.idAnggota ||
        []
    )
  );
  const [participantSource, setParticipantSource] = useState(() => {
    if (activity?.pesertaFinal) {
      return {
        label:
          activity.pesertaFinal.sumber === "usulan_anggota"
            ? "Usulan Anggota"
            : "Ditentukan Pembina",
      };
    }
    if (activity?.usulanPeserta) {
      return {
        label: activity.usulanPeserta.labelKelompok || "Usulan Anggota",
      };
    }
    return null;
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const anggota = useCollection(() => colRef("Anggota"), [], { enabled: true });
  const divisi = useCollection(() => colRef("Divisi"), [], { enabled: true });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const memberMap = useMemo(
    () => new Map(rowsOf(anggota).map((item) => [item.id, item])),
    [anggota]
  );
  const divisionMap = useMemo(
    () => new Map(rowsOf(divisi).map((item) => [item.id, item])),
    [divisi]
  );
  const savedSnapshotMap = useMemo(
    () => snapshotMap(activity?.usulanPeserta),
    [activity?.usulanPeserta]
  );

  const selectedParticipantRows = useMemo(
    () =>
      Array.from(selectedParticipantIds)
        .map((id) => {
          const member = memberMap.get(id);
          const snapshot = savedSnapshotMap.get(id);
          const idDivisi = member?.idDivisi || snapshot?.idDivisi || null;
          return {
            id,
            namaLengkap:
              member?.namaLengkap || snapshot?.namaLengkap || "Anggota OSIS",
            jabatanOrganisasi:
              member?.jabatanOrganisasi ||
              snapshot?.jabatanOrganisasi ||
              "Anggota",
            labelDivisi:
              labelDivisi(divisionMap.get(idDivisi)) ||
              snapshot?.labelDivisi ||
              "Pengurus OSIS",
          };
        })
        .sort((a, b) =>
          String(a.namaLengkap).localeCompare(String(b.namaLengkap), "id")
        ),
    [selectedParticipantIds, memberMap, divisionMap, savedSnapshotMap]
  );

  const isMeeting = activity?.jenisKegiatan === JENIS_KEGIATAN.RAPAT;
  const isProgramKerja = !isMeeting;
  const proposalApproved =
    !isProgramKerja ||
    (proposal?.status || activity?.statusProposal) === STATUS_PROPOSAL.DISETUJUI;
  const canFinalize =
    !finalized && proposalApproved && selectedParticipantIds.size > 0;

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(() => onClose?.(), 220);
  };

  const reviewProposal = async (nextStatus) => {
    if (!proposal?.id || reviewing || finalized) return;
    setReviewing(true);
    setError("");
    setMessage("");

    try {
      const waktu = serverTimestamp();
      await updateDoc("Proposal", proposal.id, {
        status: nextStatus,
        diperbaruiPada: waktu,
      });
      await updateDoc("Kegiatan", activity.id, {
        idProposal: proposal.id,
        statusProposal: nextStatus,
        diperbaruiPada: waktu,
      });

      setProposal((current) => ({ ...current, status: nextStatus }));
      setMessage(`Status proposal diubah menjadi ${labelStatusProposal(nextStatus)}.`);
    } catch (reviewError) {
      console.error("REVIEW PROPOSAL ERROR:", reviewError);
      setError(reviewError?.message || "Status proposal belum berhasil diperbarui.");
    } finally {
      setReviewing(false);
    }
  };

  const applyParticipantGroup = (rows, source) => {
    setSelectedParticipantIds(new Set(rows.map((item) => item.id).filter(Boolean)));
    setParticipantSource(source || { label: "Kelompok dipilih Pembina" });
    setError("");
  };

  const addManualParticipants = (rows) => {
    setSelectedParticipantIds((current) => {
      const next = new Set(current);
      rows.forEach((item) => item?.id && next.add(item.id));
      return next;
    });
    setParticipantSource((current) => current || { label: "Ditentukan Pembina" });
  };

  const toggleParticipant = (id) => {
    if (finalized) return;
    setSelectedParticipantIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinalize = async () => {
    if (!canFinalize || finalizing) return;
    setFinalizing(true);
    setError("");
    setMessage("");

    try {
      const result = await finalisasiKegiatan({
        db,
        activity,
        proposal,
        participantIds: Array.from(selectedParticipantIds),
        serverTimestamp,
        updateDoc,
      });

      setFinalized(true);
      setMessage(
        `Kegiatan disetujui. ${result.jumlahPelaksanaan} pelaksanaan dan ${result.jumlahSesiAbsensi} sesi absensi berhasil dibuat.`
      );
    } catch (finalizeError) {
      console.error("FINALISASI KEGIATAN ERROR:", finalizeError);
      setError(
        finalizeError?.message ||
          "Kegiatan belum berhasil difinalisasi. Periksa data jadwal dan izin Firestore."
      );
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <>
      <section
        className={`flex max-h-[calc(100dvh-2rem)] w-[min(96vw,980px)] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-[0.975] opacity-0"
        }`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={activity?.jenisKegiatan} />
                <ActivityStatusBadge status={finalized ? STATUS_KEGIATAN.AKAN_DATANG : activity?.status} />
              </div>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
                {activity?.namaKegiatan || "Kegiatan tanpa nama"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                Tinjau informasi, proposal, peserta, dan jadwal sebelum kegiatan disetujui.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition hover:bg-surface hover:text-text"
            >
              <AppIcon name="close" size={22} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {isMeeting ? "Agenda Rapat" : "Deskripsi Program Kerja"}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-muted">
                {activity?.deskripsi || "Belum ada deskripsi kegiatan."}
              </p>
            </section>

            <div className="space-y-3">
              <QuickInfo icon="location_on" label="Lokasi" value={activity?.lokasi || "Belum ditentukan"} />
              <QuickInfo icon="apartment" label="Penyelenggara" value={labelDivisi(activity?.divisi)} />
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <AppIcon name="calendar_month" size={20} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Jadwal</p>
                <h3 className="font-bold text-text">Informasi Jadwal</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <ScheduleInfo icon="schedule" label="Waktu Pelaksanaan" value={formatDateRange(activity)} />
              <ScheduleInfo icon="timer" label="Durasi" value={formatDuration(activity)} />
              <ScheduleInfo
                icon="fact_check"
                label="Sesi Absensi"
                value={`${activity?.jumlahSesiAbsensi || activity?.jumlahSesiAbsensiRencana || 0} sesi`}
              />
            </div>
          </section>

          {isProgramKerja && (
            <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AppIcon name="picture_as_pdf" size={22} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Review Dokumen</p>
                    <h3 className="font-bold text-text">Proposal Program Kerja</h3>
                  </div>
                </div>
                {proposal && <ProposalStatusBadge status={proposal.status || activity?.statusProposal} />}
              </div>

              {proposal ? (
                <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{proposal.namaFile || "File proposal"}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Versi {proposal.versi || 1} · {formatBytes(proposal.ukuranFileByte)}
                      </p>
                    </div>
                    {proposal.urlFile ? (
                      <a
                        href={proposal.urlFile}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-text hover:border-primary/40 hover:text-primary"
                      >
                        <AppIcon name="open_in_new" size={17} />
                        Buka Proposal
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-text-muted">File fisik belum terhubung ke storage</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">Belum ada proposal</p>
                  <p className="mt-1 text-xs text-red-600">Kegiatan belum dapat difinalisasi sebelum proposal diajukan.</p>
                </div>
              )}

              {proposal && !finalized && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ReviewButton
                    active={proposal.status === STATUS_PROPOSAL.DISETUJUI}
                    icon="check_circle"
                    label="Setujui Proposal"
                    tone="green"
                    disabled={reviewing}
                    onClick={() => reviewProposal(STATUS_PROPOSAL.DISETUJUI)}
                  />
                  <ReviewButton
                    active={proposal.status === STATUS_PROPOSAL.PERLU_REVISI}
                    icon="edit_note"
                    label="Perlu Revisi"
                    tone="amber"
                    disabled={reviewing}
                    onClick={() => reviewProposal(STATUS_PROPOSAL.PERLU_REVISI)}
                  />
                  <ReviewButton
                    active={proposal.status === STATUS_PROPOSAL.DITOLAK}
                    icon="cancel"
                    label="Tolak"
                    tone="red"
                    disabled={reviewing}
                    onClick={() => reviewProposal(STATUS_PROPOSAL.DITOLAK)}
                  />
                </div>
              )}
            </section>
          )}

          <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <AppIcon name="groups" size={22} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Peserta</p>
                  <h3 className="font-bold text-text">Peserta Kegiatan</h3>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-text-muted">
                    {activity?.usulanPeserta
                      ? "Usulan anggota sudah dimuat. Pembina dapat mengurangi, menambah, atau mengganti peserta sebelum finalisasi."
                      : "Tidak ada usulan peserta. Tentukan peserta sebelum menyetujui kegiatan."}
                  </p>
                </div>
              </div>

              {!finalized && (
                <button
                  type="button"
                  onClick={() => setParticipantPickerMode("kelompok")}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <AppIcon name="group_add" size={18} />
                  {selectedParticipantIds.size ? "Ganti Kelompok" : "Pilih Peserta"}
                </button>
              )}
            </div>

            {(participantSource || activity?.usulanPeserta) && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">
                  {activity?.usulanPeserta && !activity?.pesertaFinal ? "Usulan Anggota" : participantSource?.label || "Peserta Final"}
                </span>
                <span className="text-xs font-semibold text-text-muted">
                  {selectedParticipantIds.size} peserta dipilih
                </span>
              </div>
            )}

            {selectedParticipantRows.length ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="max-h-72 divide-y divide-border overflow-y-auto">
                  {selectedParticipantRows.map((participant) => (
                    <label
                      key={participant.id}
                      className="flex items-center gap-3 bg-card px-4 py-3"
                    >
                      {!finalized && (
                        <input
                          type="checkbox"
                          checked={selectedParticipantIds.has(participant.id)}
                          onChange={() => toggleParticipant(participant.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      )}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                        {initials(participant.namaLengkap)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-text">{participant.namaLengkap}</span>
                        <span className="mt-0.5 block truncate text-xs text-text-muted">
                          {participant.jabatanOrganisasi} · {participant.labelDivisi}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                {!finalized && (
                  <div className="border-t border-border bg-surface p-3">
                    <button
                      type="button"
                      onClick={() => setParticipantPickerMode("manual")}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card px-3 text-xs font-bold text-primary hover:bg-primary/5"
                    >
                      <AppIcon name="person_add" size={17} />
                      Tambah Peserta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-5 text-center">
                <p className="text-sm font-bold text-text">Peserta belum ditentukan</p>
                <p className="mt-1 text-xs text-text-muted">Pilih minimal satu peserta agar sesi absensi memiliki daftar sasaran.</p>
              </div>
            )}
          </section>

          {(message || error) && (
            <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${error ? "bg-error-bg text-error-text" : "bg-emerald-50 text-emerald-800"}`}>
              {error || message}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-5 text-text-muted">
              {finalized ? (
                <span className="font-bold text-emerald-700">Kegiatan sudah difinalisasi dan sesi absensi sudah dibuat.</span>
              ) : isProgramKerja && !proposalApproved ? (
                "Setujui proposal terlebih dahulu sebelum memfinalisasi kegiatan."
              ) : !selectedParticipantIds.size ? (
                "Tentukan peserta sebelum memfinalisasi kegiatan."
              ) : (
                "Semua syarat finalisasi sudah terpenuhi."
              )}
            </div>

            <div className="flex gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-bold text-text hover:bg-surface"
              >
                Tutup
              </button>
              {!finalized && (
                <button
                  type="button"
                  disabled={!canFinalize || finalizing}
                  onClick={handleFinalize}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AppIcon name="check" size={18} />
                  {finalizing ? "Memfinalisasi..." : isMeeting ? "Setujui Rapat" : "Setujui Kegiatan"}
                </button>
              )}
            </div>
          </div>
        </footer>
      </section>

      {participantPickerMode && !finalized && (
        <PilihPesertaKegiatanOverlay
          mode={participantPickerMode}
          member={activity?.penanggungJawab || { idDivisi: activity?.idDivisi }}
          divisi={activity?.divisi}
          existingParticipantIds={Array.from(selectedParticipantIds)}
          onApplyGroup={applyParticipantGroup}
          onAddMembers={addManualParticipants}
          onClose={() => setParticipantPickerMode(null)}
        />
      )}
    </>
  );
}

function TypeBadge({ type }) {
  const meeting = type === JENIS_KEGIATAN.RAPAT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${meeting ? "bg-blue-50 text-blue-700" : "bg-primary/10 text-primary"}`}>
      <AppIcon name={meeting ? "groups" : "campaign"} size={14} />
      {labelJenis(type)}
    </span>
  );
}

function ActivityStatusBadge({ status }) {
  const config = {
    draf: ["Draf", "bg-slate-100 text-slate-700"],
    terencana: ["Terencana", "bg-blue-50 text-blue-700"],
    akan_datang: ["Akan Datang", "bg-sky-50 text-sky-700"],
    berlangsung: ["Berlangsung", "bg-amber-50 text-amber-700"],
    selesai: ["Selesai", "bg-emerald-50 text-emerald-700"],
    dibatalkan: ["Dibatalkan", "bg-red-50 text-red-700"],
  }[status] || [status || "-", "bg-slate-100 text-slate-700"];
  return <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${config[1]}`}>{config[0]}</span>;
}

function ProposalStatusBadge({ status }) {
  const cls = {
    menunggu_review: "bg-amber-50 text-amber-700",
    perlu_revisi: "bg-orange-50 text-orange-700",
    disetujui: "bg-emerald-50 text-emerald-700",
    ditolak: "bg-red-50 text-red-700",
  }[status] || "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${cls}`}>{labelStatusProposal(status)}</span>;
}

function ReviewButton({ active, icon, label, tone, disabled, onClick }) {
  const toneClass = {
    green: active ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: active ? "border-orange-300 bg-orange-100 text-orange-800" : "border-orange-200 bg-orange-50 text-orange-700",
    red: active ? "border-red-300 bg-red-100 text-red-800" : "border-red-200 bg-red-50 text-red-700",
  }[tone];
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition disabled:opacity-50 ${toneClass}`}>
      <AppIcon name={icon} size={17} />
      {label}
    </button>
  );
}

function QuickInfo({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><AppIcon name={icon} size={18} /></span>
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1 text-sm font-semibold leading-6 text-text">{value || "-"}</p></div>
      </div>
    </div>
  );
}

function ScheduleInfo({ icon, label, value }) {
  return (
    <div className="p-5"><div className="flex items-start gap-3"><AppIcon name={icon} size={19} className="mt-0.5 shrink-0 text-primary" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1.5 text-sm font-semibold leading-6 text-text">{value || "-"}</p></div></div></div>
  );
}

function initials(value) {
  return String(value || "A").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
