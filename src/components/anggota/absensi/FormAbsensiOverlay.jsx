"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import {
  KOLEKSI_ABSENSI,
  STATUS_KEHADIRAN,
  STATUS_SESI_ABSENSI,
  STATUS_VERIFIKASI_ABSENSI,
  buatIdDokumenAbsensi,
  buatPayloadAbsensi,
  normalisasiStatusKehadiran,
} from "@/components/absensi/konfigurasiAbsensi";
import {
  uploadBuktiAbsensiCloudinary,
  validasiBuktiAbsensi,
} from "@/lib/uploadBuktiAbsensiCloudinary";
import {
  formatShortDate,
  formatTime,
} from "@/components/anggota/_shared/formatters";

const STATUS_OPTIONS = [
  {
    value: STATUS_KEHADIRAN.HADIR,
    label: "Hadir",
    description: "Saya mengikuti kegiatan pada sesi ini.",
    icon: "check_circle",
  },
  {
    value: STATUS_KEHADIRAN.IZIN,
    label: "Izin",
    description: "Saya tidak dapat hadir karena memiliki keperluan tertentu.",
    icon: "event_busy",
  },
  {
    value: STATUS_KEHADIRAN.SAKIT,
    label: "Sakit",
    description: "Saya tidak dapat hadir karena kondisi kesehatan.",
    icon: "medical_services",
  },
];

export function useFormAbsensiOverlay() {
  const { openOverlay, closeOverlay } = useOverlay();

  const openFormAbsensi = useCallback(
    ({ session, activity, member, existingRecord = null }) => {
      if (!session?.id || !activity?.id || !member?.id) return;

      openOverlay({
        closeOnBackdrop: true,
        className: "px-3 py-4 sm:px-6",
        content: (
          <FormAbsensiModal
            session={session}
            activity={activity}
            member={member}
            existingRecord={existingRecord}
            onClose={() => closeOverlay()}
          />
        ),
      });
    },
    [openOverlay, closeOverlay]
  );

  return { openFormAbsensi };
}

export default function FormAbsensiModal({
  session,
  activity,
  member,
  existingRecord,
  onClose,
}) {
  const { setDoc, updateDoc, serverTimestamp } = useDb();
  const fileInputRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(() =>
    existingRecord
      ? normalisasiStatusKehadiran(
          existingRecord.statusKehadiran ?? existingRecord.status
        )
      : STATUS_KEHADIRAN.HADIR
  );
  const [alasan, setAlasan] = useState(existingRecord?.alasan || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const membutuhkanBukti = [
    STATUS_KEHADIRAN.IZIN,
    STATUS_KEHADIRAN.SAKIT,
  ].includes(status);

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(() => onClose?.(), 200);
  };

  const validate = () => {
    if (session?.status !== STATUS_SESI_ABSENSI.DIBUKA) {
      return "Sesi absensi sudah tidak dibuka.";
    }

    if (!STATUS_OPTIONS.some((item) => item.value === status)) {
      return "Pilih status kehadiran terlebih dahulu.";
    }

    if (membutuhkanBukti) {
      if (alasan.trim().length < 5) {
        return "Alasan izin atau sakit harus diisi dengan jelas.";
      }

      // Jika record lama sudah memiliki bukti, file baru tidak wajib dipilih.
      if (!selectedFile && !existingRecord?.dokumenPendukung?.urlFile) {
        return "Dokumen pendukung wajib diunggah untuk status izin atau sakit.";
      }

      if (selectedFile) {
        const fileError = validasiBuktiAbsensi(selectedFile);
        if (fileError) return fileError;
      }
    }

    return "";
  };

  const handleSubmit = async () => {
    if (saving) return;

    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Bukti hanya diupload ketika Anggota memilih Izin/Sakit dan memilih file baru.
      let dokumenPendukung = membutuhkanBukti
        ? existingRecord?.dokumenPendukung || null
        : null;

      if (membutuhkanBukti && selectedFile) {
        dokumenPendukung = await uploadBuktiAbsensiCloudinary(selectedFile);
      }

      const waktu = serverTimestamp();
      const payload = buatPayloadAbsensi({
        idSesi: session.id,
        idPelaksanaan: session.idPelaksanaan || null,
        idKegiatan: activity.id,
        idPeriode: activity.idPeriode || session.idPeriode || null,
        idAnggota: member.id,
        statusKehadiran: status,
        alasan: membutuhkanBukti ? alasan.trim() : null,
        dokumenPendukung,
        statusVerifikasi:
          STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI,
        waktuCheckIn: status === STATUS_KEHADIRAN.HADIR ? waktu : null,
        sumber: "anggota",
        diajukanPada: existingRecord?.diajukanPada || waktu,
        dikonfirmasiPada: null,
        dikonfirmasiOleh: null,
        dibuatPada: existingRecord?.dibuatPada || waktu,
        diperbaruiPada: waktu,
      });

      if (existingRecord?.id) {
        // Edit record lama menggunakan dokumen yang sama, lalu status verifikasi
        // kembali menunggu konfirmasi karena isinya berubah.
        await updateDoc(KOLEKSI_ABSENSI.ABSENSI, existingRecord.id, payload);
      } else {
        // ID deterministik memastikan satu Anggota hanya memiliki satu record
        // untuk setiap Sesi Absensi.
        const idAbsensi = buatIdDokumenAbsensi(session.id, member.id);
        await setDoc(KOLEKSI_ABSENSI.ABSENSI, idAbsensi, payload, {
          merge: true,
        });
      }

      handleClose();
    } catch (submitError) {
      console.error("SIMPAN ABSENSI ANGGOTA ERROR:", submitError);
      setError(
        submitError?.message ||
          "Absensi belum berhasil dikirim. Periksa koneksi dan izin Firestore."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`flex max-h-[calc(100dvh-2rem)] w-[min(95vw,720px)] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl transition-all duration-200 ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-4 scale-[0.98] opacity-0"
      }`}
    >
      <header className="shrink-0 border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Sesi Absensi Aktif
            </p>
            <h2 className="mt-2 text-xl font-bold text-text">
              {activity?.namaKegiatan || "Kegiatan OSIS"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-text-muted">
              {formatShortDate(session?.tanggal || session?.waktuMulai)} · {" "}
              {formatTime(session?.waktuMulai)} - {formatTime(session?.waktuSelesai)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition hover:bg-surface hover:text-text"
            aria-label="Tutup form absensi"
          >
            <AppIcon name="close" size={21} />
          </button>
        </div>
      </header>

      <div className="overflow-y-auto p-5 sm:p-6">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-bold text-text">Pilih status kehadiran</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATUS_OPTIONS.map((option) => {
              const active = status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatus(option.value);
                    setError("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      active ? "bg-primary text-white" : "bg-input text-text-muted"
                    }`}
                  >
                    <AppIcon name={option.icon} size={18} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-text">{option.label}</p>
                  <p className="mt-1 text-[11px] leading-4 text-text-muted">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {membutuhkanBukti && (
          <section className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <AppIcon name="attach_file" size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-text">
                  Keterangan dan dokumen pendukung
                </h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Status {status === STATUS_KEHADIRAN.SAKIT ? "sakit" : "izin"} wajib disertai alasan dan bukti pendukung.
                </p>
              </div>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-text-muted">
              Alasan
            </label>
            <textarea
              value={alasan}
              onChange={(event) => setAlasan(event.target.value)}
              rows={4}
              placeholder={
                status === STATUS_KEHADIRAN.SAKIT
                  ? "Jelaskan kondisi sakit secara singkat"
                  : "Jelaskan alasan izin secara singkat"
              }
              className="mt-2 w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file) {
                  const fileError = validasiBuktiAbsensi(file);
                  if (fileError) {
                    setSelectedFile(null);
                    setError(fileError);
                    event.target.value = "";
                    return;
                  }
                }
                setError("");
                setSelectedFile(file);
              }}
            />

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-text">
                  {selectedFile?.name ||
                    existingRecord?.dokumenPendukung?.namaFile ||
                    "Belum ada dokumen dipilih"}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  PDF/JPG/PNG · maksimal 5 MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card px-4 text-xs font-bold text-primary transition hover:bg-primary/5"
              >
                <AppIcon name="upload_file" size={17} />
                {existingRecord?.dokumenPendukung || selectedFile
                  ? "Ganti Dokumen"
                  : "Upload Dokumen"}
              </button>
            </div>
          </section>
        )}

        {existingRecord && (
          <div className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Mengubah absensi akan mengembalikan status verifikasi menjadi <strong>Menunggu Konfirmasi Pembina</strong>.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error-text">
            {error}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-bold text-text hover:bg-surface"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name="send" size={18} />
            {saving ? "Mengirim..." : existingRecord ? "Perbarui Absensi" : "Kirim Absensi"}
          </button>
        </div>
      </footer>
    </section>
  );
}
