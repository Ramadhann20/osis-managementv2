// Konfigurasi terpusat untuk modul Absensi.
// File ini dipakai bersama oleh halaman Pembina dan Anggota agar nilai status
// Firestore tidak berbeda-beda antar role.

export const KOLEKSI_ABSENSI = Object.freeze({
  ABSENSI: "Absensi",
  RINGKASAN_ABSENSI: "RingkasanAbsensi",
  KEGIATAN: "Kegiatan",
  PELAKSANAAN_KEGIATAN: "PelaksanaanKegiatan",
  SESI_ABSENSI: "SesiAbsensi",
  ANGGOTA: "Anggota",
  DIVISI: "Divisi",
});

export const STATUS_KEHADIRAN = Object.freeze({
  HADIR: "hadir",
  IZIN: "izin",
  SAKIT: "sakit",
  ALPA: "alpa",
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

export const STATUS_KEGIATAN_ABSENSI = Object.freeze({
  TERENCANA: "terencana",
  AKAN_DATANG: "akan_datang",
  BERLANGSUNG: "berlangsung",
  SELESAI: "selesai",
  DIBATALKAN: "dibatalkan",
});

export const OPSI_STATUS_KEHADIRAN = Object.freeze([
  [STATUS_KEHADIRAN.HADIR, "Hadir"],
  [STATUS_KEHADIRAN.IZIN, "Izin"],
  [STATUS_KEHADIRAN.SAKIT, "Sakit"],
  [STATUS_KEHADIRAN.ALPA, "Alpa"],
]);

export function labelStatusKehadiran(status) {
  return (
    {
      [STATUS_KEHADIRAN.HADIR]: "Hadir",
      [STATUS_KEHADIRAN.IZIN]: "Izin",
      [STATUS_KEHADIRAN.SAKIT]: "Sakit",
      [STATUS_KEHADIRAN.ALPA]: "Alpa",
    }[status] || status || "Belum Absen"
  );
}

export function labelStatusVerifikasi(status) {
  return status === STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
    ? "Dikonfirmasi"
    : "Menunggu Konfirmasi";
}

export function idAbsensiUntukSesi(idSesi, idAnggota) {
  return `${idSesi}__${idAnggota}`;
}
