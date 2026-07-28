/**
 * Dummy data SIM OSIS SMA Mutiara 2
 *
 * Tujuan:
 * 1. Menyediakan data untuk seluruh halaman anggota dan pembina.
 * 2. Menjaga relasi data melalui ID.
 * 3. Memudahkan penggantian ke Firebase Firestore.
 *
 * Catatan:
 * - Semua tanggal memakai ISO 8601.
 * - Jangan menyimpan format tampilan seperti "24 Mei 2024" ke database.
 * - Format tanggal, waktu, dan nomor WhatsApp dilakukan di komponen UI.
 */

/* =========================================================
   ENUMS
========================================================= */

export const ROLES = {
  ANGGOTA: "anggota",
  PEMBINA: "pembina",
};

export const MEMBERSHIP_STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  LATE: "late",
  EXCUSED: "excused",
  SICK: "sick",
  ABSENT: "absent",
};

export const ACTIVITY_STATUS = {
  DRAFT: "draft",
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PROPOSAL_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  REVISION_REQUIRED: "revision_required",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const ANNOUNCEMENT_CATEGORY = {
  INTERNAL: "internal",
  GENERAL: "general",
  IMPORTANT: "important",
  COMPETITION: "competition",
};

export const ANNOUNCEMENT_PRIORITY = {
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

export const ATTENDANCE_SESSION_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
};

export const REGISTRATION_REVIEW_ACTION = {
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  REOPENED: "reopened",
};

export const ANNOUNCEMENT_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

/* =========================================================
   CURRENT SESSION
========================================================= */

export const currentSession = {
  userId: "user-anggota-001",
  memberId: "member-001",
  role: ROLES.ANGGOTA,
};

/* =========================================================
   USERS COLLECTION
   Firestore path: Users/{uid}
========================================================= */

export const users = [
  {
    id: "user-anggota-001",
    uid: "user-anggota-001",
    email: "bagus.nurrahman@smamutiara2.sch.id",
    username: "bagusnurrahman",
    role: ROLES.ANGGOTA,
    photoURL: "/images/dummy/bagus-nurrahman.jpg",
    isActive: true,
    createdAt: "2022-10-15T08:00:00+07:00",
    updatedAt: "2024-10-15T10:00:00+07:00",
  },
  {
    id: "user-pembina-001",
    uid: "user-pembina-001",
    email: "lia.amalia@smamutiara2.sch.id",
    username: "liaamalia",
    role: ROLES.PEMBINA,
    photoURL: "/images/dummy/lia-amalia.jpg",
    isActive: true,
    createdAt: "2022-07-01T08:00:00+07:00",
    updatedAt: "2024-10-15T08:30:00+07:00",
  },
  {
    id: "user-pending-001",
    uid: "user-pending-001",
    email: "rizky.maulana@smamutiara2.sch.id",
    username: "rizkymaulana",
    role: null,
    photoURL: null,
    isActive: true,
    createdAt: "2024-10-14T09:15:00+07:00",
    updatedAt: "2024-10-14T09:30:00+07:00",
  },
  {
    id: "user-pending-002",
    uid: "user-pending-002",
    email: "nabila.salsabila@smamutiara2.sch.id",
    username: "nabilasalsabila",
    role: null,
    photoURL: null,
    isActive: true,
    createdAt: "2024-10-15T07:45:00+07:00",
    updatedAt: "2024-10-15T08:05:00+07:00",
  },
  {
    id: "user-rejected-001",
    uid: "user-rejected-001",
    email: "fajar.ramadhan@smamutiara2.sch.id",
    username: "fajarramadhan",
    role: null,
    photoURL: null,
    isActive: true,
    createdAt: "2024-10-10T08:00:00+07:00",
    updatedAt: "2024-10-13T13:15:00+07:00",
  },
];

/* =========================================================
   ORGANISATION MASTER DATA
========================================================= */

export const organisation = {
  id: "osis-sma-mutiara-2",
  name: "OSIS SMA Mutiara 2",
  schoolName: "SMA Mutiara 2 Bandung",
  activePeriod: "2024/2025",
  academicYear: "2024/2025",
  address:
    "Jl. Raya Cibeureum No. 10, Campaka, Andir, Kota Bandung, Jawa Barat",
  email: "osis@smamutiara2.sch.id",
  phone: "0226000000",
};

export const academicPeriods = [
  {
    id: "period-2023-2024",
    label: "2023/2024",
    startDate: "2023-07-17",
    endDate: "2024-06-21",
    isActive: false,
  },
  {
    id: "period-2024-2025",
    label: "2024/2025",
    startDate: "2024-07-15",
    endDate: "2025-06-20",
    isActive: true,
  },
];

export const divisions = [
  {
    id: "sekbid-01",
    code: "I",
    name: "Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa",
    shortName: "Keimanan dan Ketakwaan",
    coordinatorMemberId: "member-001",
    isActive: true,
  },
  {
    id: "sekbid-02",
    code: "II",
    name: "Budi Pekerti Luhur dan Akhlak Mulia",
    shortName: "Budi Pekerti",
    coordinatorMemberId: "member-002",
    isActive: true,
  },
  {
    id: "sekbid-03",
    code: "III",
    name: "Kepribadian Unggul, Wawasan Kebangsaan, dan Bela Negara",
    shortName: "Bela Negara",
    coordinatorMemberId: "member-003",
    isActive: true,
  },
  {
    id: "sekbid-04",
    code: "IV",
    name: "Prestasi Akademik, Seni, dan Olahraga",
    shortName: "Akademik dan Prestasi",
    coordinatorMemberId: "member-004",
    isActive: true,
  },
  {
    id: "sekbid-05",
    code: "V",
    name: "Demokrasi, Hak Asasi Manusia, dan Pendidikan Politik",
    shortName: "Demokrasi dan Kepemimpinan",
    coordinatorMemberId: "member-005",
    isActive: true,
  },
  {
    id: "sekbid-06",
    code: "VI",
    name: "Kreativitas, Keterampilan, dan Kewirausahaan",
    shortName: "Kreativitas dan Kewirausahaan",
    coordinatorMemberId: "member-006",
    isActive: true,
  },
  {
    id: "sekbid-07",
    code: "VII",
    name: "Kualitas Jasmani, Kesehatan, dan Gizi",
    shortName: "Kesehatan dan Olahraga",
    coordinatorMemberId: "member-007",
    isActive: true,
  },
  {
    id: "sekbid-08",
    code: "VIII",
    name: "Sastra dan Budaya",
    shortName: "Sastra dan Budaya",
    coordinatorMemberId: "member-008",
    isActive: true,
  },
  {
    id: "sekbid-09",
    code: "IX",
    name: "Teknologi Informasi dan Komunikasi",
    shortName: "Teknologi Informasi",
    coordinatorMemberId: "member-009",
    isActive: true,
  },
];

/* =========================================================
   ANGGOTA COLLECTION
   Firestore path: Anggota/{memberId atau uid}
========================================================= */

export const members = [
  {
    id: "member-001",
    userId: "user-anggota-001",

    fullName: "Bagus Nurrahman",
    nis: "212210456",
    className: "XII MIPA 4",
    placeOfBirth: "Bandung",
    dateOfBirth: "2006-05-14",
    gender: "male",
    religion: "Islam",
    bloodType: "O",
    address:
      "Jl. Batununggal Indah No. 45, Kec. Bandung Kidul, Kota Bandung, Jawa Barat 40266",

    email: "bagus.nurrahman@smamutiara2.sch.id",
    whatsapp: "6281234567890",

    divisionId: "sekbid-01",
    organisationPosition: "Ketua Sekbid I",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",

    reviewedBy: "user-pembina-001",
    reviewedAt: "2022-10-14T14:00:00+07:00",
    reviewNote: "Data lengkap dan pendaftaran disetujui.",

    achievements: [
      {
        id: "achievement-001",
        title: 'Koordinator Utama Program "Ramadhan di Sekolah 2023"',
        type: "responsibility",
        year: 2023,
      },
      {
        id: "achievement-002",
        title: 'Inisiator Program "Jumat Berkah Mutiara"',
        type: "initiative",
        year: 2023,
      },
      {
        id: "achievement-003",
        title: "Anggota Terbaik Sekbid I Triwulan Pertama",
        type: "award",
        year: 2024,
      },
    ],

    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-15T10:00:00+07:00",
  },

  {
    id: "member-002",
    userId: "user-anggota-002",
    fullName: "Daffa Arini Winda",
    nis: "212210457",
    className: "XII IPS 1",
    gender: "female",
    email: "daffa.arini@smamutiara2.sch.id",
    whatsapp: "6281311112222",
    divisionId: "sekbid-02",
    organisationPosition: "Ketua Sekbid II",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },

  {
    id: "member-003",
    userId: "user-anggota-003",
    fullName: "Irfan Zea Kalisa",
    nis: "212210458",
    className: "XII MIPA 2",
    gender: "male",
    email: "irfan.zea@smamutiara2.sch.id",
    whatsapp: "6281333334444",
    divisionId: "sekbid-03",
    organisationPosition: "Ketua Sekbid III",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-004",
    userId: "user-anggota-004",
    fullName: "Rendra Anggila Alfiya",
    nis: "212210459",
    className: "XII MIPA 3",
    gender: "male",
    email: "rendra.anggila@smamutiara2.sch.id",
    whatsapp: "6281444445555",
    divisionId: "sekbid-04",
    organisationPosition: "Ketua Sekbid IV",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-005",
    userId: "user-anggota-005",
    fullName: "Bagas Surya",
    nis: "212210460",
    className: "XII IPS 2",
    gender: "male",
    email: "bagas.surya@smamutiara2.sch.id",
    whatsapp: "6281555556666",
    divisionId: "sekbid-05",
    organisationPosition: "Ketua Sekbid V",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-006",
    userId: "user-anggota-006",
    fullName: "Ririn Aghnia Sayyidah",
    nis: "212210461",
    className: "XI MIPA 1",
    gender: "female",
    email: "ririn.aghnia@smamutiara2.sch.id",
    whatsapp: "6281666667777",
    divisionId: "sekbid-06",
    organisationPosition: "Ketua Sekbid VI",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2023-10-15T08:00:00+07:00",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-007",
    userId: "user-anggota-007",
    fullName: "Aska Elfira",
    nis: "212210462",
    className: "XI MIPA 2",
    gender: "female",
    email: "aska.elfira@smamutiara2.sch.id",
    whatsapp: "6281777778888",
    divisionId: "sekbid-07",
    organisationPosition: "Ketua Sekbid VII",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2023-10-15T08:00:00+07:00",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-008",
    userId: "user-anggota-008",
    fullName: "Levin Nazwa Rosfira",
    nis: "212210463",
    className: "XI IPS 1",
    gender: "female",
    email: "levin.nazwa@smamutiara2.sch.id",
    whatsapp: "6281888889999",
    divisionId: "sekbid-08",
    organisationPosition: "Ketua Sekbid VIII",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2023-10-15T08:00:00+07:00",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-009",
    userId: "user-anggota-009",
    fullName: "Sita Dara",
    nis: "212210464",
    className: "XI MIPA 3",
    gender: "female",
    email: "sita.dara@smamutiara2.sch.id",
    whatsapp: "6281999990000",
    divisionId: "sekbid-09",
    organisationPosition: "Ketua Sekbid IX",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2023-10-15T08:00:00+07:00",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-secretary-001",
    userId: "user-secretary-001",
    fullName: "Alya Putri",
    nis: "212210465",
    className: "XII MIPA 1",
    gender: "female",
    email: "alya.putri@smamutiara2.sch.id",
    whatsapp: "6281212345678",
    divisionId: null,
    organisationPosition: "Sekretaris Umum",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-treasurer-001",
    userId: "user-treasurer-001",
    fullName: "Siska Amelia",
    nis: "212210466",
    className: "XII IPS 1",
    gender: "female",
    email: "siska.amelia@smamutiara2.sch.id",
    whatsapp: "6281223456789",
    divisionId: null,
    organisationPosition: "Bendahara Umum",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },
  {
    id: "member-public-relation-001",
    userId: "user-public-relation-001",
    fullName: "Deni Wijaya",
    nis: "212210467",
    className: "XI IPS 2",
    gender: "male",
    email: "deni.wijaya@smamutiara2.sch.id",
    whatsapp: "6281234567891",
    divisionId: null,
    organisationPosition: "Hubungan Masyarakat",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
    joinedAt: "2023-10-15T08:00:00+07:00",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-10T08:00:00+07:00",
  },

  {
    id: "member-pending-001",
    userId: "user-pending-001",
    uid: "user-pending-001",
    fullName: "Rizky Maulana",
    nis: "232310188",
    className: "X MIPA 2",
    placeOfBirth: "Bandung",
    dateOfBirth: "2008-03-11",
    gender: "male",
    religion: "Islam",
    bloodType: "A",
    address: "Jl. Sukajadi No. 21, Kota Bandung",
    email: "rizky.maulana@smamutiara2.sch.id",
    whatsapp: "6281222223333",
    divisionId: "sekbid-09",
    divisionInterest: "sekbid-09",
    motivation:
      "Saya ingin membantu pengembangan sistem informasi dan dokumentasi digital OSIS.",
    organizationExperience: "Panitia dokumentasi kegiatan kelas.",
    organisationPosition: null,
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.PENDING_REVIEW,
    joinedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    resubmissionCount: 0,
    submittedAt: "2024-10-14T09:30:00+07:00",
    createdAt: "2024-10-14T09:30:00+07:00",
    updatedAt: "2024-10-14T09:30:00+07:00",
  },
  {
    id: "member-pending-002",
    userId: "user-pending-002",
    uid: "user-pending-002",
    fullName: "Nabila Salsabila",
    nis: "232310189",
    className: "X IPS 1",
    placeOfBirth: "Cimahi",
    dateOfBirth: "2008-07-19",
    gender: "female",
    religion: "Islam",
    bloodType: "B",
    address: "Jl. Cibaduyut Raya No. 18, Kota Bandung",
    email: "nabila.salsabila@smamutiara2.sch.id",
    whatsapp: "6281233334444",
    divisionId: "sekbid-08",
    divisionInterest: "sekbid-08",
    motivation:
      "Saya tertarik mengembangkan kegiatan sastra dan budaya agar lebih aktif di sekolah.",
    organizationExperience: "Anggota panitia pentas seni SMP.",
    organisationPosition: null,
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.PENDING_REVIEW,
    joinedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    resubmissionCount: 0,
    submittedAt: "2024-10-15T08:05:00+07:00",
    createdAt: "2024-10-15T08:05:00+07:00",
    updatedAt: "2024-10-15T08:05:00+07:00",
  },
  {
    id: "member-rejected-001",
    userId: "user-rejected-001",
    uid: "user-rejected-001",
    fullName: "Fajar Ramadhan",
    nis: "232310190",
    className: "X MIPA 3",
    placeOfBirth: "Bandung",
    dateOfBirth: "2008-01-09",
    gender: "male",
    religion: "Islam",
    bloodType: "O",
    address: "Jl. Kopo Permai No. 5, Kabupaten Bandung",
    email: "fajar.ramadhan@smamutiara2.sch.id",
    whatsapp: "6281244445555",
    divisionId: "sekbid-07",
    divisionInterest: "sekbid-07",
    motivation: "Saya ingin aktif dalam kegiatan kesehatan dan olahraga.",
    organizationExperience: null,
    organisationPosition: null,
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.REJECTED,
    joinedAt: null,
    reviewedBy: "user-pembina-001",
    reviewedAt: "2024-10-13T13:15:00+07:00",
    reviewNote:
      "Alamat dan nomor WhatsApp belum dapat diverifikasi. Silakan perbaiki lalu daftar ulang.",
    resubmissionCount: 0,
    submittedAt: "2024-10-10T08:20:00+07:00",
    createdAt: "2024-10-10T08:20:00+07:00",
    updatedAt: "2024-10-13T13:15:00+07:00",
  },
  {
    id: "member-inactive-001",
    userId: "user-inactive-001",
    fullName: "Naufal Akbar",
    nis: "202010121",
    className: "Alumni",
    gender: "male",
    email: "naufal.akbar@alumni.smamutiara2.sch.id",
    whatsapp: "6281255556666",
    divisionId: "sekbid-05",
    organisationPosition: "Mantan Ketua Sekbid V",
    period: "2023/2024",
    membershipStatus: MEMBERSHIP_STATUS.INACTIVE,
    joinedAt: "2022-10-15T08:00:00+07:00",
    inactiveAt: "2024-06-21T15:00:00+07:00",
    inactiveReason: "Masa kepengurusan selesai.",
    createdAt: "2022-10-10T08:00:00+07:00",
    updatedAt: "2024-06-21T15:00:00+07:00",
  },
  {
    id: "member-suspended-001",
    userId: "user-suspended-001",
    fullName: "Raka Permana",
    nis: "222210300",
    className: "XI IPS 2",
    gender: "male",
    email: "raka.permana@smamutiara2.sch.id",
    whatsapp: "6281266667777",
    divisionId: "sekbid-06",
    organisationPosition: "Anggota Sekbid VI",
    period: "2024/2025",
    membershipStatus: MEMBERSHIP_STATUS.SUSPENDED,
    joinedAt: "2023-10-15T08:00:00+07:00",
    suspendedAt: "2024-10-01T10:00:00+07:00",
    suspensionReason: "Sedang menjalani evaluasi kedisiplinan.",
    createdAt: "2023-10-10T08:00:00+07:00",
    updatedAt: "2024-10-01T10:00:00+07:00",
  },
];

/* =========================================================
   REGISTRATION REVIEW LOGS
   Firestore path: ReviewPendaftaran/{reviewId}
========================================================= */

export const registrationReviewLogs = [
  {
    id: "registration-review-001",
    memberId: "member-pending-001",
    applicantUserId: "user-pending-001",
    action: REGISTRATION_REVIEW_ACTION.SUBMITTED,
    note: "Pendaftaran awal dikirim oleh calon anggota.",
    actedBy: "user-pending-001",
    createdAt: "2024-10-14T09:30:00+07:00",
  },
  {
    id: "registration-review-002",
    memberId: "member-pending-002",
    applicantUserId: "user-pending-002",
    action: REGISTRATION_REVIEW_ACTION.SUBMITTED,
    note: "Pendaftaran awal dikirim oleh calon anggota.",
    actedBy: "user-pending-002",
    createdAt: "2024-10-15T08:05:00+07:00",
  },
  {
    id: "registration-review-003",
    memberId: "member-rejected-001",
    applicantUserId: "user-rejected-001",
    action: REGISTRATION_REVIEW_ACTION.SUBMITTED,
    note: "Pendaftaran awal dikirim oleh calon anggota.",
    actedBy: "user-rejected-001",
    createdAt: "2024-10-10T08:20:00+07:00",
  },
  {
    id: "registration-review-004",
    memberId: "member-rejected-001",
    applicantUserId: "user-rejected-001",
    action: REGISTRATION_REVIEW_ACTION.REJECTED,
    note:
      "Alamat dan nomor WhatsApp belum dapat diverifikasi. Silakan perbaiki lalu daftar ulang.",
    actedBy: "user-pembina-001",
    createdAt: "2024-10-13T13:15:00+07:00",
  },
];

/* =========================================================
   SYSTEM CONTACTS
   Dipakai pada kartu bantuan dashboard.
========================================================= */

export const systemContacts = {
  secretary: {
    memberId: "member-secretary-001",
    name: "Alya Putri",
    position: "Sekretaris Umum",
    whatsapp: "6281212345678",
    email: "alya.putri@smamutiara2.sch.id",
  },
  supervisor: {
    userId: "user-pembina-001",
    name: "Lia Amalia, S.Ag., S.Pd.",
    position: "Pembina OSIS",
    whatsapp: "6281299998888",
    email: "lia.amalia@smamutiara2.sch.id",
  },
};

/* =========================================================
   KEGIATAN COLLECTION
   Firestore path: Kegiatan/{activityId}
========================================================= */

export const activities = [
  {
    id: "activity-001",
    code: "EVT-2405-01",
    title: "Rapat Rutin Mingguan",
    description:
      "Rapat koordinasi rutin untuk mengevaluasi program kerja setiap sekbid.",
    category: "meeting",
    status: ACTIVITY_STATUS.COMPLETED,

    startAt: "2024-05-24T16:00:00+07:00",
    endAt: "2024-05-24T17:30:00+07:00",
    location: "Ruang OSIS",

    divisionId: null,
    organiserMemberId: "member-001",
    committeeMemberIds: ["member-001", "member-002"],
    participantMemberIds: ["member-001", "member-002"],
    participantCount: 48,
    participantCapacity: 60,

    proposalId: null,
    attendanceSessionId: "attendance-session-001",
    reportStatus: "completed",
    reportFileURL: "/files/lpj/rapat-rutin-mei-2024.pdf",

    createdBy: "user-pembina-001",
    createdAt: "2024-05-20T09:00:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },

  {
    id: "activity-002",
    code: "EVT-2405-02",
    title: "Persiapan Pensi 2024",
    description:
      "Koordinasi teknis panitia untuk persiapan pentas seni sekolah.",
    category: "committee",
    status: ACTIVITY_STATUS.COMPLETED,

    startAt: "2024-05-22T16:00:00+07:00",
    endAt: "2024-05-22T18:00:00+07:00",
    location: "Aula Sekolah",

    divisionId: "sekbid-08",
    organiserMemberId: "member-008",
    committeeMemberIds: ["member-001", "member-008"],
    participantMemberIds: ["member-001"],
    participantCount: 52,
    participantCapacity: 70,

    proposalId: "proposal-004",
    attendanceSessionId: "attendance-session-002",
    reportStatus: "pending",

    createdBy: "user-pembina-001",
    createdAt: "2024-05-17T09:00:00+07:00",
    updatedAt: "2024-05-22T18:00:00+07:00",
  },

  {
    id: "activity-003",
    code: "EVT-2408-01",
    title: "17 Agustusan",
    description:
      "Kegiatan untuk menumbuhkan nilai perjuangan, kebersamaan, dan semangat proklamasi.",
    category: "school_event",
    status: ACTIVITY_STATUS.UPCOMING,

    startAt: "2024-08-17T07:00:00+07:00",
    endAt: "2024-08-17T15:00:00+07:00",
    location: "Lapangan SMA Mutiara 2 Bandung",

    divisionId: "sekbid-03",
    organiserMemberId: "member-003",
    committeeMemberIds: ["member-001", "member-003"],
    participantMemberIds: [],
    participantCount: 0,
    participantCapacity: 900,

    proposalId: "proposal-005",
    attendanceSessionId: null,
    reportStatus: "not_started",

    createdBy: "user-pembina-001",
    createdAt: "2024-07-20T09:00:00+07:00",
    updatedAt: "2024-07-20T09:00:00+07:00",
  },

  {
    id: "activity-004",
    code: "EVT-2410-01",
    title: "Pekan Olahraga Sekolah 2024",
    description:
      "Kompetisi olahraga antarkelas untuk meningkatkan sportivitas dan kebersamaan siswa.",
    category: "sport",
    status: ACTIVITY_STATUS.UPCOMING,

    startAt: "2024-10-15T07:00:00+07:00",
    endAt: "2024-10-18T16:00:00+07:00",
    location: "Stadion Utama Sekolah",

    divisionId: "sekbid-07",
    organiserMemberId: "member-007",
    committeeMemberIds: ["member-001", "member-007"],
    participantMemberIds: ["member-001"],
    participantCount: 850,
    participantCapacity: 1000,

    proposalId: "proposal-003",
    attendanceSessionId: null,
    reportStatus: "not_started",

    createdBy: "user-pembina-001",
    createdAt: "2024-09-01T09:00:00+07:00",
    updatedAt: "2024-10-01T09:00:00+07:00",
  },

  {
    id: "activity-005",
    code: "EVT-2410-02",
    title: "Workshop Digital Literacy",
    description:
      "Workshop penggunaan teknologi digital secara aman, produktif, dan bertanggung jawab.",
    category: "workshop",
    status: ACTIVITY_STATUS.ONGOING,

    startAt: "2024-10-14T08:00:00+07:00",
    endAt: "2024-10-16T15:00:00+07:00",
    location: "Lab Komputer 03",

    divisionId: "sekbid-09",
    organiserMemberId: "member-009",
    committeeMemberIds: ["member-001", "member-009"],
    participantMemberIds: ["member-001"],
    participantCount: 45,
    participantCapacity: 50,

    proposalId: "proposal-002",
    attendanceSessionId: "attendance-session-005",
    reportStatus: "not_started",

    createdBy: "user-pembina-001",
    createdAt: "2024-09-15T09:00:00+07:00",
    updatedAt: "2024-10-15T09:00:00+07:00",
  },

  {
    id: "activity-006",
    code: "EVT-2409-01",
    title: "LDKS Pengurus Inti OSIS",
    description:
      "Latihan dasar kepemimpinan untuk meningkatkan kemampuan organisasi pengurus inti.",
    category: "training",
    status: ACTIVITY_STATUS.COMPLETED,

    startAt: "2024-09-25T08:00:00+07:00",
    endAt: "2024-09-27T16:00:00+07:00",
    location: "Aula Serbaguna",

    divisionId: "sekbid-05",
    organiserMemberId: "member-005",
    committeeMemberIds: ["member-001", "member-005"],
    participantMemberIds: ["member-001"],
    participantCount: 60,
    participantCapacity: 60,

    proposalId: "proposal-001",
    attendanceSessionId: "attendance-session-006",
    reportStatus: "completed",
    reportFileURL: "/files/lpj/lpj-ldks-2024.pdf",

    createdBy: "user-pembina-001",
    createdAt: "2024-08-15T09:00:00+07:00",
    updatedAt: "2024-09-30T09:00:00+07:00",
  },

  {
    id: "activity-007",
    code: "EVT-2411-01",
    title: "Rapat Koordinasi Akhir",
    description:
      "Rapat penutup untuk mengevaluasi pelaksanaan program kerja semester.",
    category: "meeting",
    status: ACTIVITY_STATUS.UPCOMING,

    startAt: "2024-11-02T15:30:00+07:00",
    endAt: "2024-11-02T17:00:00+07:00",
    location: "Ruang OSIS",

    divisionId: null,
    organiserMemberId: "member-001",
    committeeMemberIds: ["member-001"],
    participantMemberIds: ["member-001"],
    participantCount: 48,
    participantCapacity: 60,

    proposalId: null,
    attendanceSessionId: null,
    reportStatus: "not_started",

    createdBy: "user-pembina-001",
    createdAt: "2024-10-14T10:00:00+07:00",
    updatedAt: "2024-10-14T10:00:00+07:00",
  },

  {
    id: "activity-baksos-001",
    code: "EVT-2405-03",
    title: "Baksos Ramadhan",
    description: "Kegiatan bakti sosial dan penyaluran bantuan Ramadhan.",
    category: "social",
    status: ACTIVITY_STATUS.COMPLETED,
    startAt: "2024-05-18T08:00:00+07:00",
    endAt: "2024-05-18T12:00:00+07:00",
    location: "Masjid Al-Hidayah",
    divisionId: "sekbid-01",
    organiserMemberId: "member-001",
    committeeMemberIds: ["member-001"],
    participantMemberIds: ["member-001"],
    participantCount: 40,
    participantCapacity: 50,
    proposalId: null,
    attendanceSessionId: "attendance-session-003",
    reportStatus: "completed",
    createdBy: "user-pembina-001",
    createdAt: "2024-05-10T09:00:00+07:00",
    updatedAt: "2024-05-18T13:00:00+07:00",
  },
  {
    id: "activity-ldks-old-001",
    code: "EVT-2405-04",
    title: "LDKS Organisasi",
    description: "Pelatihan dasar organisasi untuk pengurus OSIS.",
    category: "training",
    status: ACTIVITY_STATUS.COMPLETED,
    startAt: "2024-05-10T08:00:00+07:00",
    endAt: "2024-05-10T16:00:00+07:00",
    location: "Pusdiklat",
    divisionId: "sekbid-05",
    organiserMemberId: "member-005",
    committeeMemberIds: ["member-001", "member-005"],
    participantMemberIds: ["member-001"],
    participantCount: 55,
    participantCapacity: 60,
    proposalId: null,
    attendanceSessionId: "attendance-session-004",
    reportStatus: "completed",
    createdBy: "user-pembina-001",
    createdAt: "2024-05-01T09:00:00+07:00",
    updatedAt: "2024-05-10T17:00:00+07:00",
  },
  {
    id: "activity-evaluation-001",
    code: "EVT-2405-05",
    title: "Rapat Evaluasi Program",
    description: "Evaluasi pelaksanaan program kerja OSIS.",
    category: "meeting",
    status: ACTIVITY_STATUS.COMPLETED,
    startAt: "2024-05-05T14:00:00+07:00",
    endAt: "2024-05-05T16:00:00+07:00",
    location: "Ruang Rapat Utama",
    divisionId: null,
    organiserMemberId: "member-001",
    committeeMemberIds: ["member-001", "member-002"],
    participantMemberIds: ["member-001"],
    participantCount: 48,
    participantCapacity: 60,
    proposalId: null,
    attendanceSessionId: "attendance-session-005-old",
    reportStatus: "completed",
    createdBy: "user-pembina-001",
    createdAt: "2024-05-01T10:00:00+07:00",
    updatedAt: "2024-05-05T17:00:00+07:00",
  },

  {
    id: "activity-008",
    code: "EVT-2411-02",
    title: "Workshop Kepemimpinan",
    description:
      "Pelatihan kepemimpinan dan komunikasi efektif bagi pengurus OSIS.",
    category: "workshop",
    status: ACTIVITY_STATUS.UPCOMING,

    startAt: "2024-11-09T08:00:00+07:00",
    endAt: "2024-11-09T15:00:00+07:00",
    location: "Aula Sekolah",

    divisionId: "sekbid-05",
    organiserMemberId: "member-005",
    committeeMemberIds: ["member-001", "member-005"],
    participantMemberIds: ["member-001"],
    participantCount: 55,
    participantCapacity: 80,

    proposalId: null,
    attendanceSessionId: null,
    reportStatus: "not_started",

    createdBy: "user-pembina-001",
    createdAt: "2024-10-14T11:00:00+07:00",
    updatedAt: "2024-10-14T11:00:00+07:00",
  },
];

/* =========================================================
   ATTENDANCE SESSIONS COLLECTION
   Firestore path: SesiAbsensi/{sessionId}
========================================================= */

export const attendanceSessions = [
  {
    id: "attendance-session-001",
    activityId: "activity-001",
    title: "Presensi Rapat Rutin Mingguan",
    sessionDate: "2024-05-24",
    startAt: "2024-05-24T16:00:00+07:00",
    endAt: "2024-05-24T17:30:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.CLOSED,
    expectedMemberIds: [
      "member-001",
      "member-002",
      "member-003",
      "member-004",
      "member-005",
      "member-006",
      "member-007",
      "member-008",
      "member-009",
    ],
    openedBy: "user-pembina-001",
    openedAt: "2024-05-24T15:45:00+07:00",
    closedBy: "user-pembina-001",
    closedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:40:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-session-002",
    activityId: "activity-002",
    title: "Presensi Persiapan Pensi 2024",
    sessionDate: "2024-05-22",
    startAt: "2024-05-22T16:00:00+07:00",
    endAt: "2024-05-22T18:00:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.CLOSED,
    expectedMemberIds: [
      "member-001",
      "member-002",
      "member-006",
      "member-008",
    ],
    openedBy: "user-pembina-001",
    openedAt: "2024-05-22T15:45:00+07:00",
    closedBy: "user-pembina-001",
    closedAt: "2024-05-22T18:15:00+07:00",
    createdAt: "2024-05-22T15:40:00+07:00",
    updatedAt: "2024-05-22T18:15:00+07:00",
  },
  {
    id: "attendance-session-003",
    activityId: "activity-baksos-001",
    title: "Presensi Baksos Ramadhan",
    sessionDate: "2024-05-18",
    startAt: "2024-05-18T08:00:00+07:00",
    endAt: "2024-05-18T12:00:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.CLOSED,
    expectedMemberIds: ["member-001", "member-002", "member-005"],
    openedBy: "user-pembina-001",
    openedAt: "2024-05-18T07:45:00+07:00",
    closedBy: "user-pembina-001",
    closedAt: "2024-05-18T13:00:00+07:00",
    createdAt: "2024-05-18T07:40:00+07:00",
    updatedAt: "2024-05-18T13:00:00+07:00",
  },
  {
    id: "attendance-session-004",
    activityId: "activity-ldks-old-001",
    title: "Presensi LDKS Organisasi",
    sessionDate: "2024-05-10",
    startAt: "2024-05-10T08:00:00+07:00",
    endAt: "2024-05-10T16:00:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.CLOSED,
    expectedMemberIds: ["member-001", "member-002", "member-005"],
    openedBy: "user-pembina-001",
    openedAt: "2024-05-10T07:45:00+07:00",
    closedBy: "user-pembina-001",
    closedAt: "2024-05-10T16:30:00+07:00",
    createdAt: "2024-05-10T07:40:00+07:00",
    updatedAt: "2024-05-10T16:30:00+07:00",
  },
  {
    id: "attendance-session-005-old",
    activityId: "activity-evaluation-001",
    title: "Presensi Rapat Evaluasi Program",
    sessionDate: "2024-05-05",
    startAt: "2024-05-05T14:00:00+07:00",
    endAt: "2024-05-05T16:00:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.CLOSED,
    expectedMemberIds: ["member-001", "member-002", "member-003"],
    openedBy: "user-pembina-001",
    openedAt: "2024-05-05T13:45:00+07:00",
    closedBy: "user-pembina-001",
    closedAt: "2024-05-05T16:30:00+07:00",
    createdAt: "2024-05-05T13:40:00+07:00",
    updatedAt: "2024-05-05T16:30:00+07:00",
  },
  {
    id: "attendance-session-005",
    activityId: "activity-005",
    title: "Presensi Workshop Digital Literacy",
    sessionDate: "2024-10-15",
    startAt: "2024-10-15T08:00:00+07:00",
    endAt: "2024-10-15T15:00:00+07:00",
    status: ATTENDANCE_SESSION_STATUS.OPEN,
    expectedMemberIds: [
      "member-001",
      "member-002",
      "member-003",
      "member-004",
      "member-005",
      "member-006",
      "member-007",
      "member-008",
      "member-009",
    ],
    openedBy: "user-pembina-001",
    openedAt: "2024-10-15T07:45:00+07:00",
    closedBy: null,
    closedAt: null,
    createdAt: "2024-10-14T15:00:00+07:00",
    updatedAt: "2024-10-15T07:45:00+07:00",
  },
];

/* =========================================================
   ABSENSI COLLECTION
   Firestore path: Absensi/{attendanceId}
========================================================= */

export const attendanceRecords = [
  {
    id: "attendance-001",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-24T15:58:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:58:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-002",
    activityId: "activity-002",
    sessionId: "attendance-session-002",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.LATE,
    checkInAt: "2024-05-22T16:15:00+07:00",
    checkOutAt: "2024-05-22T18:00:00+07:00",
    note: "Terlambat karena kegiatan akademik.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-22T18:15:00+07:00",
    createdAt: "2024-05-22T16:15:00+07:00",
    updatedAt: "2024-05-22T18:15:00+07:00",
  },
  {
    id: "attendance-003",
    activityId: "activity-baksos-001",
    sessionId: "attendance-session-003",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-18T08:00:00+07:00",
    checkOutAt: "2024-05-18T12:00:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-18T13:00:00+07:00",
    createdAt: "2024-05-18T08:00:00+07:00",
    updatedAt: "2024-05-18T13:00:00+07:00",
  },
  {
    id: "attendance-004",
    activityId: "activity-ldks-old-001",
    sessionId: "attendance-session-004",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.EXCUSED,
    checkInAt: null,
    checkOutAt: null,
    note: "Izin mengikuti lomba akademik.",
    proofFileURL: "/files/attendance/izin-lomba-akademik.pdf",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-10T09:00:00+07:00",
    createdAt: "2024-05-09T14:00:00+07:00",
    updatedAt: "2024-05-10T09:00:00+07:00",
  },
  {
    id: "attendance-005",
    activityId: "activity-evaluation-001",
    sessionId: "attendance-session-005-old",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-05T14:00:00+07:00",
    checkOutAt: "2024-05-05T16:00:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-05T16:30:00+07:00",
    createdAt: "2024-05-05T14:00:00+07:00",
    updatedAt: "2024-05-05T16:30:00+07:00",
  },
  {
    id: "attendance-006",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-002",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-24T15:55:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:55:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-007",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-003",
    status: ATTENDANCE_STATUS.SICK,
    checkInAt: null,
    checkOutAt: null,
    note: "Sakit dan mengirim surat keterangan.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T09:00:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-008",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-004",
    status: ATTENDANCE_STATUS.LATE,
    checkInAt: "2024-05-24T16:12:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: "Terlambat karena piket kelas.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T16:12:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-009",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-005",
    status: ATTENDANCE_STATUS.EXCUSED,
    checkInAt: null,
    checkOutAt: null,
    note: "Izin mengikuti rapat kelas.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T10:00:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-010",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-006",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-24T15:57:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:57:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-011",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-007",
    status: ATTENDANCE_STATUS.ABSENT,
    checkInAt: null,
    checkOutAt: null,
    note: "Tidak hadir tanpa keterangan.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T18:00:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-012",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-008",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-24T15:59:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:59:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-013",
    activityId: "activity-001",
    sessionId: "attendance-session-001",
    memberId: "member-009",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-05-24T15:56:00+07:00",
    checkOutAt: "2024-05-24T17:30:00+07:00",
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-05-24T18:00:00+07:00",
    createdAt: "2024-05-24T15:56:00+07:00",
    updatedAt: "2024-05-24T18:00:00+07:00",
  },
  {
    id: "attendance-open-001",
    activityId: "activity-005",
    sessionId: "attendance-session-005",
    memberId: "member-001",
    status: ATTENDANCE_STATUS.PRESENT,
    checkInAt: "2024-10-15T07:58:00+07:00",
    checkOutAt: null,
    note: null,
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-10-15T08:00:00+07:00",
    createdAt: "2024-10-15T07:58:00+07:00",
    updatedAt: "2024-10-15T08:00:00+07:00",
  },
  {
    id: "attendance-open-002",
    activityId: "activity-005",
    sessionId: "attendance-session-005",
    memberId: "member-002",
    status: ATTENDANCE_STATUS.LATE,
    checkInAt: "2024-10-15T08:12:00+07:00",
    checkOutAt: null,
    note: "Terlambat karena antrean kendaraan.",
    verifiedBy: "user-pembina-001",
    verifiedAt: "2024-10-15T08:15:00+07:00",
    createdAt: "2024-10-15T08:12:00+07:00",
    updatedAt: "2024-10-15T08:15:00+07:00",
  },
];

/*
 * Ringkasan dapat disimpan sebagai dokumen agregasi agar dashboard
 * tidak menghitung seluruh histori setiap kali dibuka.
 *
 * Firestore path contoh:
 * AttendanceSummaries/{memberId_period}
 */
export const attendanceSummaries = [
  {
    id: "attendance-summary-member-001-2024",
    memberId: "member-001",
    period: "2024/2025",

    totalActivities: 12,
    presentCount: 10,
    lateCount: 1,
    excusedCount: 1,
    sickCount: 0,
    absentCount: 0,

    attendancePercentage: 98,
    punctualityPercentage: 89.5,
    activeMinutes: 1284,

    updatedAt: "2024-10-15T08:00:00+07:00",
  },
  {
    id: "attendance-summary-member-002-2024",
    memberId: "member-002",
    period: "2024/2025",
    totalActivities: 11,
    presentCount: 9,
    lateCount: 1,
    excusedCount: 1,
    sickCount: 0,
    absentCount: 0,
    attendancePercentage: 91,
    punctualityPercentage: 90,
    activeMinutes: 1180,
    updatedAt: "2024-10-15T08:00:00+07:00",
  },
  {
    id: "attendance-summary-member-003-2024",
    memberId: "member-003",
    period: "2024/2025",
    totalActivities: 10,
    presentCount: 8,
    lateCount: 0,
    excusedCount: 0,
    sickCount: 1,
    absentCount: 1,
    attendancePercentage: 80,
    punctualityPercentage: 100,
    activeMinutes: 960,
    updatedAt: "2024-10-15T08:00:00+07:00",
  },
];

/* =========================================================
   ORGANISATION ATTENDANCE SUMMARIES
   Firestore path: RingkasanAbsensiOrganisasi/{summaryId}
========================================================= */

export const organisationAttendanceSummaries = [
  {
    id: "organisation-attendance-2024-10",
    period: "2024/2025",
    month: "2024-10",
    totalSessions: 4,
    expectedAttendanceCount: 192,
    presentCount: 168,
    lateCount: 10,
    excusedCount: 8,
    sickCount: 3,
    absentCount: 3,
    attendancePercentage: 92.7,
    updatedAt: "2024-10-15T08:00:00+07:00",
  },
];

/* =========================================================
   PROPOSAL COLLECTION
   Firestore path: Proposal/{proposalId}
========================================================= */

export const proposalUploadRules = {
  allowedExtensions: ["pdf", "docx"],
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxFileSizeMB: 10,
};

export const proposals = [
  {
    id: "proposal-001",
    activityId: "activity-006",
    uploadedBy: "member-001",

    title: "Proposal LDKS Pengurus Inti OSIS",
    description:
      "Proposal pelaksanaan Latihan Dasar Kepemimpinan Siswa tahun 2024.",
    fileName: "Proposal_LDKS_v2_Final.pdf",
    fileType: "application/pdf",
    fileExtension: "pdf",
    fileSizeBytes: 2516582,
    fileURL: "/files/proposals/Proposal_LDKS_v2_Final.pdf",
    storagePath: "proposals/member-001/Proposal_LDKS_v2_Final.pdf",
    version: 2,

    status: PROPOSAL_STATUS.APPROVED,
    reviewNote: "Proposal disetujui dan dapat dilaksanakan.",
    reviewedBy: "user-pembina-001",
    reviewedAt: "2023-10-13T10:00:00+07:00",

    submittedAt: "2023-10-12T14:20:00+07:00",
    createdAt: "2023-10-12T14:20:00+07:00",
    updatedAt: "2023-10-13T10:00:00+07:00",
  },

  {
    id: "proposal-002",
    activityId: "activity-005",
    uploadedBy: "member-001",

    title: "Art Fest SMA Mutiara 2",
    description: "Draf proposal kegiatan festival seni sekolah.",
    fileName: "Draf_Art_Fest_Rev3.docx",
    fileType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileExtension: "docx",
    fileSizeBytes: 1153434,
    fileURL: "/files/proposals/Draf_Art_Fest_Rev3.docx",
    storagePath: "proposals/member-001/Draf_Art_Fest_Rev3.docx",
    version: 3,

    status: PROPOSAL_STATUS.PENDING_REVIEW,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,

    submittedAt: "2023-10-10T09:45:00+07:00",
    createdAt: "2023-10-10T09:45:00+07:00",
    updatedAt: "2023-10-10T09:45:00+07:00",
  },

  {
    id: "proposal-003",
    activityId: "activity-004",
    uploadedBy: "member-001",

    title: "Pekan Olahraga Antarkelas",
    description: "Proposal kegiatan pekan olahraga sekolah.",
    fileName: "Proposal_Porak_v1.pdf",
    fileType: "application/pdf",
    fileExtension: "pdf",
    fileSizeBytes: 3984588,
    fileURL: "/files/proposals/Proposal_Porak_v1.pdf",
    storagePath: "proposals/member-001/Proposal_Porak_v1.pdf",
    version: 1,

    status: PROPOSAL_STATUS.REVISION_REQUIRED,
    reviewNote:
      "Rincian anggaran dan susunan panitia perlu diperbarui sebelum diajukan kembali.",
    reviewedBy: "user-pembina-001",
    reviewedAt: "2023-10-06T13:00:00+07:00",

    submittedAt: "2023-10-05T11:12:00+07:00",
    createdAt: "2023-10-05T11:12:00+07:00",
    updatedAt: "2023-10-06T13:00:00+07:00",
  },

  {
    id: "proposal-004",
    activityId: "activity-002",
    uploadedBy: "member-008",

    title: "Pentas Seni 2024",
    description: "Proposal pelaksanaan pentas seni sekolah tahun 2024.",
    fileName: "Proposal_Pensi_2024.pdf",
    fileType: "application/pdf",
    fileExtension: "pdf",
    fileSizeBytes: 4456448,
    fileURL: "/files/proposals/Proposal_Pensi_2024.pdf",
    storagePath: "proposals/member-008/Proposal_Pensi_2024.pdf",
    version: 1,

    status: PROPOSAL_STATUS.APPROVED,
    reviewNote: "Proposal disetujui dengan penyesuaian anggaran.",
    reviewedBy: "user-pembina-001",
    reviewedAt: "2024-05-18T14:00:00+07:00",

    submittedAt: "2024-05-17T10:00:00+07:00",
    createdAt: "2024-05-17T10:00:00+07:00",
    updatedAt: "2024-05-18T14:00:00+07:00",
  },
];

/* =========================================================
   PENGUMUMAN COLLECTION
   Firestore path: Pengumuman/{announcementId}
========================================================= */

export const announcements = [
  {
    id: "announcement-001",
    title: "Persiapan Rapat Pleno Semester Ganjil",
    summary:
      "Koordinasi teknis persiapan pleno semester ganjil untuk seluruh pengurus.",
    content:
      "Diharapkan seluruh pengurus inti dan koordinator departemen untuk hadir dalam koordinasi teknis persiapan pleno yang akan dilaksanakan pada akhir bulan ini. Harap membawa laporan perkembangan program masing-masing.",

    category: ANNOUNCEMENT_CATEGORY.INTERNAL,
    priority: ANNOUNCEMENT_PRIORITY.NORMAL,

    authorId: "member-secretary-001",
    authorName: "Alya Putri",
    authorPosition: "Sekretaris Umum",
    divisionId: null,

    audienceRoles: [ROLES.ANGGOTA, ROLES.PEMBINA],
    audienceDivisionIds: [],
    isPinned: true,
    isPublished: true,
    publicationStatus: ANNOUNCEMENT_STATUS.PUBLISHED,

    action: {
      label: "Detail",
      type: "detail",
      url: "/anggota/pengumuman/announcement-001",
    },

    attachments: [],
    publishedAt: "2024-10-15T08:00:00+07:00",
    expiresAt: "2024-10-31T23:59:59+07:00",
    viewCount: 86,
    createdAt: "2024-10-15T08:00:00+07:00",
    updatedAt: "2024-10-15T08:00:00+07:00",
  },

  {
    id: "announcement-002",
    title: "Pendaftaran LDKS 2024 Resmi Dibuka",
    summary:
      "Pendaftaran LDKS dibuka untuk siswa kelas X dan XI.",
    content:
      "Kesempatan untuk bergabung menjadi bagian dari agen perubahan. Pendaftaran Latihan Dasar Kepemimpinan Siswa kini telah dibuka untuk seluruh siswa kelas X dan XI. Segera daftarkan diri melalui portal pendaftaran.",

    category: ANNOUNCEMENT_CATEGORY.GENERAL,
    priority: ANNOUNCEMENT_PRIORITY.NORMAL,

    authorId: "member-005",
    authorName: "Bagas Surya",
    authorPosition: "Departemen Kaderisasi",
    divisionId: "sekbid-05",

    audienceRoles: [ROLES.ANGGOTA],
    audienceDivisionIds: [],
    isPinned: false,
    isPublished: true,
    publicationStatus: ANNOUNCEMENT_STATUS.PUBLISHED,

    action: {
      label: "Detail",
      type: "detail",
      url: "/anggota/pengumuman/announcement-002",
    },

    attachments: [],
    publishedAt: "2024-10-12T08:00:00+07:00",
    expiresAt: "2024-10-25T23:59:59+07:00",
    viewCount: 61,
    createdAt: "2024-10-12T08:00:00+07:00",
    updatedAt: "2024-10-12T08:00:00+07:00",
  },

  {
    id: "announcement-003",
    title: "Update Alokasi Dana Pentas Seni",
    summary:
      "Terdapat penyesuaian alokasi dana untuk perlengkapan dan dekorasi.",
    content:
      "Berdasarkan hasil rapat pimpinan, terdapat penyesuaian alokasi dana untuk divisi perlengkapan dan dekorasi Pentas Seni 2024. Dokumen rincian anggaran terbaru dapat diunduh atau dikonfirmasi langsung kepada bendahara.",

    category: ANNOUNCEMENT_CATEGORY.IMPORTANT,
    priority: ANNOUNCEMENT_PRIORITY.HIGH,

    authorId: "member-treasurer-001",
    authorName: "Siska Amelia",
    authorPosition: "Bendahara Umum",
    divisionId: null,

    audienceRoles: [ROLES.ANGGOTA, ROLES.PEMBINA],
    audienceDivisionIds: ["sekbid-06", "sekbid-08"],
    isPinned: true,
    isPublished: true,
    publicationStatus: ANNOUNCEMENT_STATUS.PUBLISHED,

    action: {
      label: "Unduh Rincian",
      type: "download",
      url: "/files/announcements/alokasi-dana-pentas-seni.pdf",
    },

    attachments: [
      {
        id: "attachment-001",
        fileName: "Alokasi_Dana_Pentas_Seni_2024.pdf",
        fileType: "application/pdf",
        fileURL: "/files/announcements/alokasi-dana-pentas-seni.pdf",
      },
    ],

    publishedAt: "2024-10-08T08:00:00+07:00",
    expiresAt: null,
    viewCount: 49,
    createdAt: "2024-10-08T08:00:00+07:00",
    updatedAt: "2024-10-08T08:00:00+07:00",
  },

  {
    id: "announcement-004",
    title: "Pengingat Batas Akhir Laporan Bulanan",
    summary:
      "Seluruh divisi wajib mengunggah laporan bulanan paling lambat tanggal 25.",
    content:
      "Seluruh divisi diwajibkan mengunggah laporan kegiatan bulanan paling lambat tanggal 25 setiap bulannya. Keterlambatan akan memengaruhi penilaian performa divisi.",

    category: ANNOUNCEMENT_CATEGORY.IMPORTANT,
    priority: ANNOUNCEMENT_PRIORITY.URGENT,

    authorId: "user-pembina-001",
    authorName: "Lia Amalia",
    authorPosition: "Pembina OSIS",
    divisionId: null,

    audienceRoles: [ROLES.ANGGOTA],
    audienceDivisionIds: [],
    isPinned: true,
    isPublished: true,
    publicationStatus: ANNOUNCEMENT_STATUS.PUBLISHED,

    action: {
      label: "Kirim Laporan",
      type: "link",
      url: "/anggota/upload-proposal",
    },

    attachments: [],
    publishedAt: "2024-10-07T08:00:00+07:00",
    expiresAt: "2024-10-25T23:59:59+07:00",
    viewCount: 92,
    createdAt: "2024-10-07T08:00:00+07:00",
    updatedAt: "2024-10-07T08:00:00+07:00",
  },

  {
    id: "announcement-005",
    title: "Juara Umum Lomba Debat Bahasa Inggris",
    summary:
      "Tim debat SMA Mutiara 2 meraih juara umum tingkat provinsi.",
    content:
      "Selamat kepada tim debat SMA Mutiara 2 atas prestasinya meraih Juara Umum di tingkat provinsi. Acara syukuran akan diadakan di ruang OSIS besok siang dan seluruh pengurus diundang hadir.",

    category: ANNOUNCEMENT_CATEGORY.COMPETITION,
    priority: ANNOUNCEMENT_PRIORITY.NORMAL,

    authorId: "member-public-relation-001",
    authorName: "Deni Wijaya",
    authorPosition: "Hubungan Masyarakat",
    divisionId: null,

    audienceRoles: [ROLES.ANGGOTA, ROLES.PEMBINA],
    audienceDivisionIds: [],
    isPinned: false,
    isPublished: true,
    publicationStatus: ANNOUNCEMENT_STATUS.PUBLISHED,

    action: {
      label: "Lihat Foto",
      type: "gallery",
      url: "/anggota/pengumuman/announcement-005/gallery",
    },

    attachments: [
      {
        id: "attachment-002",
        fileName: "juara-debat-01.jpg",
        fileType: "image/jpeg",
        fileURL: "/images/announcements/juara-debat-01.jpg",
      },
      {
        id: "attachment-003",
        fileName: "juara-debat-02.jpg",
        fileType: "image/jpeg",
        fileURL: "/images/announcements/juara-debat-02.jpg",
      },
    ],

    publishedAt: "2024-10-05T08:00:00+07:00",
    expiresAt: null,
    viewCount: 74,
    createdAt: "2024-10-05T08:00:00+07:00",
    updatedAt: "2024-10-05T08:00:00+07:00",
  },
  {
    id: "announcement-draft-001",
    title: "Evaluasi Program Kerja Bulan Oktober",
    summary: "Draf pengumuman evaluasi program kerja setiap sekbid.",
    content:
      "Setiap ketua sekbid diminta menyiapkan laporan evaluasi program kerja bulan Oktober.",
    category: ANNOUNCEMENT_CATEGORY.INTERNAL,
    priority: ANNOUNCEMENT_PRIORITY.NORMAL,
    authorId: "user-pembina-001",
    authorName: "Lia Amalia",
    authorPosition: "Pembina OSIS",
    divisionId: null,
    audienceRoles: [ROLES.ANGGOTA],
    audienceDivisionIds: [],
    isPinned: false,
    isPublished: false,
    publicationStatus: ANNOUNCEMENT_STATUS.DRAFT,
    action: null,
    attachments: [],
    publishedAt: null,
    scheduledAt: null,
    expiresAt: null,
    viewCount: 0,
    createdAt: "2024-10-15T09:00:00+07:00",
    updatedAt: "2024-10-15T09:00:00+07:00",
  },
  {
    id: "announcement-scheduled-001",
    title: "Agenda Rapat Koordinasi November",
    summary: "Pengumuman rapat koordinasi awal November.",
    content:
      "Seluruh pengurus diwajibkan hadir pada rapat koordinasi awal November untuk membahas agenda akhir semester.",
    category: ANNOUNCEMENT_CATEGORY.INTERNAL,
    priority: ANNOUNCEMENT_PRIORITY.HIGH,
    authorId: "user-pembina-001",
    authorName: "Lia Amalia",
    authorPosition: "Pembina OSIS",
    divisionId: null,
    audienceRoles: [ROLES.ANGGOTA],
    audienceDivisionIds: [],
    isPinned: true,
    isPublished: false,
    publicationStatus: ANNOUNCEMENT_STATUS.SCHEDULED,
    action: {
      label: "Lihat Agenda",
      type: "detail",
      url: "/anggota/pengumuman/announcement-scheduled-001",
    },
    attachments: [],
    publishedAt: null,
    scheduledAt: "2024-10-30T07:00:00+07:00",
    expiresAt: "2024-11-03T23:59:59+07:00",
    viewCount: 0,
    createdAt: "2024-10-15T09:30:00+07:00",
    updatedAt: "2024-10-15T09:30:00+07:00",
  },
];

/* =========================================================
   NOTIFICATIONS
   Dipakai oleh ikon notifikasi pada navbar.
========================================================= */

export const notifications = [
  {
    id: "notification-001",
    userId: "user-anggota-001",
    type: "announcement",
    title: "Pengumuman baru",
    message: "Persiapan Rapat Pleno Semester Ganjil telah diterbitkan.",
    referenceId: "announcement-001",
    referencePath: "/anggota/pengumuman/announcement-001",
    isRead: false,
    createdAt: "2024-10-15T08:05:00+07:00",
  },
  {
    id: "notification-002",
    userId: "user-anggota-001",
    type: "proposal_status",
    title: "Proposal perlu direvisi",
    message: "Proposal Pekan Olahraga Antarkelas membutuhkan revisi.",
    referenceId: "proposal-003",
    referencePath: "/anggota/upload-proposal",
    isRead: false,
    createdAt: "2024-10-06T13:05:00+07:00",
  },
];

/* =========================================================
   DASHBOARD VIEW MODEL
   Data ini dapat dipakai langsung saat membuat mockup.
========================================================= */

export const memberDashboard = {
  memberId: "member-001",

  attendanceCard: {
    percentage: 98,
    trendPercentage: 2,
    trendDirection: "up",
    label: "Total Kehadiran",
    statusLabel: "Sangat Baik",
  },

  activitiesCard: {
    totalJoined: 12,
    completedCount: 12,
    label: "Kegiatan Diikuti",
  },

  membershipCard: {
    status: MEMBERSHIP_STATUS.ACTIVE,
    statusLabel: "Aktif",
    divisionId: "sekbid-01",
    divisionLabel: "Divisi Sekbid I",
  },

  helpCard: {
    title: "Butuh Bantuan?",
    description: "Hubungi admin atau sekretaris OSIS.",
    contact: systemContacts.secretary,
  },

  recentAttendanceIds: [
    "attendance-001",
    "attendance-002",
    "attendance-003",
    "attendance-004",
    "attendance-005",
  ],

  upcomingActivityIds: ["activity-007", "activity-008"],

  latestAnnouncementIds: [
    "announcement-001",
    "announcement-002",
    "announcement-003",
  ],
};

export const supervisorDashboard = {
  period: "2024/2025",

  summaryCards: {
    totalMembers: 17,
    activeMembers: 13,
    inactiveMembers: 2,
    suspendedMembers: 1,
    pendingRegistrations: 2,
    rejectedRegistrations: 1,
    monthlyAttendancePercentage: 92.7,
    activeActivities: 4,
    pendingProposals: 1,
    revisionRequiredProposals: 1,
  },

  activeAttendanceSessionId: "attendance-session-005",

  upcomingActivityIds: [
    "activity-007",
    "activity-008",
    "activity-004",
  ],

  recentRegistrationMemberIds: [
    "member-pending-002",
    "member-pending-001",
    "member-rejected-001",
  ],

  latestProposalIds: [
    "proposal-003",
    "proposal-002",
    "proposal-004",
  ],

  latestAnnouncementIds: [
    "announcement-draft-001",
    "announcement-scheduled-001",
    "announcement-001",
  ],
};

/* =========================================================
   FILTER OPTIONS
   Opsional untuk select, tab, dan filter UI.
========================================================= */

export const filterOptions = {
  attendance: {
    statuses: [
      { value: "all", label: "Semua Status" },
      { value: ATTENDANCE_STATUS.PRESENT, label: "Hadir" },
      { value: ATTENDANCE_STATUS.LATE, label: "Terlambat" },
      { value: ATTENDANCE_STATUS.EXCUSED, label: "Izin" },
      { value: ATTENDANCE_STATUS.SICK, label: "Sakit" },
      { value: ATTENDANCE_STATUS.ABSENT, label: "Alpa" },
    ],
  },

  activities: {
    statuses: [
      { value: "all", label: "Semua Status" },
      { value: ACTIVITY_STATUS.UPCOMING, label: "Akan Datang" },
      { value: ACTIVITY_STATUS.ONGOING, label: "Sedang Berjalan" },
      { value: ACTIVITY_STATUS.COMPLETED, label: "Selesai" },
      { value: ACTIVITY_STATUS.CANCELLED, label: "Dibatalkan" },
    ],
    sorting: [
      { value: "newest", label: "Terbaru" },
      { value: "oldest", label: "Terlama" },
      { value: "nearest", label: "Terdekat" },
    ],
  },

  proposals: {
    statuses: [
      { value: "all", label: "Semua Status" },
      { value: PROPOSAL_STATUS.DRAFT, label: "Draf" },
      { value: PROPOSAL_STATUS.PENDING_REVIEW, label: "Menunggu" },
      { value: PROPOSAL_STATUS.REVISION_REQUIRED, label: "Perlu Revisi" },
      { value: PROPOSAL_STATUS.APPROVED, label: "Disetujui" },
      { value: PROPOSAL_STATUS.REJECTED, label: "Ditolak" },
    ],
  },

  members: {
    statuses: [
      { value: "all", label: "Semua Status" },
      { value: MEMBERSHIP_STATUS.ACTIVE, label: "Aktif" },
      { value: MEMBERSHIP_STATUS.INACTIVE, label: "Tidak Aktif" },
      { value: MEMBERSHIP_STATUS.SUSPENDED, label: "Ditangguhkan" },
      { value: MEMBERSHIP_STATUS.PENDING_REVIEW, label: "Menunggu Review" },
      { value: MEMBERSHIP_STATUS.REJECTED, label: "Ditolak" },
    ],
  },

  attendanceSessions: {
    statuses: [
      { value: "all", label: "Semua Status" },
      { value: ATTENDANCE_SESSION_STATUS.DRAFT, label: "Draf" },
      { value: ATTENDANCE_SESSION_STATUS.OPEN, label: "Dibuka" },
      { value: ATTENDANCE_SESSION_STATUS.CLOSED, label: "Ditutup" },
    ],
  },

  announcements: {
    categories: [
      { value: "all", label: "Semua" },
      { value: ANNOUNCEMENT_CATEGORY.INTERNAL, label: "Internal" },
      { value: ANNOUNCEMENT_CATEGORY.GENERAL, label: "Umum" },
      { value: ANNOUNCEMENT_CATEGORY.IMPORTANT, label: "Penting" },
      { value: ANNOUNCEMENT_CATEGORY.COMPETITION, label: "Kompetisi" },
    ],
    publicationStatuses: [
      { value: "all", label: "Semua Status" },
      { value: ANNOUNCEMENT_STATUS.DRAFT, label: "Draf" },
      { value: ANNOUNCEMENT_STATUS.SCHEDULED, label: "Terjadwal" },
      { value: ANNOUNCEMENT_STATUS.PUBLISHED, label: "Diterbitkan" },
      { value: ANNOUNCEMENT_STATUS.ARCHIVED, label: "Diarsipkan" },
    ],
    sorting: [
      { value: "newest", label: "Terbaru" },
      { value: "oldest", label: "Terlama" },
    ],
  },
};

/* =========================================================
   SIMPLE SELECTORS
   Bisa dipakai sebelum Firestore diintegrasikan.
========================================================= */

export function findUserById(userId) {
  return users.find((user) => user.id === userId) ?? null;
}

export function findMemberById(memberId) {
  return members.find((member) => member.id === memberId) ?? null;
}

export function findActivityById(activityId) {
  return activities.find((activity) => activity.id === activityId) ?? null;
}

export function getMemberAttendance(memberId) {
  return attendanceRecords
    .filter((record) => record.memberId === memberId)
    .map((record) => ({
      ...record,
      activity: findActivityById(record.activityId),
    }))
    .sort((a, b) => {
      const dateA = a.checkInAt || a.createdAt;
      const dateB = b.checkInAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });
}

export function getUpcomingActivities() {
  const now = new Date("2024-10-15T00:00:00+07:00");

  return activities
    .filter(
      (activity) =>
        activity.status === ACTIVITY_STATUS.UPCOMING &&
        new Date(activity.startAt) >= now
    )
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

export function getMemberProposals(memberId) {
  return proposals
    .filter((proposal) => proposal.uploadedBy === memberId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function getPublishedAnnouncements(role = ROLES.ANGGOTA) {
  return announcements
    .filter(
      (announcement) =>
        announcement.isPublished &&
        announcement.audienceRoles.includes(role)
    )
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return Number(b.isPinned) - Number(a.isPinned);
      }

      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
}

export function getMembersByStatus(status) {
  return members.filter((member) => member.membershipStatus === status);
}

export function getAttendanceBySession(sessionId) {
  return attendanceRecords.filter(
    (record) => record.sessionId === sessionId
  );
}

export function getRegistrationReviews(memberId) {
  return registrationReviewLogs
    .filter((review) => review.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAnnouncementsByPublicationStatus(status) {
  return announcements
    .filter((announcement) => announcement.publicationStatus === status)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/* =========================================================
   AGGREGATE EXPORT
   Gunakan jika ingin mengimpor semuanya sekaligus.
========================================================= */

const dummyData = {
  enums: {
    ROLES,
    MEMBERSHIP_STATUS,
    ATTENDANCE_STATUS,
    ACTIVITY_STATUS,
    PROPOSAL_STATUS,
    ANNOUNCEMENT_CATEGORY,
    ANNOUNCEMENT_PRIORITY,
    ATTENDANCE_SESSION_STATUS,
    REGISTRATION_REVIEW_ACTION,
    ANNOUNCEMENT_STATUS,
  },

  currentSession,
  organisation,
  academicPeriods,
  systemContacts,
  proposalUploadRules,
  filterOptions,

  users,
  divisions,
  members,
  registrationReviewLogs,
  activities,
  attendanceSessions,
  attendanceRecords,
  attendanceSummaries,
  organisationAttendanceSummaries,
  proposals,
  announcements,
  notifications,

  memberDashboard,
  supervisorDashboard,
};

export default dummyData;
