// src/lib/codefication.js
// Source of truth untuk kodefikasi business identifier.
// Primary key / relasi database tetap menggunakan Firestore Auto ID.

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config";

/**
 * Collection khusus counter kode.
 * Dokumen counter bersifat internal dan tidak perlu ditampilkan ke user.
 *
 * Contoh:
 * SystemCounters/PK_2026 -> { current: 12 }
 * SystemCounters/MT_2026 -> { current: 4 }
 */
export const CODIFICATION_COUNTER_COLLECTION = "SystemCounters";

/**
 * Semua kode bisnis yang saat ini relevan dengan domain sistem.
 *
 * Catatan:
 * - Kegiatan adalah entity utama yang mendapatkan kode bisnis resmi.
 * - Pelaksanaan dan Sesi memakai kode turunan dari Kegiatan untuk kebutuhan
 *   tampilan/debugging, tetapi primary key-nya tetap Firestore Auto ID.
 */
export const CODE_SCHEMES = Object.freeze({
  member: Object.freeze({
    prefix: "AGT",
    label: "Anggota",
  }),

  activity: Object.freeze({
    work_program: Object.freeze({
      prefix: "PK",
      label: "Program Kerja",
    }),

    meeting: Object.freeze({
      prefix: "MT",
      label: "Meeting",
    }),
  }),

  announcement: Object.freeze({
    prefix: "PENG",
    label: "Pengumuman",
  }),
});

/**
 * Normalisasi tahun menjadi 4 digit.
 */
export function normalizeYear(
  value = new Date().getFullYear()
) {
  const year = Number(value);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 9999
  ) {
    throw new Error(
      "Tahun kodefikasi tidak valid."
    );
  }

  return year;
}

/**
 * Format nomor urut menjadi 3 digit secara default.
 *
 * 1   -> 001
 * 12  -> 012
 * 123 -> 123
 */
export function formatSequence(
  sequence,
  length = 3
) {
  const numericSequence =
    Number(sequence);

  if (
    !Number.isInteger(
      numericSequence
    ) ||
    numericSequence < 1
  ) {
    throw new Error(
      "Nomor urut kodefikasi harus berupa bilangan bulat positif."
    );
  }

  return String(
    numericSequence
  ).padStart(
    length,
    "0"
  );
}

/**
 * Formatter generic.
 *
 * Contoh:
 *
 * formatCode({
 *   prefix: "PK",
 *   year: 2026,
 *   sequence: 1,
 * });
 *
 * -> PK-2026-001
 */
export function formatCode({
  prefix,
  year,
  sequence,
  separator = "-",
  sequenceLength = 3,
}) {
  const normalizedPrefix =
    String(
      prefix || ""
    )
      .trim()
      .toUpperCase();

  if (
    !normalizedPrefix
  ) {
    throw new Error(
      "Prefix kodefikasi wajib diisi."
    );
  }

  const normalizedYear =
    normalizeYear(
      year
    );

  const formattedSequence =
    formatSequence(
      sequence,
      sequenceLength
    );

  return [
    normalizedPrefix,
    normalizedYear,
    formattedSequence,
  ].join(separator);
}

/**
 * Mengambil scheme Kegiatan berdasarkan activityType.
 *
 * activityType valid:
 * - work_program
 * - meeting
 */
export function getActivityCodeScheme(
  activityType
) {
  const scheme =
    CODE_SCHEMES.activity?.[
      activityType
    ];

  if (!scheme) {
    throw new Error(
      `Kodefikasi activityType "${activityType}" belum terdaftar.`
    );
  }

  return scheme;
}

/**
 * Key dokumen counter.
 *
 * Contoh:
 *
 * PK_2026
 * MT_2026
 * AGT_2026
 */
export function buildCounterKey({
  prefix,
  year,
}) {
  const normalizedPrefix =
    String(
      prefix || ""
    )
      .trim()
      .toUpperCase();

  const normalizedYear =
    normalizeYear(
      year
    );

  if (
    !normalizedPrefix
  ) {
    throw new Error(
      "Prefix counter wajib diisi."
    );
  }

  return `${normalizedPrefix}_${normalizedYear}`;
}

/**
 * Mengambil nomor urut berikutnya secara atomic.
 *
 * Sequence yang sudah dipakai tidak didaur ulang.
 *
 * Misalnya:
 *
 * PK-2026-001
 * PK-2026-002
 * PK-2026-003
 *
 * kemudian 003 dihapus,
 * kode berikutnya tetap 004.
 */
export async function reserveNextSequence({
  prefix,
  year = new Date().getFullYear(),
}) {
  const normalizedYear =
    normalizeYear(
      year
    );

  const normalizedPrefix =
    String(
      prefix || ""
    )
      .trim()
      .toUpperCase();

  if (
    !normalizedPrefix
  ) {
    throw new Error(
      "Prefix kodefikasi wajib diisi."
    );
  }

  const counterKey =
    buildCounterKey({
      prefix:
        normalizedPrefix,
      year:
        normalizedYear,
    });

  const counterRef =
    doc(
      db,
      CODIFICATION_COUNTER_COLLECTION,
      counterKey
    );

  return runTransaction(
    db,
    async (
      transaction
    ) => {
      const snapshot =
        await transaction.get(
          counterRef
        );

      const current =
        snapshot.exists()
          ? Number(
              snapshot.data()
                ?.current ||
                0
            )
          : 0;

      const next =
        current + 1;

      transaction.set(
        counterRef,
        {
          prefix:
            normalizedPrefix,

          year:
            normalizedYear,

          current:
            next,

          updatedAt:
            serverTimestamp(),

          ...(snapshot.exists()
            ? {}
            : {
                createdAt:
                  serverTimestamp(),
              }),
        },
        {
          merge: true,
        }
      );

      return next;
    }
  );
}

/**
 * Generator generic.
 *
 * Contoh:
 *
 * await generateCode({
 *   prefix: "PK",
 *   year: 2026,
 * });
 *
 * -> PK-2026-001
 */
export async function generateCode({
  prefix,
  year = new Date().getFullYear(),
  separator = "-",
  sequenceLength = 3,
}) {
  const normalizedYear =
    normalizeYear(
      year
    );

  const sequence =
    await reserveNextSequence({
      prefix,
      year:
        normalizedYear,
    });

  return formatCode({
    prefix,
    year:
      normalizedYear,
    sequence,
    separator,
    sequenceLength,
  });
}

/**
 * =========================================================
 * KODE ANGGOTA
 * =========================================================
 *
 * Contoh:
 *
 * AGT-2026-001
 *
 * Firestore document.id tetap Auto ID.
 */
export async function buatKodeAnggota({
  tahun = new Date().getFullYear(),
} = {}) {
  return generateCode({
    prefix:
      CODE_SCHEMES.member
        .prefix,

    year:
      tahun,
  });
}

/**
 * Alias opsional apabila ada modul
 * yang memakai nama Inggris.
 */
export const generateMemberCode =
  buatKodeAnggota;

/**
 * =========================================================
 * KODE KEGIATAN
 * =========================================================
 *
 * work_program
 * -> PK-2026-001
 *
 * meeting
 * -> MT-2026-001
 */
export async function generateActivityCode(
  activityType,
  {
    year = new Date().getFullYear(),
  } = {}
) {
  const scheme =
    getActivityCodeScheme(
      activityType
    );

  return generateCode({
    prefix:
      scheme.prefix,

    year,
  });
}

/**
 * =========================================================
 * COMPATIBILITY MODUL MANAJEMEN KEGIATAN
 * =========================================================
 *
 * Fungsi ini dipertahankan karena
 * SeleksiKegiatanOverlay.jsx masih memakai:
 *
 * buatIdReferensiKegiatan(...)
 *
 * Walaupun namanya "IdReferensi",
 * hasilnya adalah BUSINESS CODE,
 * bukan Firestore document ID.
 *
 * Contoh:
 *
 * buatIdReferensiKegiatan(
 *   "program_kerja",
 *   { tahun: 2026 }
 * )
 *
 * -> PK-2026-001
 *
 * buatIdReferensiKegiatan(
 *   "rapat",
 *   { tahun: 2026 }
 * )
 *
 * -> MT-2026-001
 */
function normalisasiJenisKegiatanUntukKode(
  jenisKegiatan
) {
  const value =
    String(
      jenisKegiatan || ""
    )
      .trim()
      .toLowerCase();

  switch (value) {
    case "program_kerja":
    case "work_program":
      return "work_program";

    case "rapat":
    case "meeting":
      return "meeting";

    default:
      throw new Error(
        `Jenis kegiatan "${jenisKegiatan}" belum memiliki aturan kodefikasi.`
      );
  }
}

/**
 * Compatibility export untuk
 * SeleksiKegiatanOverlay.jsx.
 */
export async function buatIdReferensiKegiatan(
  jenisKegiatan,
  {
    tahun = new Date().getFullYear(),
  } = {}
) {
  const activityType =
    normalisasiJenisKegiatanUntukKode(
      jenisKegiatan
    );

  return generateActivityCode(
    activityType,
    {
      year:
        tahun,
    }
  );
}

/**
 * =========================================================
 * KODE PENGUMUMAN
 * =========================================================
 *
 * Contoh:
 * PENG-2026-001
 *
 * Firestore document.id tetap menggunakan Auto ID.
 */
export async function generateAnnouncementCode({
  year = new Date().getFullYear(),
} = {}) {
  return generateCode({
    prefix: CODE_SCHEMES.announcement.prefix,
    year,
  });
}

/**
 * Nama Indonesia untuk dipakai langsung pada modul Pengumuman.
 */
export async function buatIdReferensiPengumuman({
  tahun = new Date().getFullYear(),
} = {}) {
  return generateAnnouncementCode({ year: tahun });
}

/**
 * =========================================================
 * KODE PELAKSANAAN
 * =========================================================
 *
 * Tidak memakai counter Firestore.
 * Nomor berasal dari occurrenceIndex.
 *
 * PK-2026-001
 * occurrenceIndex = 0
 *
 * -> PK-2026-001-P01
 */
export function formatExecutionCode(
  activityCode,
  occurrenceIndex
) {
  const base =
    String(
      activityCode || ""
    )
      .trim()
      .toUpperCase();

  const index =
    Number(
      occurrenceIndex
    );

  if (!base) {
    throw new Error(
      "activityCode wajib diisi untuk membuat kode Pelaksanaan."
    );
  }

  if (
    !Number.isInteger(
      index
    ) ||
    index < 0
  ) {
    throw new Error(
      "occurrenceIndex Pelaksanaan tidak valid."
    );
  }

  return `${base}-P${String(
    index + 1
  ).padStart(
    2,
    "0"
  )}`;
}

/**
 * =========================================================
 * KODE SESI ABSENSI
 * =========================================================
 *
 * Tidak memakai counter Firestore.
 *
 * PK-2026-001-P01
 * sessionIndex = 0
 *
 * -> PK-2026-001-P01-S01
 */
export function formatAttendanceSessionCode(
  executionCode,
  sessionIndex
) {
  const base =
    String(
      executionCode || ""
    )
      .trim()
      .toUpperCase();

  const index =
    Number(
      sessionIndex
    );

  if (!base) {
    throw new Error(
      "executionCode wajib diisi untuk membuat kode Sesi Absensi."
    );
  }

  if (
    !Number.isInteger(
      index
    ) ||
    index < 0
  ) {
    throw new Error(
      "sessionIndex Sesi Absensi tidak valid."
    );
  }

  return `${base}-S${String(
    index + 1
  ).padStart(
    2,
    "0"
  )}`;
}

/**
 * =========================================================
 * PARSER KODE KEGIATAN
 * =========================================================
 *
 * PK-2026-014
 *
 * ->
 *
 * {
 *   prefix: "PK",
 *   year: 2026,
 *   sequence: 14,
 *   raw: "PK-2026-014"
 * }
 */
export function parseActivityCode(
  code
) {
  const raw =
    String(
      code || ""
    )
      .trim()
      .toUpperCase();

  const match =
    /^([A-Z]{2,10})-(\d{4})-(\d{3,})$/.exec(
      raw
    );

  if (!match) {
    return null;
  }

  return {
    prefix:
      match[1],

    year:
      Number(
        match[2]
      ),

    sequence:
      Number(
        match[3]
      ),

    raw,
  };
}

/**
 * Validasi kode Kegiatan.
 *
 * Contoh:
 *
 * isValidActivityCode(
 *   "PK-2026-014",
 *   "work_program"
 * )
 *
 * -> true
 */
export function isValidActivityCode(
  code,
  activityType = null
) {
  const parsed =
    parseActivityCode(
      code
    );

  if (!parsed) {
    return false;
  }

  if (activityType) {
    const scheme =
      getActivityCodeScheme(
        activityType
      );

    return (
      parsed.prefix ===
      scheme.prefix
    );
  }

  const registeredPrefixes =
    Object.values(
      CODE_SCHEMES.activity
    ).map(
      (scheme) =>
        scheme.prefix
    );

  return registeredPrefixes.includes(
    parsed.prefix
  );
}

/**
 * Helper label untuk UI.
 *
 * work_program -> Program Kerja
 * meeting      -> Meeting
 */
export function getActivityCodeLabel(
  activityType
) {
  return getActivityCodeScheme(
    activityType
  ).label;
}