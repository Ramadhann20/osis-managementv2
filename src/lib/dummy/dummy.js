/**
 * Dummy minimal Data Anggota — skema Indonesia + Firestore Auto ID.
 *
 * Prinsip:
 * - Tidak ada field id/ref buatan.
 * - Firestore document ID dibuat otomatis oleh addDoc().
 * - Metadata `divisi` hanya dipakai seeder untuk menentukan relasi idDivisi
 *   dan TIDAK disimpan ke collection Anggota.
 * - Jabatan sederhana: Ketua, Wakil, Sekretaris, Bendahara, Anggota.
 * - Sekbid dikenali dari nama divisinya, bukan nomor Romawi.
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
    nama: "Badan Pengurus Harian",
    namaSingkat: "Badan Pengurus Harian",
  },
  {
    kode: "IMTAQ",
    nama: "Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa",
    namaSingkat: "Keimanan dan Ketakwaan",
  },
  {
    kode: "BUDI",
    nama: "Budi Pekerti Luhur dan Akhlak Mulia",
    namaSingkat: "Budi Pekerti",
  },
  {
    kode: "BELA",
    nama: "Kepribadian Unggul, Wawasan Kebangsaan, dan Bela Negara",
    namaSingkat: "Bela Negara",
  },
  {
    kode: "PRESTASI",
    nama: "Prestasi Akademik, Seni, dan Olahraga",
    namaSingkat: "Akademik dan Prestasi",
  },
];

function anggota({
  divisi,
  namaLengkap,
  nis,
  namaKelas,
  jabatanOrganisasi,
  email,
  nomorTelepon,
  waktu,
}) {
  return {
    // Metadata seeder. Tidak ikut disimpan ke Firestore.
    divisi,

    data: {
      namaLengkap,
      nis,
      namaKelas,
      jabatanOrganisasi,
      statusKeanggotaan: STATUS_KEANGGOTAAN.AKTIF,
      email,
      nomorTelepon,
      bergabungPada: "2026-07-20T08:00:00+07:00",
      diajukanPada: waktu,
      ditinjauPada: "2026-07-18T10:00:00+07:00",
      dibuatPada: waktu,
      diperbaruiPada: "2026-08-08T20:00:00+07:00",
    },
  };
}

export const anggotaSeeder = [
  // =========================================================
  // BADAN PENGURUS HARIAN — satu orang per jabatan
  // =========================================================
  anggota({
    divisi: "Badan Pengurus Harian",
    namaLengkap: "Adit Pratama",
    nis: "242510001",
    namaKelas: "XI-1",
    jabatanOrganisasi: "Ketua",
    email: "adit.pratama@smamutiara2.sch.id",
    nomorTelepon: "6281210000001",
    waktu: "2026-07-15T09:00:00+07:00",
  }),
  anggota({
    divisi: "Badan Pengurus Harian",
    namaLengkap: "Nabila Putri Maharani",
    nis: "242510002",
    namaKelas: "XI-2",
    jabatanOrganisasi: "Wakil",
    email: "nabila.maharani@smamutiara2.sch.id",
    nomorTelepon: "6281210000002",
    waktu: "2026-07-15T09:05:00+07:00",
  }),
  anggota({
    divisi: "Badan Pengurus Harian",
    namaLengkap: "Alya Putri",
    nis: "242510003",
    namaKelas: "XI-3",
    jabatanOrganisasi: "Sekretaris",
    email: "alya.putri@smamutiara2.sch.id",
    nomorTelepon: "6281210000003",
    waktu: "2026-07-15T09:10:00+07:00",
  }),
  anggota({
    divisi: "Badan Pengurus Harian",
    namaLengkap: "Siska Amelia",
    nis: "242510004",
    namaKelas: "XI-4",
    jabatanOrganisasi: "Bendahara",
    email: "siska.amelia@smamutiara2.sch.id",
    nomorTelepon: "6281210000004",
    waktu: "2026-07-15T09:15:00+07:00",
  }),

  // =========================================================
  // KEIMANAN DAN KETAKWAAN
  // =========================================================
  anggota({
    divisi: "Keimanan dan Ketakwaan",
    namaLengkap: "Bagus Nurrahman",
    nis: "242510101",
    namaKelas: "XI-1",
    jabatanOrganisasi: "Ketua",
    email: "bagus.nurrahman@smamutiara2.sch.id",
    nomorTelepon: "6281210000101",
    waktu: "2026-07-15T10:00:00+07:00",
  }),
  anggota({
    divisi: "Keimanan dan Ketakwaan",
    namaLengkap: "Raka Maulana",
    nis: "242510105",
    namaKelas: "XI-5",
    jabatanOrganisasi: "Anggota",
    email: "raka.maulana@smamutiara2.sch.id",
    nomorTelepon: "6281210000105",
    waktu: "2026-07-15T10:20:00+07:00",
  }),
  anggota({
    divisi: "Keimanan dan Ketakwaan",
    namaLengkap: "Nisa Rahmawati",
    nis: "242510106",
    namaKelas: "XI-6",
    jabatanOrganisasi: "Anggota",
    email: "nisa.rahmawati@smamutiara2.sch.id",
    nomorTelepon: "6281210000106",
    waktu: "2026-07-15T10:25:00+07:00",
  }),

  // =========================================================
  // BUDI PEKERTI
  // =========================================================
  anggota({
    divisi: "Budi Pekerti",
    namaLengkap: "Daffa Arini Winda",
    nis: "242510102",
    namaKelas: "XI-2",
    jabatanOrganisasi: "Ketua",
    email: "daffa.arini@smamutiara2.sch.id",
    nomorTelepon: "6281210000102",
    waktu: "2026-07-15T10:05:00+07:00",
  }),
  anggota({
    divisi: "Budi Pekerti",
    namaLengkap: "Fikri Hidayat",
    nis: "242510107",
    namaKelas: "XI-7",
    jabatanOrganisasi: "Anggota",
    email: "fikri.hidayat@smamutiara2.sch.id",
    nomorTelepon: "6281210000107",
    waktu: "2026-07-15T10:30:00+07:00",
  }),
  anggota({
    divisi: "Budi Pekerti",
    namaLengkap: "Salsa Anindita",
    nis: "242510108",
    namaKelas: "XI-8",
    jabatanOrganisasi: "Anggota",
    email: "salsa.anindita@smamutiara2.sch.id",
    nomorTelepon: "6281210000108",
    waktu: "2026-07-15T10:35:00+07:00",
  }),

  // =========================================================
  // BELA NEGARA
  // =========================================================
  anggota({
    divisi: "Bela Negara",
    namaLengkap: "Irfan Zea Kalisa",
    nis: "242510103",
    namaKelas: "XI-3",
    jabatanOrganisasi: "Ketua",
    email: "irfan.zea@smamutiara2.sch.id",
    nomorTelepon: "6281210000103",
    waktu: "2026-07-15T10:10:00+07:00",
  }),
  anggota({
    divisi: "Bela Negara",
    namaLengkap: "Dimas Saputra",
    nis: "242510109",
    namaKelas: "XI-9",
    jabatanOrganisasi: "Anggota",
    email: "dimas.saputra@smamutiara2.sch.id",
    nomorTelepon: "6281210000109",
    waktu: "2026-07-15T10:40:00+07:00",
  }),
  anggota({
    divisi: "Bela Negara",
    namaLengkap: "Putri Lestari",
    nis: "242510110",
    namaKelas: "XI-10",
    jabatanOrganisasi: "Anggota",
    email: "putri.lestari@smamutiara2.sch.id",
    nomorTelepon: "6281210000110",
    waktu: "2026-07-15T10:45:00+07:00",
  }),

  // =========================================================
  // AKADEMIK DAN PRESTASI
  // =========================================================
  anggota({
    divisi: "Akademik dan Prestasi",
    namaLengkap: "Rendra Anggila Alfiya",
    nis: "242510104",
    namaKelas: "XI-4",
    jabatanOrganisasi: "Ketua",
    email: "rendra.anggila@smamutiara2.sch.id",
    nomorTelepon: "6281210000104",
    waktu: "2026-07-15T10:15:00+07:00",
  }),
  anggota({
    divisi: "Akademik dan Prestasi",
    namaLengkap: "Kevin Ramadhan",
    nis: "242510111",
    namaKelas: "XI-11",
    jabatanOrganisasi: "Anggota",
    email: "kevin.ramadhan@smamutiara2.sch.id",
    nomorTelepon: "6281210000111",
    waktu: "2026-07-15T10:50:00+07:00",
  }),
  anggota({
    divisi: "Akademik dan Prestasi",
    namaLengkap: "Maya Puspita",
    nis: "242510112",
    namaKelas: "XI-12",
    jabatanOrganisasi: "Anggota",
    email: "maya.puspita@smamutiara2.sch.id",
    nomorTelepon: "6281210000112",
    waktu: "2026-07-15T10:55:00+07:00",
  }),
];
