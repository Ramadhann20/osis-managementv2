// Konfigurasi terpusat modul Manajemen Kegiatan Pembina.
// Semua nama collection, field Firestore, enum, draft, dan builder payload
// didefinisikan di sini supaya perubahan skema tidak tersebar di banyak file.

export const KOLEKSI = Object.freeze({
  KEGIATAN: "Kegiatan",
  PROPOSAL: "Proposal",
  ANGGOTA: "Anggota",
  DIVISI: "Divisi",
  PELAKSANAAN_KEGIATAN: "PelaksanaanKegiatan",
  SESI_ABSENSI: "SesiAbsensi",
});

export const FIELD = Object.freeze({
  KEGIATAN: Object.freeze({
    ID_REFERENSI: "idReferensi",
    NAMA: "namaKegiatan",
    DESKRIPSI: "deskripsi",
    JENIS: "jenisKegiatan",
    LOKASI: "lokasi",
    ID_PERIODE: "idPeriode",
    WAKTU_MULAI: "waktuMulai",
    WAKTU_SELESAI: "waktuSelesai",
    WAKTU_SELESAI_SERI: "waktuSelesaiSeri",
    JUMLAH_HARI_KALENDER: "jumlahHariKalender",
    JUMLAH_PELAKSANAAN: "jumlahPelaksanaan",
    JUMLAH_SESI_ABSENSI: "jumlahSesiAbsensi",
    DURASI_MENIT: "durasiMenit",
    JADWAL_RENCANA: "jadwalRencana",
    PENGULANGAN_RENCANA: "pengulanganRencana",
    JUMLAH_PELAKSANAAN_RENCANA: "jumlahPelaksanaanRencana",
    JUMLAH_SESI_ABSENSI_RENCANA: "jumlahSesiAbsensiRencana",
    JADWAL_FINAL: "jadwalFinal",
    PENGULANGAN_FINAL: "pengulanganFinal",
    STATUS_JADWAL: "statusJadwal",
    SUMBER_FINALISASI_JADWAL: "sumberFinalisasiJadwal",
    DIFINALISASI_PADA: "difinalisasiPada",
    ID_DIVISI: "idDivisi",
    ID_PENANGGUNG_JAWAB: "idPenanggungJawab",
    ID_ANGGOTA_PANITIA: "idAnggotaPanitia",
    ID_PROPOSAL: "idProposal",
    STATUS_PROPOSAL: "statusProposal",
    SNAPSHOT_JADWAL_PROPOSAL: "snapshotJadwalProposal",
    STATUS_TIM: "statusTim",
    STATUS: "status",
    STATUS_LAPORAN: "statusLaporan",
    URL_FILE_LAPORAN: "urlFileLaporan",
    JUMLAH_PESERTA: "jumlahPeserta",
    KAPASITAS_PESERTA: "kapasitasPeserta",
    DIBUAT_PADA: "dibuatPada",
    DIPERBARUI_PADA: "diperbaruiPada",
  }),

  PELAKSANAAN: Object.freeze({
    ID_KEGIATAN: "idKegiatan",
    ID_PERIODE: "idPeriode",
    INDEKS_PELAKSANAAN: "indeksPelaksanaan",
    TANGGAL_MULAI: "tanggalMulai",
    TANGGAL_SELESAI: "tanggalSelesai",
    WAKTU_MULAI: "waktuMulai",
    WAKTU_SELESAI: "waktuSelesai",
    JUMLAH_SESI: "jumlahSesi",
    STATUS: "status",
    DIBATALKAN_PADA: "dibatalkanPada",
    DIBUAT_PADA: "dibuatPada",
    DIPERBARUI_PADA: "diperbaruiPada",
  }),

  SESI_ABSENSI: Object.freeze({
    ID_KEGIATAN: "idKegiatan",
    ID_PELAKSANAAN: "idPelaksanaan",
    ID_PERIODE: "idPeriode",
    INDEKS_PELAKSANAAN: "indeksPelaksanaan",
    INDEKS_SESI: "indeksSesi",
    TANGGAL: "tanggal",
    WAKTU_MULAI: "waktuMulai",
    WAKTU_SELESAI: "waktuSelesai",
    DURASI_MENIT: "durasiMenit",
    STATUS: "status",
    DIBUAT_PADA: "dibuatPada",
    DIPERBARUI_PADA: "diperbaruiPada",
  }),

  PROPOSAL: Object.freeze({
    ID_KEGIATAN: "idKegiatan",
    ID_PENGUNGGAH: "idPengunggah",
    NAMA_KEGIATAN: "namaKegiatan",
    NAMA_FILE: "namaFile",
    UKURAN_FILE_BYTE: "ukuranFileByte",
    VERSI: "versi",
    STATUS: "status",
    DIAJUKAN_PADA: "diajukanPada",
    DIPERBARUI_PADA: "diperbaruiPada",
    JADWAL_USULAN: "jadwalUsulan",
    KEPANITIAAN_USULAN: "kepanitiaanUsulan",
  }),

  ANGGOTA: Object.freeze({
    NAMA_LENGKAP: "namaLengkap",
    NAMA: "nama",
    ID_DIVISI: "idDivisi",
    JABATAN_ORGANISASI: "jabatanOrganisasi",
    JABATAN: "jabatan",
    PERAN: "peran",
    STATUS_KEANGGOTAAN: "statusKeanggotaan",
    ID_PENGGUNA: "idPengguna",
    ID_AUTENTIKASI: "idAutentikasi",
  }),

  DIVISI: Object.freeze({
    KODE: "kode",
    NAMA_SINGKAT: "namaSingkat",
    NAMA: "nama",
  }),
});

export const JENIS_KEGIATAN = Object.freeze({
  PROGRAM_KERJA: "program_kerja",
  RAPAT: "rapat",
});

export const MODE_JADWAL = Object.freeze({
  SEKALI: "sekali",
  BERULANG: "berulang",
});

export const FREKUENSI_PENGULANGAN = Object.freeze({
  MINGGUAN: "mingguan",
});

export const STATUS_KEGIATAN = Object.freeze({
  DRAF: "draf",
  TERENCANA: "terencana",
  AKAN_DATANG: "akan_datang",
  BERLANGSUNG: "berlangsung",
  SELESAI: "selesai",
  DIBATALKAN: "dibatalkan",
});

export const STATUS_JADWAL = Object.freeze({
  DIRENCANAKAN: "direncanakan",
  DIFINALISASI: "difinalisasi",
});

export const SUMBER_FINALISASI_JADWAL = Object.freeze({
  RENCANA: "rencana",
  PROPOSAL: "proposal",
  MANUAL: "manual",
  LANGSUNG: "langsung",
});

export const STATUS_PROPOSAL = Object.freeze({
  DRAF: "draf",
  BELUM_DIAJUKAN: "belum_diajukan",
  DIAJUKAN: "diajukan",
  MENUNGGU_REVIEW: "menunggu_review",
  PERLU_REVISI: "perlu_revisi",
  DISETUJUI: "disetujui",
  DITOLAK: "ditolak",
});

export const STATUS_TIM = Object.freeze({
  BELUM_DIAJUKAN: "belum_diajukan",
  MENUNGGU_FINALISASI: "menunggu_finalisasi",
  DIFINALISASI_PEMBINA: "difinalisasi_pembina",
});

export const STATUS_PELAKSANAAN = Object.freeze({
  TERENCANA: "terencana",
  BERLANGSUNG: "berlangsung",
  SELESAI: "selesai",
  DIBATALKAN: "dibatalkan",
});

export const STATUS_SESI_ABSENSI = Object.freeze({
  TERJADWAL: "terjadwal",
  DIBUKA: "dibuka",
  DITUTUP: "ditutup",
  DIBATALKAN: "dibatalkan",
});

export const STATUS_LAPORAN = Object.freeze({
  BELUM_DIMULAI: "belum_dimulai",
  MENUNGGU: "menunggu",
  DIAJUKAN: "diajukan",
  SELESAI: "selesai",
});

export const STATUS_KEANGGOTAAN = Object.freeze({
  AKTIF: "aktif",
  NONAKTIF: "nonaktif",
  DITANGGUHKAN: "ditangguhkan",
});

export const MODE_KEPANITIAAN_USULAN = Object.freeze({
  DIUSULKAN: "diusulkan",
  DITENTUKAN_PEMBINA: "ditentukan_pembina",
  BELUM_DIATUR: "belum_diatur",
});

export const OPSI_STATUS_PROGRAM_KERJA = Object.freeze([
  [STATUS_KEGIATAN.TERENCANA, "Terencana"],
  [STATUS_KEGIATAN.AKAN_DATANG, "Akan Datang"],
  [STATUS_KEGIATAN.BERLANGSUNG, "Berlangsung"],
  [STATUS_KEGIATAN.SELESAI, "Selesai"],
  [STATUS_KEGIATAN.DIBATALKAN, "Dibatalkan"],
]);

export const OPSI_STATUS_RAPAT = Object.freeze([
  [STATUS_KEGIATAN.DRAF, "Draf"],
  [STATUS_KEGIATAN.AKAN_DATANG, "Terjadwal"],
  [STATUS_KEGIATAN.BERLANGSUNG, "Berlangsung"],
  [STATUS_KEGIATAN.SELESAI, "Selesai"],
  [STATUS_KEGIATAN.DIBATALKAN, "Dibatalkan"],
]);

export const OPSI_STATUS_PROPOSAL = Object.freeze([
  [STATUS_PROPOSAL.DRAF, "Draf"],
  [STATUS_PROPOSAL.MENUNGGU_REVIEW, "Menunggu Review"],
  [STATUS_PROPOSAL.PERLU_REVISI, "Perlu Revisi"],
  [STATUS_PROPOSAL.DISETUJUI, "Disetujui"],
  [STATUS_PROPOSAL.DITOLAK, "Ditolak"],
]);

export const OPSI_STATUS_LAPORAN = Object.freeze([
  [STATUS_LAPORAN.BELUM_DIMULAI, "Belum Dimulai"],
  [STATUS_LAPORAN.MENUNGGU, "Menunggu Laporan"],
  [STATUS_LAPORAN.DIAJUKAN, "Sudah Dikirim"],
  [STATUS_LAPORAN.SELESAI, "Selesai"],
]);

export const LABEL_STATUS = Object.freeze({
  kegiatan: Object.freeze({
    [STATUS_KEGIATAN.DRAF]: "Draf",
    [STATUS_KEGIATAN.TERENCANA]: "Terencana",
    [STATUS_KEGIATAN.AKAN_DATANG]: "Akan Datang",
    [STATUS_KEGIATAN.BERLANGSUNG]: "Berlangsung",
    [STATUS_KEGIATAN.SELESAI]: "Selesai",
    [STATUS_KEGIATAN.DIBATALKAN]: "Dibatalkan",
  }),
  proposal: Object.freeze({
    [STATUS_PROPOSAL.DRAF]: "Draf",
    [STATUS_PROPOSAL.BELUM_DIAJUKAN]: "Belum Diajukan",
    [STATUS_PROPOSAL.DIAJUKAN]: "Diajukan",
    [STATUS_PROPOSAL.MENUNGGU_REVIEW]: "Menunggu Review",
    [STATUS_PROPOSAL.PERLU_REVISI]: "Perlu Revisi",
    [STATUS_PROPOSAL.DISETUJUI]: "Disetujui",
    [STATUS_PROPOSAL.DITOLAK]: "Ditolak",
  }),
  laporan: Object.freeze({
    [STATUS_LAPORAN.BELUM_DIMULAI]: "Belum Dimulai",
    [STATUS_LAPORAN.MENUNGGU]: "Menunggu Laporan",
    [STATUS_LAPORAN.DIAJUKAN]: "Sudah Dikirim",
    [STATUS_LAPORAN.SELESAI]: "Selesai",
  }),
});


export const DRAF_FORM_SELEKSI_KEGIATAN = Object.freeze({
  title: "",
  description: "",
  divisionId: "",
  location: "",
  scheduleMode: "once",
  startDate: "",
  endDate: "",
  dailySchedules: {},
  recurrenceInterval: "1",
  recurrenceUntil: "",
  proposalId: "",
  finalScheduleSource: "planned",
  finalScheduleMode: "once",
  finalStartDate: "",
  finalEndDate: "",
  finalDailySchedules: {},
  finalRecurrenceInterval: "1",
  finalRecurrenceUntil: "",
  organiserMemberId: "",
  committeeMemberIds: [],
});

export function buatDrafFormSeleksiKegiatan() {
  return {
    ...DRAF_FORM_SELEKSI_KEGIATAN,
    dailySchedules: {},
    finalDailySchedules: {},
    committeeMemberIds: [],
  };
}

// ---------------------------------------------------------------------------
// Draft payload Firestore. Builder di bawah selalu membuat object baru agar
// array/object nested tidak berbagi reference antar submit.
// ---------------------------------------------------------------------------

export const DRAF_PAYLOAD_KEGIATAN = Object.freeze({
  idReferensi: null,
  namaKegiatan: "",
  deskripsi: "",
  jenisKegiatan: JENIS_KEGIATAN.PROGRAM_KERJA,
  lokasi: "",
  idPeriode: null,
  waktuMulai: null,
  waktuSelesai: null,
  waktuSelesaiSeri: null,
  jumlahHariKalender: 0,
  jumlahPelaksanaan: 0,
  jumlahSesiAbsensi: 0,
  durasiMenit: 0,
  jadwalRencana: null,
  pengulanganRencana: null,
  jumlahPelaksanaanRencana: null,
  jumlahSesiAbsensiRencana: null,
  jadwalFinal: null,
  pengulanganFinal: null,
  statusJadwal: STATUS_JADWAL.DIRENCANAKAN,
  sumberFinalisasiJadwal: null,
  difinalisasiPada: null,
  idDivisi: null,
  idPenanggungJawab: null,
  idAnggotaPanitia: [],
  idProposal: null,
  statusProposal: null,
  snapshotJadwalProposal: null,
  statusTim: null,
  status: STATUS_KEGIATAN.DRAF,
  statusLaporan: null,
  urlFileLaporan: null,
  jumlahPeserta: 0,
  kapasitasPeserta: null,
  dibuatPada: null,
  diperbaruiPada: null,
});

export const DRAF_PAYLOAD_PELAKSANAAN = Object.freeze({
  idKegiatan: null,
  idPeriode: null,
  indeksPelaksanaan: 0,
  tanggalMulai: "",
  tanggalSelesai: "",
  waktuMulai: null,
  waktuSelesai: null,
  jumlahSesi: 0,
  status: STATUS_PELAKSANAAN.TERENCANA,
  dibatalkanPada: null,
  dibuatPada: null,
  diperbaruiPada: null,
});

export const DRAF_PAYLOAD_SESI_ABSENSI = Object.freeze({
  idKegiatan: null,
  idPelaksanaan: null,
  idPeriode: null,
  indeksPelaksanaan: 0,
  indeksSesi: 0,
  tanggal: "",
  waktuMulai: null,
  waktuSelesai: null,
  durasiMenit: 0,
  status: STATUS_SESI_ABSENSI.TERJADWAL,
  dibuatPada: null,
  diperbaruiPada: null,
});

export function buatPayloadKegiatan(perubahan = {}) {
  return {
    ...DRAF_PAYLOAD_KEGIATAN,
    idAnggotaPanitia: [],
    ...perubahan,
  };
}

export function buatPayloadPelaksanaan(perubahan = {}) {
  return {
    ...DRAF_PAYLOAD_PELAKSANAAN,
    ...perubahan,
  };
}

export function buatPayloadSesiAbsensi(perubahan = {}) {
  return {
    ...DRAF_PAYLOAD_SESI_ABSENSI,
    ...perubahan,
  };
}

export function buatPayloadTautanProposal(idKegiatan, diperbaruiPada) {
  return {
    idKegiatan: idKegiatan || null,
    diperbaruiPada: diperbaruiPada || null,
  };
}
