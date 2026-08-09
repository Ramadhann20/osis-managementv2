/**
 * Dummy minimal untuk Seeder Data Anggota.
 *
 * PENTING:
 * - Tidak ada field `id`.
 * - Tidak ada `ref`, alias, atau ID dummy buatan.
 * - Firestore document ID selalu dibuat otomatis oleh addDoc().
 * - idPeriode dan idDivisi tidak ditulis di dummy; seeder mengisinya
 *   menggunakan Auto ID Firestore yang benar pada saat proses seed.
 */

export const STATUS_KEANGGOTAAN = Object.freeze({
  AKTIF: "aktif",
  NONAKTIF: "nonaktif",
  DITANGGUHKAN: "ditangguhkan",
  MENUNGGU_REVIEW: "menunggu_review",
  DITOLAK: "ditolak",
});

export const periodeSeeder = [
  {
    namaPeriode: "2026/2027",
    tanggalMulai: "2026-07-13",
    tanggalSelesai: "2027-06-25",
    aktif: true,
  },
];

export const divisiSeeder = [
  {
    kode: "BPH",
    nama: "Badan Pengurus Harian OSIS",
    namaSingkat: "Badan Pengurus",
  },
  {
    kode: "I",
    nama: "Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa",
    namaSingkat: "Keimanan dan Ketakwaan",
  },
  {
    kode: "II",
    nama: "Budi Pekerti Luhur dan Akhlak Mulia",
    namaSingkat: "Budi Pekerti",
  },
  {
    kode: "III",
    nama: "Kepribadian Unggul, Wawasan Kebangsaan, dan Bela Negara",
    namaSingkat: "Bela Negara",
  },
  {
    kode: "IV",
    nama: "Prestasi Akademik, Seni, dan Olahraga",
    namaSingkat: "Akademik dan Prestasi",
  },
];

export const anggotaSeeder = [
  // =========================================================
  // BADAN PENGURUS HARIAN
  // =========================================================
  {
    namaLengkap: "Adit Pratama",
    nis: "242510001",
    namaKelas: "XI-1",
    jabatanOrganisasi: "Ketua OSIS",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "adit.pratama@smamutiara2.sch.id",
    nomorTelepon: "6281210000001",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:00:00+07:00",
    ditinjauPada: "2026-07-18T10:00:00+07:00",
    dibuatPada: "2026-07-15T09:00:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Nabila Putri Maharani",
    nis: "242510002",
    namaKelas: "XI-2",
    jabatanOrganisasi: "Wakil Ketua I",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "nabila.maharani@smamutiara2.sch.id",
    nomorTelepon: "6281210000002",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:05:00+07:00",
    ditinjauPada: "2026-07-18T10:05:00+07:00",
    dibuatPada: "2026-07-15T09:05:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Fajar Ramadhan",
    nis: "242510003",
    namaKelas: "XI-3",
    jabatanOrganisasi: "Wakil Ketua II",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "fajar.ramadhan@smamutiara2.sch.id",
    nomorTelepon: "6281210000003",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:10:00+07:00",
    ditinjauPada: "2026-07-18T10:10:00+07:00",
    dibuatPada: "2026-07-15T09:10:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Alya Putri",
    nis: "242510004",
    namaKelas: "XI-4",
    jabatanOrganisasi: "Sekretaris I",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "alya.putri@smamutiara2.sch.id",
    nomorTelepon: "6281210000004",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:15:00+07:00",
    ditinjauPada: "2026-07-18T10:15:00+07:00",
    dibuatPada: "2026-07-15T09:15:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Citra Maharani",
    nis: "242510005",
    namaKelas: "XI-5",
    jabatanOrganisasi: "Sekretaris II",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "citra.maharani@smamutiara2.sch.id",
    nomorTelepon: "6281210000005",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:20:00+07:00",
    ditinjauPada: "2026-07-18T10:20:00+07:00",
    dibuatPada: "2026-07-15T09:20:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Siska Amelia",
    nis: "242510006",
    namaKelas: "XI-6",
    jabatanOrganisasi: "Bendahara I",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "siska.amelia@smamutiara2.sch.id",
    nomorTelepon: "6281210000006",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:25:00+07:00",
    ditinjauPada: "2026-07-18T10:25:00+07:00",
    dibuatPada: "2026-07-15T09:25:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Zahra Aulia",
    nis: "242510007",
    namaKelas: "XI-7",
    jabatanOrganisasi: "Bendahara II",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "zahra.aulia@smamutiara2.sch.id",
    nomorTelepon: "6281210000007",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T09:30:00+07:00",
    ditinjauPada: "2026-07-18T10:30:00+07:00",
    dibuatPada: "2026-07-15T09:30:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },

  // =========================================================
  // BEBERAPA KETUA SEKBID
  // =========================================================
  {
    namaLengkap: "Bagus Nurrahman",
    nis: "242510101",
    namaKelas: "XI-1",
    jabatanOrganisasi: "Ketua Sekbid I",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "bagus.nurrahman@smamutiara2.sch.id",
    nomorTelepon: "6281210000101",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T10:00:00+07:00",
    ditinjauPada: "2026-07-18T11:00:00+07:00",
    dibuatPada: "2026-07-15T10:00:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Daffa Arini Winda",
    nis: "242510102",
    namaKelas: "XI-2",
    jabatanOrganisasi: "Ketua Sekbid II",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "daffa.arini@smamutiara2.sch.id",
    nomorTelepon: "6281210000102",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T10:05:00+07:00",
    ditinjauPada: "2026-07-18T11:05:00+07:00",
    dibuatPada: "2026-07-15T10:05:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Irfan Zea Kalisa",
    nis: "242510103",
    namaKelas: "XI-3",
    jabatanOrganisasi: "Ketua Sekbid III",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "irfan.zea@smamutiara2.sch.id",
    nomorTelepon: "6281210000103",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T10:10:00+07:00",
    ditinjauPada: "2026-07-18T11:10:00+07:00",
    dibuatPada: "2026-07-15T10:10:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
  {
    namaLengkap: "Rendra Anggila Alfiya",
    nis: "242510104",
    namaKelas: "XI-4",
    jabatanOrganisasi: "Ketua Sekbid IV",
    statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
    email: "rendra.anggila@smamutiara2.sch.id",
    nomorTelepon: "6281210000104",
    bergabungPada: "2026-07-20T08:00:00+07:00",
    diajukanPada: "2026-07-15T10:15:00+07:00",
    ditinjauPada: "2026-07-18T11:15:00+07:00",
    dibuatPada: "2026-07-15T10:15:00+07:00",
    diperbaruiPada: "2026-07-20T08:00:00+07:00",
  },
];
