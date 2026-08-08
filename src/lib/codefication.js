// src/lib/codefication.js
// ============================================================
// CENTRALIZED ID CODIFICATION
// ============================================================
//
// File ini menjadi satu-satunya source of truth untuk:
//
// 1. Format ID administratif/reference ID.
// 2. Prefix tiap entity.
// 3. Sequence/nomor urut.
// 4. Firestore atomic counter.
// 5. Generator ID.
// 6. Formatter ID turunan.
// 7. Parser dan validator ID.
//
// PENTING:
//
// Firestore document.id / Auto ID tetap menjadi PRIMARY KEY
// dan tetap digunakan untuk seluruh relasi database.
//
// Contoh:
//
// Firestore:
// Kegiatan/x7Kjs92Ab...
//
// Data:
// {
//   referenceId: "PK-2026-001"
// }
//
// Child:
// {
//   activityId: "x7Kjs92Ab..."
// }
//
// Jadi:
//
// document.id  = ID teknis database
// referenceId  = ID administratif yang dibaca manusia
//
// ============================================================

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase-config";


// ============================================================
// COLLECTION COUNTER
// ============================================================

/**
 * Collection internal untuk menyimpan sequence.
 *
 * Contoh:
 *
 * SystemCounters
 * ├── PK_2026
 * │   current: 12
 * │
 * └── MT_2026
 *     current: 4
 */
export const REFERENCE_ID_COUNTER_COLLECTION =
  "SystemCounters";


// ============================================================
// SCHEME / PREFIX
// ============================================================

/**
 * Semua format ID administratif didefinisikan di sini.
 *
 * Saat ini:
 *
 * Program Kerja
 * PK-2026-001
 *
 * Meeting
 * MT-2026-001
 *
 * Jika nanti ada entity baru, cukup tambahkan di sini.
 */
export const REFERENCE_ID_SCHEMES = Object.freeze({
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
});


// ============================================================
// BASIC FORMATTER
// ============================================================

/**
 * Memastikan tahun valid.
 *
 * normalizeReferenceYear(2026)
 * -> 2026
 */
export function normalizeReferenceYear(
  value = new Date().getFullYear()
) {
  const year = Number(value);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 9999
  ) {
    throw new Error(
      "Tahun ID referensi tidak valid."
    );
  }

  return year;
}


/**
 * Format nomor urut.
 *
 * 1   -> 001
 * 2   -> 002
 * 12  -> 012
 * 125 -> 125
 */
export function formatReferenceSequence(
  sequence,
  length = 3
) {
  const numericSequence = Number(sequence);

  if (
    !Number.isInteger(numericSequence) ||
    numericSequence < 1
  ) {
    throw new Error(
      "Nomor urut ID referensi harus berupa bilangan bulat positif."
    );
  }

  return String(numericSequence).padStart(
    length,
    "0"
  );
}


/**
 * Formatter generic.
 *
 * formatReferenceId({
 *   prefix: "PK",
 *   year: 2026,
 *   sequence: 1
 * })
 *
 * hasil:
 *
 * PK-2026-001
 */
export function formatReferenceId({
  prefix,
  year,
  sequence,
  separator = "-",
  sequenceLength = 3,
}) {
  const normalizedPrefix = String(
    prefix || ""
  )
    .trim()
    .toUpperCase();

  if (!normalizedPrefix) {
    throw new Error(
      "Prefix ID referensi wajib diisi."
    );
  }

  const normalizedYear =
    normalizeReferenceYear(year);

  const formattedSequence =
    formatReferenceSequence(
      sequence,
      sequenceLength
    );

  return [
    normalizedPrefix,
    normalizedYear,
    formattedSequence,
  ].join(separator);
}


// ============================================================
// ACTIVITY SCHEME
// ============================================================

/**
 * Mengambil konfigurasi berdasarkan activityType.
 *
 * work_program
 * ->
 * {
 *   prefix: "PK",
 *   label: "Program Kerja"
 * }
 */
export function getActivityReferenceIdScheme(
  activityType
) {
  const scheme =
    REFERENCE_ID_SCHEMES.activity?.[
      activityType
    ];

  if (!scheme) {
    throw new Error(
      `ID referensi untuk activityType "${activityType}" belum terdaftar.`
    );
  }

  return scheme;
}


/**
 * Mendapat label berdasarkan activityType.
 *
 * work_program -> Program Kerja
 * meeting      -> Meeting
 */
export function getActivityReferenceIdLabel(
  activityType
) {
  return getActivityReferenceIdScheme(
    activityType
  ).label;
}


// ============================================================
// COUNTER KEY
// ============================================================

/**
 * Membuat nama document counter.
 *
 * PK + 2026
 * -> PK_2026
 *
 * MT + 2026
 * -> MT_2026
 */
export function buildReferenceCounterKey({
  prefix,
  year,
}) {
  const normalizedPrefix = String(
    prefix || ""
  )
    .trim()
    .toUpperCase();

  if (!normalizedPrefix) {
    throw new Error(
      "Prefix counter ID referensi wajib diisi."
    );
  }

  const normalizedYear =
    normalizeReferenceYear(year);

  return `${normalizedPrefix}_${normalizedYear}`;
}


// ============================================================
// ATOMIC SEQUENCE
// ============================================================

/**
 * Reserve nomor urut selanjutnya secara atomic.
 *
 * Menggunakan Firestore transaction supaya:
 *
 * User A -> PK-2026-001
 * User B -> PK-2026-002
 *
 * tidak mungkin keduanya memperoleh 001
 * pada waktu bersamaan.
 *
 *
 * Sequence TIDAK digunakan ulang.
 *
 * Contoh:
 *
 * PK-2026-001
 * PK-2026-002
 * PK-2026-003
 *
 * PK-2026-003 kemudian dihapus.
 *
 * ID berikutnya tetap:
 *
 * PK-2026-004
 *
 * bukan PK-2026-003.
 */
export async function reserveNextReferenceSequence({
  prefix,
  year = new Date().getFullYear(),
}) {
  const normalizedPrefix = String(
    prefix || ""
  )
    .trim()
    .toUpperCase();

  const normalizedYear =
    normalizeReferenceYear(year);

  if (!normalizedPrefix) {
    throw new Error(
      "Prefix ID referensi wajib diisi."
    );
  }

  const counterKey =
    buildReferenceCounterKey({
      prefix: normalizedPrefix,
      year: normalizedYear,
    });

  const counterRef = doc(
    db,
    REFERENCE_ID_COUNTER_COLLECTION,
    counterKey
  );

  return runTransaction(
    db,
    async (transaction) => {
      const snapshot =
        await transaction.get(counterRef);

      const current = snapshot.exists()
        ? Number(
            snapshot.data()?.current || 0
          )
        : 0;

      const next = current + 1;

      transaction.set(
        counterRef,
        {
          prefix: normalizedPrefix,
          year: normalizedYear,

          current: next,

          updatedAt: serverTimestamp(),

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


// ============================================================
// GENERIC ID GENERATOR
// ============================================================

/**
 * Generic generator.
 *
 * const id = await generateReferenceId({
 *   prefix: "PK",
 *   year: 2026
 * });
 *
 * hasil:
 *
 * PK-2026-001
 */
export async function generateReferenceId({
  prefix,
  year = new Date().getFullYear(),
  separator = "-",
  sequenceLength = 3,
}) {
  const normalizedYear =
    normalizeReferenceYear(year);

  const sequence =
    await reserveNextReferenceSequence({
      prefix,
      year: normalizedYear,
    });

  return formatReferenceId({
    prefix,
    year: normalizedYear,
    sequence,
    separator,
    sequenceLength,
  });
}


// ============================================================
// ACTIVITY ID GENERATOR
// ============================================================

/**
 * Generator khusus Kegiatan.
 *
 *
 * PROGRAM KERJA
 *
 * await generateActivityReferenceId(
 *   "work_program",
 *   { year: 2026 }
 * );
 *
 * ->
 *
 * PK-2026-001
 *
 *
 * MEETING
 *
 * await generateActivityReferenceId(
 *   "meeting",
 *   { year: 2026 }
 * );
 *
 * ->
 *
 * MT-2026-001
 */
export async function generateActivityReferenceId(
  activityType,
  {
    year = new Date().getFullYear(),
  } = {}
) {
  const scheme =
    getActivityReferenceIdScheme(
      activityType
    );

  return generateReferenceId({
    prefix: scheme.prefix,
    year,
  });
}


// ============================================================
// CHILD ID FORMATTER
// ============================================================
//
// Untuk sekarang helper ini OPTIONAL.
//
// PelaksanaanKegiatan dan SesiAbsensi
// TIDAK WAJIB menyimpan referenceId.
//
// Firestore Auto ID tetap cukup.
//
// Tetapi kalau suatu saat dibutuhkan untuk:
// - laporan,
// - debugging,
// - export,
// - tampilan administrator,
//
// formatter sudah tersedia.
// ============================================================


/**
 * Format ID Pelaksanaan.
 *
 * activityReferenceId:
 * PK-2026-001
 *
 * occurrenceIndex:
 * 0
 *
 * hasil:
 *
 * PK-2026-001-P01
 */
export function formatExecutionReferenceId(
  activityReferenceId,
  occurrenceIndex
) {
  const base = String(
    activityReferenceId || ""
  )
    .trim()
    .toUpperCase();

  const index = Number(
    occurrenceIndex
  );

  if (!base) {
    throw new Error(
      "referenceId Kegiatan wajib diisi untuk membuat ID Pelaksanaan."
    );
  }

  if (
    !Number.isInteger(index) ||
    index < 0
  ) {
    throw new Error(
      "occurrenceIndex Pelaksanaan tidak valid."
    );
  }

  const executionNumber = String(
    index + 1
  ).padStart(2, "0");

  return `${base}-P${executionNumber}`;
}


/**
 * Format ID Sesi Absensi.
 *
 * executionReferenceId:
 * PK-2026-001-P01
 *
 * sessionIndex:
 * 0
 *
 * hasil:
 *
 * PK-2026-001-P01-S01
 */
export function formatAttendanceSessionReferenceId(
  executionReferenceId,
  sessionIndex
) {
  const base = String(
    executionReferenceId || ""
  )
    .trim()
    .toUpperCase();

  const index = Number(
    sessionIndex
  );

  if (!base) {
    throw new Error(
      "referenceId Pelaksanaan wajib diisi untuk membuat ID Sesi Absensi."
    );
  }

  if (
    !Number.isInteger(index) ||
    index < 0
  ) {
    throw new Error(
      "sessionIndex Sesi Absensi tidak valid."
    );
  }

  const sessionNumber = String(
    index + 1
  ).padStart(2, "0");

  return `${base}-S${sessionNumber}`;
}


// ============================================================
// PARSER
// ============================================================

/**
 * Parse ID Kegiatan.
 *
 * PK-2026-014
 *
 * menjadi:
 *
 * {
 *   prefix: "PK",
 *   year: 2026,
 *   sequence: 14,
 *   raw: "PK-2026-014"
 * }
 */
export function parseActivityReferenceId(
  referenceId
) {
  const raw = String(
    referenceId || ""
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
    prefix: match[1],
    year: Number(match[2]),
    sequence: Number(match[3]),
    raw,
  };
}


// ============================================================
// VALIDATOR
// ============================================================

/**
 * Validasi ID Kegiatan.
 *
 * isValidActivityReferenceId(
 *   "PK-2026-014"
 * )
 *
 * -> true
 *
 *
 * Dengan activityType:
 *
 * isValidActivityReferenceId(
 *   "PK-2026-014",
 *   "work_program"
 * )
 *
 * -> true
 *
 *
 * isValidActivityReferenceId(
 *   "MT-2026-014",
 *   "work_program"
 * )
 *
 * -> false
 */
export function isValidActivityReferenceId(
  referenceId,
  activityType = null
) {
  const parsed =
    parseActivityReferenceId(
      referenceId
    );

  if (!parsed) {
    return false;
  }

  if (activityType) {
    const scheme =
      getActivityReferenceIdScheme(
        activityType
      );

    return (
      parsed.prefix ===
      scheme.prefix
    );
  }

  const registeredPrefixes =
    Object.values(
      REFERENCE_ID_SCHEMES.activity
    ).map(
      (scheme) => scheme.prefix
    );

  return registeredPrefixes.includes(
    parsed.prefix
  );
}


// ============================================================
// REFERENCE ID DISPLAY HELPER
// ============================================================

/**
 * Helper sederhana untuk UI.
 *
 * Jika ID tersedia:
 *
 * PK-2026-001
 *
 * Jika belum tersedia:
 *
 * -
 */
export function formatReferenceIdDisplay(
  referenceId
) {
  const value = String(
    referenceId || ""
  ).trim();

  return value || "-";
}


/**
 * Format ID + nama untuk kebutuhan dropdown,
 * tabel, laporan, atau demo.
 *
 * formatActivityDisplay({
 *   referenceId: "PK-2026-001",
 *   title: "Class Meeting 2026"
 * })
 *
 * ->
 *
 * PK-2026-001 · Class Meeting 2026
 */
export function formatActivityDisplay({
  referenceId,
  title,
} = {}) {
  const id =
    formatReferenceIdDisplay(
      referenceId
    );

  const activityTitle = String(
    title || ""
  ).trim();

  if (
    id === "-" &&
    !activityTitle
  ) {
    return "-";
  }

  if (id === "-") {
    return activityTitle;
  }

  if (!activityTitle) {
    return id;
  }

  return `${id} · ${activityTitle}`;
}


// ============================================================
// USAGE
// ============================================================
//
// Di SeleksiKegiatanOverlay.jsx:
//
// import {
//   generateActivityReferenceId,
// } from "@/lib/codefication";
//
//
// Saat submit:
//
// const referenceYear =
//   Number(
//     String(
//       form.startDate || ""
//     ).slice(0, 4)
//   ) ||
//   new Date().getFullYear();
//
//
// const referenceId =
//   await generateActivityReferenceId(
//     activityType,
//     {
//       year: referenceYear,
//     }
//   );
//
//
// createdActivity = await addDoc(
//   "Kegiatan",
//   {
//     referenceId,
//
//     title,
//     activityType,
//
//     ...
//   }
// );
//
//
// ============================================================
// HASIL
// ============================================================
//
// Firestore:
//
// Kegiatan
// └── xKs82JhP9...          ← Auto ID Firestore
//
// isi:
//
// {
//   referenceId: "PK-2026-001",
//   title: "Class Meeting 2026",
//   activityType: "work_program"
// }
//
//
//
// PelaksanaanKegiatan:
//
// {
//   activityId: "xKs82JhP9..."
// }
//
//
//
// Jadi hubungan database TETAP:
//
// Kegiatan document.id
//        ↓
//    activityId
//        ↓
// PelaksanaanKegiatan
//
//
// sedangkan yang dilihat user:
//
// ID Kegiatan
// PK-2026-001
//
// ============================================================