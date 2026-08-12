"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { formatDateTime } from "@/components/pembina/_shared/firestoreHelpers";
import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";
import { db as firestoreDb } from "@/lib/firebase-config";
import {
  JENIS_KEGIATAN,
  STATUS_KEGIATAN,
} from "../konfigurasiManajemenKegiatan";
import PilihPesertaKegiatanOverlay from "./PilihPesertaKegiatanOverlay";
import { finalisasiKegiatan } from "./finalisasiKegiatan";

const STATUS_PENGAJUAN = Object.freeze({
  MENUNGGU_REVIEW: "menunggu_review",
  PERLU_REVISI: "perlu_revisi",
  DISETUJUI: "disetujui",
  DITOLAK: "ditolak",
});

function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function labelDivisi(divisi) {
  return divisi?.namaSingkat || divisi?.nama || "Pengurus OSIS";
}

function labelStatus(status) {
  return (
    {
      [STATUS_PENGAJUAN.MENUNGGU_REVIEW]: "Menunggu Review",
      [STATUS_PENGAJUAN.PERLU_REVISI]: "Perlu Revisi",
      [STATUS_PENGAJUAN.DISETUJUI]: "Disetujui",
      [STATUS_PENGAJUAN.DITOLAK]: "Ditolak",
    }[status] || "Menunggu Review"
  );
}

function statusClass(status) {
  return (
    {
      [STATUS_PENGAJUAN.MENUNGGU_REVIEW]:
        "bg-amber-50 text-amber-700 ring-amber-200",
      [STATUS_PENGAJUAN.PERLU_REVISI]:
        "bg-orange-50 text-orange-700 ring-orange-200",
      [STATUS_PENGAJUAN.DISETUJUI]:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
      [STATUS_PENGAJUAN.DITOLAK]: "bg-red-50 text-red-700 ring-red-200",
    }[status] || "bg-slate-100 text-slate-700 ring-slate-200"
  );
}

function durationLabel(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "-";

  const jam = Math.floor(value / 60);
  const menit = value % 60;
  return [jam ? `${jam} jam` : "", menit ? `${menit} menit` : ""]
    .filter(Boolean)
    .join(" ");
}

function initials(value) {
  return String(value || "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function usePengajuanKegiatanReviewOverlay() {
  const { openOverlay, closeOverlay } = useOverlay();

  const openReviewPengajuanKegiatan = useCallback(
    (activity) => {
      if (!activity) return;

      openOverlay({
        closeOnBackdrop: true,
        className: "px-3 py-4 sm:px-6",
        content: (
          <PengajuanKegiatanReviewModal
            activity={activity}
            onClose={() => closeOverlay()}
          />
        ),
      });
    },
    [openOverlay, closeOverlay]
  );

  return { openReviewPengajuanKegiatan };
}

export default function PengajuanKegiatanReviewModal({ activity, onClose }) {
  const { colRef, updateDoc, serverTimestamp } = useDb();
  const [visible, setVisible] = useState(false);
  const [participantPickerMode, setParticipantPickerMode] = useState(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState(
    () =>
      new Set(
        activity?.pesertaFinal?.idAnggota ||
          activity?.pesertaRencana?.idAnggota ||
          []
      )
  );
  const [participantSource, setParticipantSource] = useState(() => ({
    label:
      activity?.pesertaRencana?.labelKelompok ||
      (activity?.pesertaRencana ? "Peserta Usulan Anggota" : "Ditentukan Pembina"),
  }));
  const [reviewStatus, setReviewStatus] = useState(
    activity?.pengajuanRapat?.status || STATUS_PENGAJUAN.MENUNGGU_REVIEW
  );
  const [reviewNote, setReviewNote] = useState(
    activity?.pengajuanRapat?.catatanReview || ""
  );
  const [savingReview, setSavingReview] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(
    [
      STATUS_KEGIATAN.AKAN_DATANG,
      STATUS_KEGIATAN.BERLANGSUNG,
      STATUS_KEGIATAN.SELESAI,
    ].includes(activity?.status)
  );
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

  const selectedParticipantRows = useMemo(
    () =>
      Array.from(selectedParticipantIds)
        .map((id) => {
          const member = memberMap.get(id);
          const division = member?.idDivisi
            ? divisionMap.get(member.idDivisi) || null
            : null;

          return {
            id,
            namaLengkap: member?.namaLengkap || "Anggota OSIS",
            jabatanOrganisasi: member?.jabatanOrganisasi || "Anggota",
            labelDivisi: labelDivisi(division),
          };
        })
        .sort((a, b) =>
          String(a.namaLengkap).localeCompare(String(b.namaLengkap), "id")
        ),
    [selectedParticipantIds, memberMap, divisionMap]
  );

  const isMeeting = activity?.jenisKegiatan === JENIS_KEGIATAN.RAPAT;
  const pengaju = activity?.pengaju || memberMap.get(activity?.pengajuanRapat?.idPengaju);
  const divisiPengaju = activity?.divisi ||
    (pengaju?.idDivisi ? divisionMap.get(pengaju.idDivisi) || null : null);

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(() => onClose?.(), 220);
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
    setError("");
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

  const updateReviewStatus = async (nextStatus) => {
    if (!activity?.id || savingReview || finalizing || finalized) return;

    setSavingReview(true);
    setError("");
    setMessage("");

    try {
      const waktu = serverTimestamp();
      const current = activity?.pengajuanRapat || {};

      await updateDoc("Kegiatan", activity.id, {
        pengajuanRapat: {
          ...current,
          status: nextStatus,
          catatanReview: reviewNote.trim() || null,
          ditinjauPada: waktu,
        },
        diperbaruiPada: waktu,
      });

      setReviewStatus(nextStatus);
      setMessage(
        nextStatus === STATUS_PENGAJUAN.PERLU_REVISI
          ? "Pengajuan dikembalikan untuk diperbaiki oleh anggota."
          : "Pengajuan rapat ditolak. Tidak ada sesi absensi yang dibuat."
      );
    } catch (reviewError) {
      console.error("REVIEW PENGAJUAN RAPAT ERROR:", reviewError);
      setError(
        reviewError?.message || "Status pengajuan belum berhasil diperbarui."
      );
    } finally {
      setSavingReview(false);
    }
  };

  const approveMeeting = async () => {
    if (!isMeeting || finalizing || finalized) return;

    if (!selectedParticipantIds.size) {
      setError("Tentukan minimal satu peserta sebelum menyetujui rapat.");
      return;
    }

    setFinalizing(true);
    setError("");
    setMessage("");

    try {
      const activityForFinalization = {
        ...activity,
        pengajuanRapat: {
          ...(activity?.pengajuanRapat || {}),
          catatanReview: reviewNote.trim() || null,
        },
      };

      const result = await finalisasiKegiatan({
        db: firestoreDb,
        activity: activityForFinalization,
        participantIds: Array.from(selectedParticipantIds),
        serverTimestamp,
        updateDoc,
      });

      setReviewStatus(STATUS_PENGAJUAN.DISETUJUI);
      setFinalized(true);
      setMessage(
        `Rapat disetujui dan menjadi Akan Datang. ${result.jumlahPelaksanaan} pelaksanaan serta ${result.jumlahSesiAbsensi} sesi absensi berhasil dibuat.`
      );
    } catch (finalizeError) {
      console.error("SETUJUI PENGAJUAN RAPAT ERROR:", finalizeError);
      setError(
        finalizeError?.message ||
          "Pengajuan belum berhasil disetujui. Periksa jadwal dan izin Firestore."
      );
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <>
      <section
        className={`flex max-h-[calc(100dvh-2rem)] w-[min(96vw,940px)] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-[0.975] opacity-0"
        }`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-blue-50 via-card to-card px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  <AppIcon name="groups" size={14} />
                  Pengajuan Rapat
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ring-1 ring-inset ${statusClass(
                    reviewStatus
                  )}`}
                >
                  {labelStatus(reviewStatus)}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
                {activity?.namaKegiatan || "Rapat tanpa judul"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                Review jadwal dan peserta. Saat disetujui, rapat langsung menjadi
                kegiatan Akan Datang dan sistem membuat PelaksanaanKegiatan serta
                SesiAbsensi secara otomatis.
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
          {!isMeeting && (
            <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Overlay review ini saat ini difokuskan untuk Pengajuan Rapat.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                Agenda Rapat
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-muted">
                {activity?.deskripsi || "Belum ada agenda rapat."}
              </p>
            </section>

            <div className="space-y-3">
              <InfoCard
                icon="person"
                label="Pengaju"
                value={pengaju?.namaLengkap || "Anggota OSIS"}
                helper={activity?.pengajuanRapat?.jabatanPengaju || "Anggota"}
              />
              <InfoCard
                icon="apartment"
                label="Divisi / Sekbid"
                value={labelDivisi(divisiPengaju)}
              />
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-blue-50 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <AppIcon name="calendar_month" size={20} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  Usulan Jadwal
                </p>
                <h3 className="font-bold text-text">Jadwal yang Akan Difinalisasi</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <ScheduleCell
                icon="schedule"
                label="Mulai"
                value={formatDateTime(activity?.waktuMulai)}
              />
              <ScheduleCell
                icon="event_available"
                label="Selesai"
                value={formatDateTime(activity?.waktuSelesai)}
              />
              <ScheduleCell
                icon="timer"
                label="Durasi"
                value={durationLabel(activity?.durasiMenit)}
              />
            </div>

            <div className="border-t border-border px-5 py-4 text-sm text-text-muted sm:px-6">
              <span className="font-semibold text-text">Lokasi:</span>{" "}
              {activity?.lokasi || "Belum ditentukan"}
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <AppIcon name="groups" size={22} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    Peserta Rapat
                  </p>
                  <h3 className="font-bold text-text">Review Peserta</h3>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-text-muted">
                    Daftar awal berasal dari pengajuan anggota. Pembina tetap dapat
                    mengubah kelompok, menambah, atau menghapus peserta sebelum rapat
                    disetujui.
                  </p>
                </div>
              </div>

              {!finalized && (
                <button
                  type="button"
                  onClick={() => setParticipantPickerMode("kelompok")}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 text-sm font-bold text-primary transition hover:bg-primary/10"
                >
                  <AppIcon name="group_add" size={18} />
                  {selectedParticipantIds.size ? "Ganti Kelompok" : "Pilih Peserta"}
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                {participantSource?.label || "Peserta Rapat"}
              </span>
              <span className="text-xs font-semibold text-text-muted">
                {selectedParticipantIds.size} peserta dipilih
              </span>
            </div>

            {selectedParticipantRows.length ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="max-h-64 divide-y divide-border overflow-y-auto">
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
                        <span className="block truncate text-sm font-bold text-text">
                          {participant.namaLengkap}
                        </span>
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
                <p className="text-sm font-bold text-text">Belum ada peserta</p>
                <p className="mt-1 text-xs text-text-muted">
                  Minimal satu peserta diperlukan sebelum sesi absensi dibuat.
                </p>
              </div>
            )}
          </section>

          {!finalized && (
            <section className="mt-5 rounded-3xl border border-border bg-surface p-5">
              <label className="block">
                <span className="text-xs font-bold text-text">Catatan Review Pembina</span>
                <span className="ml-1 text-xs text-text-muted">(opsional)</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Tuliskan alasan revisi, penolakan, atau catatan sebelum rapat disetujui."
                  className="mt-2 w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </section>
          )}

          {(message || error) && (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                error
                  ? "bg-error-bg text-error-text"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {error || message}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-7">
          {finalized ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-emerald-700">
                Rapat sudah disetujui dan sesi absensi telah dibuat.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <p className="max-w-md text-xs leading-5 text-text-muted">
                Tombol Setujui akan memfinalisasi jadwal, menetapkan peserta, mengubah
                status menjadi Akan Datang, lalu membuat sesi absensi otomatis.
              </p>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={savingReview || finalizing}
                  onClick={() => updateReviewStatus(STATUS_PENGAJUAN.PERLU_REVISI)}
                  className="min-h-11 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  Minta Revisi
                </button>
                <button
                  type="button"
                  disabled={savingReview || finalizing}
                  onClick={() => updateReviewStatus(STATUS_PENGAJUAN.DITOLAK)}
                  className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  type="button"
                  disabled={
                    !isMeeting ||
                    !selectedParticipantIds.size ||
                    savingReview ||
                    finalizing
                  }
                  onClick={approveMeeting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AppIcon name="check_circle" size={19} />
                  {finalizing ? "Membuat sesi..." : "Setujui & Buat Sesi Absensi"}
                </button>
              </div>
            </div>
          )}
        </footer>
      </section>

      {participantPickerMode && (
        <PilihPesertaKegiatanOverlay
          mode={participantPickerMode}
          member={pengaju || null}
          divisi={divisiPengaju || null}
          existingParticipantIds={Array.from(selectedParticipantIds)}
          onApplyGroup={applyParticipantGroup}
          onAddMembers={addManualParticipants}
          onClose={() => setParticipantPickerMode(null)}
        />
      )}
    </>
  );
}

function InfoCard({ icon, label, value, helper = "" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AppIcon name={icon} size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-text">{value || "-"}</p>
          {helper && <p className="mt-0.5 text-xs text-text-muted">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function ScheduleCell({ icon, label, value }) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <AppIcon name={icon} size={19} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-text">
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
