// Konfigurasi terpusat modul Data Anggota Pembina.
// Nama collection, field Firestore, enum status, draft, dan builder payload
// disimpan di sini supaya refactor skema tidak tersebar ke banyak komponen.

export const KOLEKSI = Object.freeze({
  ANGGOTA: "Anggota",
  DIVISI: "Divisi",
  PERIODE: "Periode",
  RINGKASAN_ABSENSI: "RingkasanAbsensi",
});

export const FIELD = Object.freeze({
  ANGGOTA: Object.freeze({
    NAMA_LENGKAP: "namaLengkap",
    NIS: "nis",
    NAMA_KELAS: "namaKelas",
    JABATAN_ORGANISASI: "jabatanOrganisasi",
    ID_DIVISI: "idDivisi",
    ID_PERIODE: "idPeriode",
    STATUS_KEANGGOTAAN: "statusKeanggotaan",
    EMAIL: "email",
    NOMOR_TELEPON: "nomorTelepon",
    BERGABUNG_PADA: "bergabungPada",
    DIAJUKAN_PADA: "diajukanPada",
    DITINJAU_PADA: "ditinjauPada",
    DIBUAT_PADA: "dibuatPada",
    DIPERBARUI_PADA: "diperbaruiPada",
  }),

  DIVISI: Object.freeze({
    KODE: "kode",
    NAMA_SINGKAT: "namaSingkat",
    NAMA: "nama",
  }),

  PERIODE: Object.freeze({
    NAMA: "namaPeriode",
  }),

  RINGKASAN_ABSENSI: Object.freeze({
    ID_ANGGOTA: "idAnggota",
    PERSENTASE_KEHADIRAN: "persentaseKehadiran",
    JUMLAH_KEGIATAN: "jumlahKegiatan",
  }),
});

export const STATUS_KEANGGOTAAN = Object.freeze({
  MENUNGGU_REVIEW: "menunggu_review",
  AKTIF: "aktif",
  NONAKTIF: "nonaktif",
  DITANGGUHKAN: "ditangguhkan",
  DITOLAK: "ditolak",
});

export const STATUS_RESMI_ANGGOTA = Object.freeze([
  STATUS_KEANGGOTAAN.AKTIF,
  STATUS_KEANGGOTAAN.NONAKTIF,
  STATUS_KEANGGOTAAN.DITANGGUHKAN,
]);

export const OPSI_STATUS_ANGGOTA = Object.freeze([
  {
    value: STATUS_KEANGGOTAAN.AKTIF,
    label: "Aktif",
    description: "Anggota aktif dan tercatat sebagai pengurus periode berjalan.",
    icon: "verified_user",
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
  {
    value: STATUS_KEANGGOTAAN.NONAKTIF,
    label: "Tidak Aktif",
    description: "Anggota tetap tersimpan, tetapi tidak sedang aktif sebagai pengurus.",
    icon: "person",
    iconClassName: "bg-slate-100 text-slate-700",
  },
  {
    value: STATUS_KEANGGOTAAN.DITANGGUHKAN,
    label: "Ditangguhkan",
    description: "Keanggotaan ditangguhkan sementara sampai ada keputusan berikutnya.",
    icon: "block",
    iconClassName: "bg-orange-50 text-orange-700",
  },
]);

export const LABEL_STATUS_KEANGGOTAAN = Object.freeze({
  [STATUS_KEANGGOTAAN.MENUNGGU_REVIEW]: "Menunggu Review",
  [STATUS_KEANGGOTAAN.AKTIF]: "Aktif",
  [STATUS_KEANGGOTAAN.NONAKTIF]: "Tidak Aktif",
  [STATUS_KEANGGOTAAN.DITANGGUHKAN]: "Ditangguhkan",
  [STATUS_KEANGGOTAAN.DITOLAK]: "Ditolak",
});

// Draft entity untuk dokumentasi skema dan kebutuhan form berikutnya.
export const DRAF_ANGGOTA = Object.freeze({
  namaLengkap: "",
  nis: "",
  namaKelas: "",
  jabatanOrganisasi: "Anggota",
  idDivisi: null,
  idPeriode: null,
  statusKeanggotaan: STATUS_KEANGGOTAAN.MENUNGGU_REVIEW,
  email: "",
  nomorTelepon: "",
  bergabungPada: null,
  diajukanPada: null,
  ditinjauPada: null,
  dibuatPada: null,
  diperbaruiPada: null,
});

export const DRAF_PAYLOAD_REVIEW_ANGGOTA = Object.freeze({
  statusKeanggotaan: STATUS_KEANGGOTAAN.MENUNGGU_REVIEW,
  ditinjauPada: null,
  bergabungPada: null,
  diperbaruiPada: null,
});

export const DRAF_PAYLOAD_STATUS_ANGGOTA = Object.freeze({
  statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
  diperbaruiPada: null,
});

export function buatPayloadReviewAnggota({
  statusKeanggotaan,
  waktu,
  isiBergabungPada = false,
} = {}) {
  return {
    [FIELD.ANGGOTA.STATUS_KEANGGOTAAN]: statusKeanggotaan,
    [FIELD.ANGGOTA.DITINJAU_PADA]: waktu,
    [FIELD.ANGGOTA.DIPERBARUI_PADA]: waktu,
    ...(isiBergabungPada
      ? { [FIELD.ANGGOTA.BERGABUNG_PADA]: waktu }
      : {}),
  };
}

export function buatPayloadStatusAnggota({
  statusKeanggotaan,
  waktu,
} = {}) {
  return {
    [FIELD.ANGGOTA.STATUS_KEANGGOTAAN]: statusKeanggotaan,
    [FIELD.ANGGOTA.DIPERBARUI_PADA]: waktu,
  };
}
