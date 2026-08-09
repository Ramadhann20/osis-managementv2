// src/lib/codefication.js
// Source of truth ID referensi yang dibaca manusia.
// Firestore document.id tetap menjadi primary key teknis
// dan foreign key relasi.

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase-config";


// ============================================================
// COLLECTION PENGHITUNG
// ============================================================

export const KOLEKSI_PENGHITUNG_ID =
  "PenghitungSistem";


// ============================================================
// SKEMA ID REFERENSI
// ============================================================

export const SKEMA_ID_REFERENSI =
  Object.freeze({
    kegiatan: Object.freeze({
      program_kerja: Object.freeze({
        awalan: "PK",
        label: "Program Kerja",
      }),

      rapat: Object.freeze({
        awalan: "MT",
        label: "Rapat",
      }),
    }),
  });


// ============================================================
// NORMALISASI
// ============================================================

export function normalisasiTahun(
  nilai = new Date().getFullYear()
) {
  const tahun = Number(nilai);

  if (
    !Number.isInteger(tahun) ||
    tahun < 2000 ||
    tahun > 9999
  ) {
    throw new Error(
      "Tahun ID referensi tidak valid."
    );
  }

  return tahun;
}


// ============================================================
// FORMAT NOMOR URUT
// ============================================================

export function formatNomorUrut(
  nomorUrut,
  panjang = 3
) {
  const nomor = Number(nomorUrut);

  if (
    !Number.isInteger(nomor) ||
    nomor < 1
  ) {
    throw new Error(
      "Nomor urut ID referensi harus berupa bilangan bulat positif."
    );
  }

  return String(nomor).padStart(
    panjang,
    "0"
  );
}


// ============================================================
// FORMAT ID REFERENSI
// ============================================================

export function formatIdReferensi({
  awalan,
  tahun,
  nomorUrut,
  pemisah = "-",
  panjangNomor = 3,
}) {
  const awalanNormal = String(
    awalan || ""
  )
    .trim()
    .toUpperCase();

  if (!awalanNormal) {
    throw new Error(
      "Awalan ID referensi wajib diisi."
    );
  }

  return [
    awalanNormal,
    normalisasiTahun(tahun),
    formatNomorUrut(
      nomorUrut,
      panjangNomor
    ),
  ].join(pemisah);
}


// ============================================================
// SKEMA KEGIATAN
// ============================================================

export function ambilSkemaIdKegiatan(
  jenisKegiatan
) {
  const skema =
    SKEMA_ID_REFERENSI.kegiatan?.[
      jenisKegiatan
    ];

  if (!skema) {
    throw new Error(
      `Skema ID untuk jenis kegiatan "${jenisKegiatan}" belum terdaftar.`
    );
  }

  return skema;
}


// ============================================================
// KUNCI COUNTER
// ============================================================

export function buatKunciPenghitung({
  awalan,
  tahun,
}) {
  const awalanNormal = String(
    awalan || ""
  )
    .trim()
    .toUpperCase();

  if (!awalanNormal) {
    throw new Error(
      "Awalan penghitung wajib diisi."
    );
  }

  return `${awalanNormal}_${normalisasiTahun(
    tahun
  )}`;
}


// ============================================================
// ATOMIC COUNTER
// ============================================================

export async function ambilNomorUrutBerikutnya({
  awalan,
  tahun = new Date().getFullYear(),
}) {
  const awalanNormal = String(
    awalan || ""
  )
    .trim()
    .toUpperCase();

  const tahunNormal =
    normalisasiTahun(tahun);

  if (!awalanNormal) {
    throw new Error(
      "Awalan ID referensi wajib diisi."
    );
  }

  const kunci =
    buatKunciPenghitung({
      awalan: awalanNormal,
      tahun: tahunNormal,
    });

  const refPenghitung = doc(
    db,
    KOLEKSI_PENGHITUNG_ID,
    kunci
  );

  return runTransaction(
    db,
    async (transaksi) => {
      const snapshot =
        await transaksi.get(
          refPenghitung
        );

      const nomorTerakhir =
        snapshot.exists()
          ? Number(
              snapshot.data()
                ?.nomorTerakhir || 0
            )
          : 0;

      const nomorBerikutnya =
        nomorTerakhir + 1;

      transaksi.set(
        refPenghitung,
        {
          awalan:
            awalanNormal,

          tahun:
            tahunNormal,

          nomorTerakhir:
            nomorBerikutnya,

          diperbaruiPada:
            serverTimestamp(),

          ...(snapshot.exists()
            ? {}
            : {
                dibuatPada:
                  serverTimestamp(),
              }),
        },

        {
          merge: true,
        }
      );

      return nomorBerikutnya;
    }
  );
}


// ============================================================
// GENERATOR GENERIC
// ============================================================

export async function buatIdReferensi({
  awalan,
  tahun = new Date().getFullYear(),
  pemisah = "-",
  panjangNomor = 3,
}) {
  const tahunNormal =
    normalisasiTahun(tahun);

  const nomorUrut =
    await ambilNomorUrutBerikutnya({
      awalan,
      tahun: tahunNormal,
    });

  return formatIdReferensi({
    awalan,
    tahun: tahunNormal,
    nomorUrut,
    pemisah,
    panjangNomor,
  });
}


// ============================================================
// GENERATOR ID KEGIATAN
// ============================================================

export async function buatIdReferensiKegiatan(
  jenisKegiatan,
  {
    tahun = new Date().getFullYear(),
  } = {}
) {
  const skema =
    ambilSkemaIdKegiatan(
      jenisKegiatan
    );

  return buatIdReferensi({
    awalan: skema.awalan,
    tahun,
  });
}


// ============================================================
// FORMAT ID TURUNAN PELAKSANAAN
// ============================================================

export function formatIdReferensiPelaksanaan(
  idReferensiKegiatan,
  indeksPelaksanaan
) {
  const dasar = String(
    idReferensiKegiatan || ""
  )
    .trim()
    .toUpperCase();

  const indeks = Number(
    indeksPelaksanaan
  );

  if (!dasar) {
    throw new Error(
      "ID referensi Kegiatan wajib diisi."
    );
  }

  if (
    !Number.isInteger(indeks) ||
    indeks < 0
  ) {
    throw new Error(
      "Indeks Pelaksanaan tidak valid."
    );
  }

  return `${dasar}-P${String(
    indeks + 1
  ).padStart(2, "0")}`;
}


// ============================================================
// FORMAT ID TURUNAN SESI
// ============================================================

export function formatIdReferensiSesi(
  idReferensiPelaksanaan,
  indeksSesi
) {
  const dasar = String(
    idReferensiPelaksanaan || ""
  )
    .trim()
    .toUpperCase();

  const indeks = Number(
    indeksSesi
  );

  if (!dasar) {
    throw new Error(
      "ID referensi Pelaksanaan wajib diisi."
    );
  }

  if (
    !Number.isInteger(indeks) ||
    indeks < 0
  ) {
    throw new Error(
      "Indeks Sesi tidak valid."
    );
  }

  return `${dasar}-S${String(
    indeks + 1
  ).padStart(2, "0")}`;
}


// ============================================================
// PARSER
// ============================================================

export function parseIdReferensiKegiatan(
  idReferensi
) {
  const mentah = String(
    idReferensi || ""
  )
    .trim()
    .toUpperCase();

  const cocok =
    /^([A-Z]{2,10})-(\d{4})-(\d{3,})$/.exec(
      mentah
    );

  if (!cocok) {
    return null;
  }

  return {
    awalan:
      cocok[1],

    tahun:
      Number(cocok[2]),

    nomorUrut:
      Number(cocok[3]),

    mentah,
  };
}


// ============================================================
// VALIDATOR
// ============================================================

export function validasiIdReferensiKegiatan(
  idReferensi,
  jenisKegiatan = null
) {
  const hasil =
    parseIdReferensiKegiatan(
      idReferensi
    );

  if (!hasil) {
    return false;
  }

  if (jenisKegiatan) {
    return (
      hasil.awalan ===
      ambilSkemaIdKegiatan(
        jenisKegiatan
      ).awalan
    );
  }

  const semuaAwalan =
    Object.values(
      SKEMA_ID_REFERENSI.kegiatan
    ).map(
      (skema) => skema.awalan
    );

  return semuaAwalan.includes(
    hasil.awalan
  );
}