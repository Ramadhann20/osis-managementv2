// Konfigurasi terpusat untuk cycle absensi OSIS.
// File ini dipakai bersama oleh sisi Anggota dan Pembina agar status,
// nama collection, dan bentuk payload tidak didefinisikan berulang.

export const KOLEKSI_ABSENSI = Object.freeze({
  ABSENSI: "Absensi",
  RINGKASAN: "RingkasanAbsensi",
  KEGIATAN: "Kegiatan",
  PELAKSANAAN: "PelaksanaanKegiatan",
  SESI: "SesiAbsensi",
  ANGGOTA: "Anggota",
  DIVISI: "Divisi",
});

// Status yang dapat dipilih Anggota pada implementasi terbaru.
// TERLAMBAT tetap dipertahankan hanya untuk kompatibilitas data lama.
export const STATUS_KEHADIRAN = Object.freeze({
  HADIR: "hadir",
  IZIN: "izin",
  SAKIT: "sakit",
  ALPA: "alpa",
  TERLAMBAT: "terlambat",
});

export const STATUS_VERIFIKASI_ABSENSI = Object.freeze({
  MENUNGGU_KONFIRMASI: "menunggu_konfirmasi",
  DIKONFIRMASI: "dikonfirmasi",
});

export const STATUS_SESI_ABSENSI = Object.freeze({
  TERJADWAL: "terjadwal",
  DIBUKA: "dibuka",
  DITUTUP: "ditutup",
  DIBATALKAN: "dibatalkan",
});

export const LABEL_STATUS_KEHADIRAN = Object.freeze({
  [STATUS_KEHADIRAN.HADIR]: "Hadir",
  [STATUS_KEHADIRAN.IZIN]: "Izin",
  [STATUS_KEHADIRAN.SAKIT]: "Sakit",
  [STATUS_KEHADIRAN.ALPA]: "Alpa",
  [STATUS_KEHADIRAN.TERLAMBAT]: "Terlambat",
});

export const LABEL_STATUS_VERIFIKASI = Object.freeze({
  [STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI]: "Menunggu Konfirmasi",
  [STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI]: "Dikonfirmasi",
});

// Satu Anggota hanya memiliki satu dokumen Absensi untuk satu sesi.
// ID deterministik ini mencegah duplicate submit saat tombol diklik berulang.
export function buatIdDokumenAbsensi(idSesi, idAnggota) {
  if (!idSesi || !idAnggota) return "";
  return `${String(idSesi)}__${String(idAnggota)}`;
}

export function normalisasiStatusKehadiran(value) {
  const status = String(value || "").trim().toLowerCase();

  return (
    {
      hadir: STATUS_KEHADIRAN.HADIR,
      present: STATUS_KEHADIRAN.HADIR,
      izin: STATUS_KEHADIRAN.IZIN,
      excused: STATUS_KEHADIRAN.IZIN,
      sakit: STATUS_KEHADIRAN.SAKIT,
      sick: STATUS_KEHADIRAN.SAKIT,
      alpa: STATUS_KEHADIRAN.ALPA,
      absent: STATUS_KEHADIRAN.ALPA,
      terlambat: STATUS_KEHADIRAN.TERLAMBAT,
      late: STATUS_KEHADIRAN.TERLAMBAT,
    }[status] || status || "-"
  );
}

export function normalisasiStatusVerifikasi(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI) {
    return STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI;
  }

  // Record lama yang belum memiliki field statusVerifikasi tetap dapat dibaca.
  // Pada cycle baru, record baru selalu memakai MENUNGGU_KONFIRMASI.
  return status || STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI;
}

export function buatPayloadAbsensi(perubahan = {}) {
  return {
    idSesi: null,
    idPelaksanaan: null,
    idKegiatan: null,
    idPeriode: null,
    idAnggota: null,
    statusKehadiran: null,
    alasan: null,
    dokumenPendukung: null,
    statusVerifikasi: STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI,
    waktuCheckIn: null,
    sumber: "anggota",
    diajukanPada: null,
    dikonfirmasiPada: null,
    dikonfirmasiOleh: null,
    dibuatPada: null,
    diperbaruiPada: null,
    ...perubahan,
  };
}

export function anggotaTerlibatDalamKegiatan(activity, memberId) {
  if (!activity || !memberId) return false;

  const peserta = Array.isArray(activity?.pesertaFinal?.idAnggota)
    ? activity.pesertaFinal.idAnggota
    : [];
  const panitia = Array.isArray(activity?.idAnggotaPanitia)
    ? activity.idAnggotaPanitia
    : [];

  return (
    peserta.includes(memberId) ||
    panitia.includes(memberId) ||
    activity?.idPenanggungJawab === memberId
  );
}
