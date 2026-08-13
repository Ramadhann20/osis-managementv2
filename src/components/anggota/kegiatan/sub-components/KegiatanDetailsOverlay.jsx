"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import { isBadanPengurusHarian } from "@/components/anggota/_shared/AksesOrganisasi";
import { db } from "@/lib/firebase-config";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  formatDateTime,
  toDate,
} from "@/components/anggota/_shared/formatters";
import PilihPesertaKegiatanOverlay from "./PilihPesertaKegiatanOverlay";
import {
  uploadProposalCloudinary,
  validasiFileProposal,
} from "@/lib/uploadProposalCloudinary";

const STATUS_PROPOSAL = Object.freeze({
  BELUM_DIAJUKAN: "belum_diajukan",
  MENUNGGU_REVIEW: "menunggu_review",
  PERLU_REVISI: "perlu_revisi",
  DISETUJUI: "disetujui",
  DITOLAK: "ditolak",
});

const LABEL_STATUS_PROPOSAL = Object.freeze({
  draf: "Draf",
  belum_diajukan: "Belum Diajukan",
  diajukan: "Diajukan",
  menunggu_review: "Menunggu Review",
  perlu_revisi: "Perlu Revisi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
});

function labelJenisKegiatan(value) {
  return value === "rapat" ? "Rapat" : "Program Kerja";
}

function labelDivisi(divisi) {
  return divisi?.namaSingkat || divisi?.nama || "Pengurus OSIS";
}

function labelStatusProposal(value) {
  return LABEL_STATUS_PROPOSAL[value] || value || "Belum Diajukan";
}

function formatDuration(activity) {
  const storedMinutes = Number(activity?.durasiMenit);
  let minutes =
    Number.isFinite(storedMinutes) && storedMinutes > 0 ? storedMinutes : 0;

  if (!minutes) {
    const start = toDate(activity?.waktuMulai);
    const end = toDate(activity?.waktuSelesai);

    if (start && end) {
      const diff = Math.round((end.getTime() - start.getTime()) / 60000);
      minutes = diff > 0 ? diff : 0;
    }
  }

  if (!minutes) return "Belum ditentukan";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];

  if (hours) parts.push(`${hours} jam`);
  if (rest) parts.push(`${rest} menit`);

  return parts.join(" ");
}

function formatDateRange(activity) {
  const start = activity?.waktuMulai;
  const end = activity?.waktuSelesai;

  if (!start) return "Belum ditentukan";
  if (!end) return formatDateTime(start);

  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return null;

  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function getJumlahSesiAbsensi(activity) {
  const value = Number(
    activity?.jumlahSesiAbsensi ?? activity?.jumlahSesiAbsensiRencana
  );

  return Number.isFinite(value) && value > 0 ? value : null;
}

function participantFromMember(item) {
  return {
    id: item.id,
    namaLengkap: item.namaLengkap || item.fullName || item.nama || "Anggota",
    nis: item.nis || null,
    idDivisi: item.idDivisi || item.divisionId || null,
    jabatanOrganisasi:
      item.jabatanOrganisasi || item.organisationPosition || item.jabatan || "Anggota",
    labelDivisi:
      item.labelDivisi ||
      item.divisiData?.namaSingkat ||
      item.divisiData?.nama ||
      "Pengurus OSIS",
    terpilih: true,
  };
}

function participantFromSnapshot(item) {
  return {
    id: item?.idAnggota || item?.id || "",
    namaLengkap: item?.namaLengkap || "Anggota",
    nis: item?.nis || null,
    idDivisi: item?.idDivisi || null,
    jabatanOrganisasi: item?.jabatanOrganisasi || "Anggota",
    labelDivisi: item?.labelDivisi || "Pengurus OSIS",
    terpilih: true,
  };
}

function participantSnapshot(item) {
  return {
    idAnggota: item.id,
    namaLengkap: item.namaLengkap || "Anggota",
    nis: item.nis || null,
    idDivisi: item.idDivisi || null,
    jabatanOrganisasi: item.jabatanOrganisasi || "Anggota",
    labelDivisi: item.labelDivisi || "Pengurus OSIS",
  };
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
  const router = useRouter();
  const { member } = useCurrentMember();
  const { colRef } = useDb();

  // Data Divisi diperlukan untuk membedakan BPH dengan anggota Sekbid biasa.
  // Context existing tetap digunakan; tidak ada perubahan pada DbContext.
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: Boolean(member?.id),
  });

  // Sesi dibaca dari detail kegiatan agar tombol "Lakukan Absensi" hanya
  // muncul ketika benar-benar ada sesi milik kegiatan yang sedang dibuka.
  const sessions = useCollection(() => colRef("SesiAbsensi"), [], {
    enabled: Boolean(member?.id && activity?.id),
  });

  const [visible, setVisible] = useState(false);
  const [selectedProposalFile, setSelectedProposalFile] = useState(null);
  const [proposalState, setProposalState] = useState(activity?.proposal || null);
  const [participantPickerMode, setParticipantPickerMode] = useState(null);
  const [participantSource, setParticipantSource] = useState(() => {
    const source = activity?.usulanPeserta;
    if (!source) return null;
    return {
      tipe: source.tipeSumber || "tersimpan",
      key: source.sumberPemilihan || "tersimpan",
      label: source.labelKelompok || "Usulan peserta tersimpan",
      idDivisi: source.idDivisiSumber || null,
    };
  });
  const [participants, setParticipants] = useState(() =>
    Array.isArray(activity?.usulanPeserta?.daftar)
      ? activity.usulanPeserta.daftar.map(participantFromSnapshot).filter((item) => item.id)
      : []
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const proposalInputRef = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isMeeting = activity?.jenisKegiatan === "rapat";

  // -------------------------------------------------------------------------
  // HAK AKSES PROPOSAL
  // -------------------------------------------------------------------------
  // Semua anggota Sekbid terkait boleh MELIHAT kegiatan berstatus terencana,
  // tetapi hanya Ketua Sekbid penyelenggara dan BPH yang boleh mengubah /
  // mengunggah proposal serta usulan peserta.
  const divisionMap = useMemo(
    () =>
      new Map(
        (Array.isArray(divisions?.rows) ? divisions.rows : []).map((item) => [
          item.id,
          item,
        ])
      ),
    [divisions?.rows]
  );

  const memberDivisionId = member?.idDivisi || member?.divisionId || null;
  const activityDivisionId = activity?.idDivisi || activity?.divisionId || null;
  const memberDivision = memberDivisionId
    ? divisionMap.get(memberDivisionId) || null
    : null;

  const isBph = isBadanPengurusHarian(memberDivision);

  const jabatan = String(
    member?.jabatanOrganisasi ||
      member?.organisationPosition ||
      member?.jabatan ||
      ""
  )
    .trim()
    .toLowerCase();

  // Struktur data lama dapat menyimpan jabatan sebagai "Ketua" sedangkan
  // data baru dapat menyimpan "Ketua Sekbid ...". Keduanya diterima.
  const isKetuaSekbid =
    !isBph &&
    (jabatan === "ketua" || jabatan.startsWith("ketua sekbid"));

  const isKetuaSekbidPenyelenggara =
    isKetuaSekbid &&
    Boolean(memberDivisionId) &&
    Boolean(activityDivisionId) &&
    memberDivisionId === activityDivisionId;

  // Proposal hanya dikelola selama Program Kerja masih pada tahap terencana.
  // Setelah finalisasi kegiatan, proposal menjadi read-only bagi Anggota.
  const canManageProposal =
    !isMeeting &&
    activity?.status === "terencana" &&
    (isBph || isKetuaSekbidPenyelenggara);

  const jumlahSesiAbsensi = getJumlahSesiAbsensi(activity);
  const selectedParticipants = useMemo(
    () => participants.filter((item) => item.terpilih),
    [participants]
  );
  const canSaveProposal =
    canManageProposal && Boolean(selectedProposalFile || proposalState);

  const finalParticipantIds = Array.isArray(activity?.pesertaFinal?.idAnggota)
    ? activity.pesertaFinal.idAnggota
    : [];
  const isFinalParticipant = Boolean(member?.id) && finalParticipantIds.includes(member.id);
  const activeAttendanceSession = useMemo(
    () =>
      (Array.isArray(sessions?.rows) ? sessions.rows : []).find(
        (session) =>
          (session?.idKegiatan ?? session?.activityId) === activity?.id &&
          session?.status === "dibuka"
      ) || null,
    [sessions?.rows, activity?.id]
  );
  const canDoAttendance =
    activity?.status === "berlangsung" &&
    isFinalParticipant &&
    Boolean(activeAttendanceSession?.id);

  const handleGoToAttendance = () => {
    if (!canDoAttendance) return;
    handleClose();
    window.setTimeout(() => {
      router.push(`/anggota/absensi?session=${encodeURIComponent(activeAttendanceSession.id)}`);
    }, 220);
  };

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(() => onClose?.(), 220);
  };

  const openProposalBrowser = () => {
    if (!canManageProposal) return;
    proposalInputRef.current?.click();
  };

  const handleProposalFileChange = (event) => {
    if (!canManageProposal) {
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0] || null;
    if (!file) return;

    const validationError = validasiFileProposal(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setSelectedProposalFile(file);
    setMessage("");
    setError("");
  };

  const applyParticipantGroup = (rows, source) => {
    if (!canManageProposal) return;
    setParticipants(rows.map(participantFromMember));
    setParticipantSource(source || null);
    setMessage("");
  };

  const addManualParticipants = (rows) => {
    if (!canManageProposal) return;
    setParticipants((current) => {
      const map = new Map(current.map((item) => [item.id, item]));

      rows.forEach((row) => {
        const existing = map.get(row.id);
        map.set(row.id, {
          ...(existing || participantFromMember(row)),
          terpilih: true,
        });
      });

      return Array.from(map.values()).sort((a, b) =>
        String(a.namaLengkap || "").localeCompare(String(b.namaLengkap || ""), "id")
      );
    });

    setParticipantSource((current) =>
      current || {
        tipe: "manual",
        key: "manual",
        label: "Dipilih Manual",
        idDivisi: null,
      }
    );
  };

  const toggleParticipant = (id) => {
    if (!canManageProposal) return;
    setParticipants((current) =>
      current.map((item) =>
        item.id === id ? { ...item, terpilih: !item.terpilih } : item
      )
    );
  };

  const handleSaveProposal = async () => {
    if (saving) return;

    // UI bukan satu-satunya pembatas. Handler tetap melakukan pengecekan agar
    // anggota biasa tidak dapat menjalankan proses simpan dari state lokal.
    if (!canManageProposal) {
      setError(
        "Hanya Ketua Sekbid penyelenggara atau anggota BPH yang dapat mengunggah proposal."
      );
      return;
    }

    if (!canSaveProposal) return;

    if (!member?.id) {
      setError("Data anggota aktif tidak ditemukan.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const waktu = serverTimestamp();
      const isNewFile = Boolean(selectedProposalFile);
      const nextStatus = isNewFile
        ? STATUS_PROPOSAL.MENUNGGU_REVIEW
        : proposalState?.status || STATUS_PROPOSAL.MENUNGGU_REVIEW;

      // File baru diupload terlebih dahulu. Firestore hanya menyimpan metadata
      // dan URL Cloudinary, bukan binary file.
      const uploadedFile = selectedProposalFile
        ? await uploadProposalCloudinary(selectedProposalFile)
        : null;

      const proposalPayload = {
        idKegiatan: activity.id,
        idPengunggah: proposalState?.idPengunggah || member.id,
        namaKegiatan: activity.namaKegiatan || "Program Kerja",
        namaFile:
          uploadedFile?.namaFile || proposalState?.namaFile || "proposal.pdf",
        ukuranFileByte:
          uploadedFile?.ukuranFileByte ?? proposalState?.ukuranFileByte ?? 0,
        tipeFile: uploadedFile?.tipeFile || proposalState?.tipeFile || null,
        urlFile: uploadedFile?.urlFile || proposalState?.urlFile || null,
        publicIdFile:
          uploadedFile?.publicIdFile || proposalState?.publicIdFile || null,
        assetIdFile:
          uploadedFile?.assetIdFile || proposalState?.assetIdFile || null,
        resourceTypeFile:
          uploadedFile?.resourceTypeFile ||
          proposalState?.resourceTypeFile ||
          null,
        formatFile:
          uploadedFile?.formatFile || proposalState?.formatFile || null,
        versionCloudinary:
          uploadedFile?.versionCloudinary ??
          proposalState?.versionCloudinary ??
          null,
        versi: isNewFile
          ? Number(proposalState?.versi || 0) + 1
          : Number(proposalState?.versi || 1),
        status: nextStatus,
        diajukanPada: isNewFile
          ? waktu
          : proposalState?.diajukanPada || waktu,
        diperbaruiPada: waktu,
        jadwalUsulan: proposalState?.jadwalUsulan || null,
        kepanitiaanUsulan: proposalState?.kepanitiaanUsulan || null,
      };

      const proposalRef = proposalState?.id
        ? doc(db, "Proposal", proposalState.id)
        : doc(collection(db, "Proposal"));
      const proposalId = proposalRef.id;

      const daftarUsulan = selectedParticipants.map(participantSnapshot);
      const usulanPeserta = daftarUsulan.length
        ? {
            statusReview: "menunggu_review",
            sumberPemilihan: participantSource?.key || "manual",
            tipeSumber: participantSource?.tipe || "manual",
            labelKelompok: participantSource?.label || "Dipilih Manual",
            idDivisiSumber: participantSource?.idDivisi || null,
            idAnggota: daftarUsulan.map((item) => item.idAnggota),
            daftar: daftarUsulan,
            jumlahPeserta: daftarUsulan.length,
            idPengaju: member.id,
            diajukanPada: activity?.usulanPeserta?.diajukanPada || waktu,
            diperbaruiPada: waktu,
          }
        : null;

      // Metadata Proposal dan relasi di Kegiatan ditulis atomik agar Firestore
      // tidak memiliki Proposal tanpa relasi Kegiatan (atau sebaliknya).
      const batch = writeBatch(db);

      batch.set(proposalRef, proposalPayload, { merge: true });
      batch.update(doc(db, "Kegiatan", activity.id), {
        idProposal: proposalId,
        statusProposal: nextStatus,
        usulanPeserta,
        diperbaruiPada: waktu,
      });

      await batch.commit();

      const nextProposal = {
        id: proposalId,
        ...proposalState,
        ...proposalPayload,
      };

      setProposalState(nextProposal);
      setSelectedProposalFile(null);
      if (proposalInputRef.current) proposalInputRef.current.value = "";
      setMessage(
        daftarUsulan.length
          ? "Proposal dan usulan peserta berhasil disimpan untuk ditinjau Pembina."
          : "Proposal berhasil disimpan. Penentuan peserta diserahkan kepada Pembina."
      );
    } catch (saveError) {
      console.error("SIMPAN PROPOSAL KEGIATAN ERROR:", saveError);
      setError(
        saveError?.message ||
          "Proposal belum berhasil disimpan. Periksa koneksi dan izin Firestore."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section
        className={`flex max-h-[calc(100dvh-2rem)] w-[min(95vw,940px)] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-[0.975] opacity-0"
        }`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    isMeeting
                      ? "bg-blue-50 text-blue-700"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <AppIcon name={isMeeting ? "groups" : "campaign"} size={14} />
                  {labelJenisKegiatan(activity?.jenisKegiatan)}
                </span>
                <StatusBadge status={activity?.status} />
              </div>

              <h2 className="mt-3 max-w-2xl text-xl font-bold tracking-tight text-text sm:text-2xl">
                {activity?.namaKegiatan || "Kegiatan tanpa nama"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                {isMeeting
                  ? "Informasi rapat dan jadwal pelaksanaan."
                  : "Informasi program kerja, proposal, dan usulan peserta kegiatan."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup detail kegiatan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card/80 text-text-muted shadow-sm transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <AppIcon name="close" size={22} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_0.85fr]">
            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <AppIcon name={isMeeting ? "notes" : "subject"} size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {isMeeting ? "Agenda Rapat" : "Gambaran Kegiatan"}
                  </p>
                  <h3 className="mt-0.5 font-bold text-text">
                    {isMeeting ? "Pembahasan Rapat" : "Deskripsi Program Kerja"}
                  </h3>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-text-muted">
                {activity?.deskripsi ||
                  (isMeeting
                    ? "Agenda rapat belum ditambahkan."
                    : "Deskripsi kegiatan belum ditambahkan.")}
              </p>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <QuickInfo
                icon="location_on"
                label="Lokasi"
                value={activity?.lokasi || "Belum ditentukan"}
              />
              <QuickInfo
                icon="apartment"
                label="Penyelenggara"
                value={labelDivisi(activity?.divisi)}
              />
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-5 py-4 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <AppIcon name="calendar_month" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Jadwal
                </p>
                <h3 className="font-bold text-text">Informasi Jadwal</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <ScheduleInfo
                icon="schedule"
                label={isMeeting ? "Waktu Rapat" : "Waktu Pelaksanaan"}
                value={formatDateRange(activity)}
              />
              <ScheduleInfo
                icon="timer"
                label="Durasi"
                value={formatDuration(activity)}
              />
              <ScheduleInfo
                icon="fact_check"
                label="Sesi Absensi"
                value={
                  jumlahSesiAbsensi
                    ? `${jumlahSesiAbsensi} sesi`
                    : "Belum tersedia"
                }
              />
            </div>
          </section>

          {activity?.status === "berlangsung" && isFinalParticipant && (
            <section className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                    <AppIcon name="event_available" size={22} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      Absensi Kegiatan
                    </p>
                    <h3 className="font-bold text-text">
                      {activeAttendanceSession
                        ? "Sesi Absensi Sedang Dibuka"
                        : "Belum Ada Sesi Absensi Aktif"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-text-muted">
                      {activeAttendanceSession
                        ? "Kamu termasuk peserta kegiatan. Lakukan absensi sebelum sesi ditutup Pembina."
                        : "Kegiatan sedang berlangsung, tetapi Pembina belum membuka sesi absensi."}
                    </p>
                  </div>
                </div>

                {canDoAttendance && (
                  <button
                    type="button"
                    onClick={handleGoToAttendance}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
                  >
                    <AppIcon name="check" size={18} />
                    Lakukan Absensi
                  </button>
                )}
              </div>
            </section>
          )}

          {!isMeeting && (
            <>
              <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <AppIcon name="description" size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        Dokumen Kegiatan
                      </p>
                      <h3 className="font-bold text-text">Proposal Program Kerja</h3>
                      <p className="mt-1 text-xs text-text-muted">
                        Format PDF, DOC, atau DOCX · maksimal 10 MB.
                      </p>
                    </div>
                  </div>

                  {canManageProposal ? (
                    <div>
                      <input
                        ref={proposalInputRef}
                        type="file"
                        onChange={handleProposalFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={openProposalBrowser}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <AppIcon name="upload_file" size={18} />
                        {proposalState ? "Ganti File Proposal" : "Upload Proposal"}
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-xl border border-border bg-surface px-3 py-2 text-[11px] font-semibold text-text-muted">
                      Mode lihat saja
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  {proposalState ? (
                    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                          <AppIcon name="picture_as_pdf" size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text">
                            {proposalState.namaFile || "File proposal"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                            <span>Versi {proposalState.versi || 1}</span>
                            {formatBytes(proposalState.ukuranFileByte) && (
                              <span>{formatBytes(proposalState.ukuranFileByte)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ProposalStatusBadge
                        status={proposalState.status || activity?.statusProposal}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-red-200 bg-red-50/70 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                          <AppIcon name="error_outline" size={19} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-700">
                            Belum ada Proposal
                          </p>
                          <p className="mt-1 text-xs leading-5 text-red-600">
                            {canManageProposal
                              ? "Pilih file PDF, DOC, atau DOCX sebelum menyimpan pengajuan."
                              : "Proposal belum diajukan oleh Ketua Sekbid penyelenggara atau BPH."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {canManageProposal && selectedProposalFile && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <AppIcon name="attach_file" size={18} className="text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-text">
                          {selectedProposalFile.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {formatBytes(selectedProposalFile.size) || "File dipilih"}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                        Siap disimpan
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <AppIcon name="group_add" size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                        Opsional
                      </p>
                      <h3 className="font-bold text-text">Usulan Peserta Kegiatan</h3>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-text-muted">
                        {canManageProposal
                          ? "Kamu dapat mengusulkan peserta kepada Pembina. Jika dikosongkan, penentuan peserta sepenuhnya dilakukan oleh Pembina."
                          : "Usulan peserta dapat dilihat oleh seluruh anggota terkait, tetapi hanya Ketua Sekbid penyelenggara dan BPH yang dapat mengubahnya."}
                      </p>
                    </div>
                  </div>

                  {canManageProposal && (
                    <button
                      type="button"
                      onClick={() => setParticipantPickerMode("kelompok")}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <AppIcon name="groups" size={18} />
                      {participants.length ? "Ganti Kelompok" : "Pilih Peserta"}
                    </button>
                  )}
                </div>

                {participantSource && (
                  <div className="mt-5 rounded-2xl border border-border bg-surface px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Dasar Pemilihan
                    </p>
                    <p className="mt-1 text-sm font-bold text-text">
                      {participantSource.label}
                    </p>
                  </div>
                )}

                {participants.length ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                    <div className="max-h-64 divide-y divide-border overflow-y-auto">
                      {participants.map((participant) => (
                        <label
                          key={participant.id}
                          className={`flex items-center gap-3 px-4 py-3 transition ${
                            canManageProposal ? "cursor-pointer" : "cursor-default"
                          } ${
                            participant.terpilih ? "bg-card" : "bg-surface opacity-60"
                          }`}
                        >
                          {canManageProposal ? (
                            <input
                              type="checkbox"
                              checked={participant.terpilih}
                              onChange={() => toggleParticipant(participant.id)}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                          ) : (
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                participant.terpilih ? "bg-primary" : "bg-border"
                              }`}
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

                    <div className="flex flex-col gap-3 border-t border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-semibold text-text-muted">
                        {selectedParticipants.length} peserta diusulkan
                      </span>
                      {canManageProposal && (
                        <button
                          type="button"
                          onClick={() => setParticipantPickerMode("manual")}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card px-3 text-xs font-bold text-primary transition hover:bg-primary/5"
                        >
                          <AppIcon name="person_add" size={17} />
                          Tambah Peserta
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-5 text-center">
                    <p className="text-sm font-bold text-text">Belum ada usulan peserta</p>
                    <p className="mt-1 text-xs leading-5 text-text-muted">
                      Tidak masalah. Pembina dapat menentukan seluruh peserta saat finalisasi.
                    </p>
                  </div>
                )}
              </section>

              {!canManageProposal && activity?.status === "terencana" && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                  Kamu dapat melihat Program Kerja ini karena termasuk Sekbid terkait atau BPH.
                  Pengunggahan proposal dan perubahan usulan peserta hanya tersedia untuk Ketua
                  Sekbid penyelenggara dan BPH.
                </div>
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

              {canSaveProposal && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveProposal}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AppIcon name="save" size={18} />
                    {saving ? "Menyimpan..." : "Simpan Pengajuan"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {participantPickerMode && !isMeeting && canManageProposal && (
        <PilihPesertaKegiatanOverlay
          mode={participantPickerMode}
          member={member}
          divisi={activity?.divisi}
          existingParticipantIds={participants.map((item) => item.id)}
          onApplyGroup={applyParticipantGroup}
          onAddMembers={addManualParticipants}
          onClose={() => setParticipantPickerMode(null)}
        />
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const config = {
    draf: ["Draf", "bg-slate-100 text-slate-700"],
    terencana: ["Terencana", "bg-blue-50 text-blue-700"],
    akan_datang: ["Akan Datang", "bg-sky-50 text-sky-700"],
    berlangsung: ["Berlangsung", "bg-amber-50 text-amber-700"],
    selesai: ["Selesai", "bg-emerald-50 text-emerald-700"],
    dibatalkan: ["Dibatalkan", "bg-red-50 text-red-700"],
  }[status] || [status || "-", "bg-slate-100 text-slate-700"];

  return (
    <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${config[1]}`}>
      {config[0]}
    </span>
  );
}

function ProposalStatusBadge({ status }) {
  const config = {
    draf: "bg-slate-100 text-slate-700",
    belum_diajukan: "bg-slate-100 text-slate-700",
    diajukan: "bg-blue-50 text-blue-700",
    menunggu_review: "bg-amber-50 text-amber-700",
    perlu_revisi: "bg-orange-50 text-orange-700",
    disetujui: "bg-emerald-50 text-emerald-700",
    ditolak: "bg-red-50 text-red-700",
  }[status] || "bg-slate-100 text-slate-700";

  return (
    <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${config}`}>
      {labelStatusProposal(status)}
    </span>
  );
}

function QuickInfo({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AppIcon name={icon} size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-text">
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScheduleInfo({ icon, label, value }) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <AppIcon name={icon} size={19} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0">
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

function initials(value) {
  return String(value || "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
