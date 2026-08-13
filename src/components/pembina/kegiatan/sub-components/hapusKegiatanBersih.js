// src/components/pembina/kegiatan/sub-components/hapusKegiatanBersih.js
//
// Penghapusan Kegiatan dibuat terpusat supaya tombol Hapus di detail Pembina
// tidak meninggalkan data turunan (orphan) di Firestore.
//
// Urutan sengaja dibuat: anak -> ringkasan -> Kegiatan.
// Jika terjadi error di tengah proses, dokumen Kegiatan masih ada sehingga
// Pembina dapat mengulang proses penghapusan dengan aman.

import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const COLLECTION = Object.freeze({
  KEGIATAN: "Kegiatan",
  PROPOSAL: "Proposal",
  PELAKSANAAN: "PelaksanaanKegiatan",
  SESI: "SesiAbsensi",
  ABSENSI: "Absensi",
  RINGKASAN: "RingkasanAbsensi",
});

const MAX_BATCH_OPERATIONS = 400;

function snapshotRows(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ref: item.ref,
    ...item.data(),
  }));
}

function uniqueRefs(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const ref = row?.ref;
    if (!ref?.path) return;
    map.set(ref.path, ref);
  });

  return Array.from(map.values());
}

function getActivityId(data) {
  return data?.idKegiatan ?? data?.activityId ?? null;
}

function getExecutionId(data) {
  return data?.idPelaksanaan ?? data?.executionId ?? null;
}

function getSessionId(data) {
  return data?.idSesi ?? data?.sessionId ?? null;
}

function getMemberId(data) {
  return data?.idAnggota ?? data?.memberId ?? null;
}

function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  return (
    {
      hadir: "hadir",
      present: "hadir",
      terlambat: "terlambat",
      late: "terlambat",
      izin: "izin",
      excused: "izin",
      sakit: "sakit",
      sick: "sakit",
      alpa: "alpa",
      absent: "alpa",
    }[status] || status
  );
}

function isConfirmed(record) {
  const status = String(
    record?.statusVerifikasi ?? record?.verificationStatus ?? ""
  )
    .trim()
    .toLowerCase();

  return ["dikonfirmasi", "confirmed", "verified"].includes(status);
}

function collectCloudinaryAssets(proposals, attendance) {
  const assets = [];

  proposals.forEach((item) => {
    if (!item?.publicIdFile) return;
    assets.push({
      publicId: item.publicIdFile,
      resourceType: item.resourceTypeFile || "raw",
      sumber: "proposal",
    });
  });

  attendance.forEach((item) => {
    const document = item?.dokumenPendukung || item?.supportingDocument;
    if (!document?.publicIdFile) return;

    assets.push({
      publicId: document.publicIdFile,
      resourceType: document.resourceTypeFile || "image",
      sumber: "bukti_absensi",
    });
  });

  return assets;
}

async function deleteRefsInChunks(db, refs) {
  const unique = uniqueRefs(refs.map((ref) => ({ ref })));

  for (let index = 0; index < unique.length; index += MAX_BATCH_OPERATIONS) {
    const chunk = unique.slice(index, index + MAX_BATCH_OPERATIONS);
    const batch = writeBatch(db);

    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function writeSummaryChunks(db, summaries) {
  for (
    let index = 0;
    index < summaries.length;
    index += MAX_BATCH_OPERATIONS
  ) {
    const chunk = summaries.slice(index, index + MAX_BATCH_OPERATIONS);
    const batch = writeBatch(db);

    chunk.forEach(({ memberId, payload }) => {
      batch.set(doc(db, COLLECTION.RINGKASAN, memberId), payload, {
        merge: true,
      });
    });

    await batch.commit();
  }
}

function buildMemberSummary(memberId, attendanceRows, timestamp) {
  const confirmed = attendanceRows.filter(
    (record) => getMemberId(record) === memberId && isConfirmed(record)
  );

  const count = (status) =>
    confirmed.filter((record) => normalizeStatus(record.statusKehadiran ?? record.status) === status)
      .length;

  const hadir = count("hadir");
  const terlambat = count("terlambat");
  const izin = count("izin");
  const sakit = count("sakit");
  const alpa = count("alpa");
  const total = confirmed.length;
  const present = hadir + terlambat;
  const percentage = total ? Math.round((present / total) * 100) : 0;

  return {
    memberId,
    payload: {
      idAnggota: memberId,
      jumlahKegiatan: total,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
      persentaseKehadiran: percentage,

      // Compatibility sementara untuk komponen lama yang masih membaca
      // nama field berbahasa Inggris.
      totalActivities: total,
      presentCount: hadir,
      lateCount: terlambat,
      excusedCount: izin,
      sickCount: sakit,
      absentCount: alpa,
      attendancePercentage: percentage,

      diperbaruiPada: timestamp,
      updatedAt: timestamp,
    },
  };
}

/**
 * Menghapus satu Kegiatan beserta seluruh data turunannya di Firestore.
 *
 * Yang dibersihkan:
 * - Proposal yang terhubung ke Kegiatan
 * - PelaksanaanKegiatan
 * - SesiAbsensi
 * - Absensi pada kegiatan/sesi/pelaksanaan tersebut
 * - RingkasanAbsensi anggota yang terdampak dihitung ulang
 * - Dokumen Kegiatan sebagai langkah terakhir
 *
 * Pembacaan collection dilakukan penuh dengan sengaja. Skala aplikasi skripsi
 * kecil dan cara ini membuat cleanup kompatibel dengan field lama seperti
 * activityId/sessionId tanpa membutuhkan composite index tambahan.
 */
export async function hapusKegiatanBersih({
  db,
  activity,
  serverTimestamp,
}) {
  if (!db) {
    throw new Error("Firestore belum tersedia.");
  }

  if (!activity?.id) {
    throw new Error("ID Kegiatan tidak ditemukan.");
  }

  const activityId = activity.id;

  // Semua data dibaca sebelum delete agar relasi legacy tetap dapat ditemukan
  // walaupun sebagian dokumen tidak menyimpan idKegiatan secara langsung.
  const [
    proposalSnapshot,
    executionSnapshot,
    sessionSnapshot,
    attendanceSnapshot,
    summarySnapshot,
  ] = await Promise.all([
    getDocs(collection(db, COLLECTION.PROPOSAL)),
    getDocs(collection(db, COLLECTION.PELAKSANAAN)),
    getDocs(collection(db, COLLECTION.SESI)),
    getDocs(collection(db, COLLECTION.ABSENSI)),
    getDocs(collection(db, COLLECTION.RINGKASAN)),
  ]);

  const proposalRows = snapshotRows(proposalSnapshot);
  const executionRows = snapshotRows(executionSnapshot);
  const sessionRows = snapshotRows(sessionSnapshot);
  const attendanceRows = snapshotRows(attendanceSnapshot);
  const summaryRows = snapshotRows(summarySnapshot);

  const relatedProposals = proposalRows.filter(
    (item) =>
      getActivityId(item) === activityId ||
      (activity?.idProposal && item.id === activity.idProposal)
  );

  const relatedExecutions = executionRows.filter(
    (item) => getActivityId(item) === activityId
  );
  const executionIds = new Set(relatedExecutions.map((item) => item.id));

  const relatedSessions = sessionRows.filter(
    (item) =>
      getActivityId(item) === activityId ||
      executionIds.has(getExecutionId(item))
  );
  const sessionIds = new Set(relatedSessions.map((item) => item.id));

  const relatedAttendance = attendanceRows.filter(
    (item) =>
      getActivityId(item) === activityId ||
      executionIds.has(getExecutionId(item)) ||
      sessionIds.has(getSessionId(item))
  );
  const attendanceIds = new Set(relatedAttendance.map((item) => item.id));

  const affectedMemberIds = Array.from(
    new Set(relatedAttendance.map(getMemberId).filter(Boolean))
  );

  // Record yang akan dihapus dikeluarkan dari proyeksi sebelum ringkasan dihitung.
  const remainingAttendance = attendanceRows.filter(
    (item) => !attendanceIds.has(item.id)
  );

  const timestamp =
    typeof serverTimestamp === "function" ? serverTimestamp() : new Date();

  const nextSummaries = affectedMemberIds.map((memberId) =>
    buildMemberSummary(memberId, remainingAttendance, timestamp)
  );

  // Bila pernah ada RingkasanAbsensi lama dengan Auto ID, hapus duplikatnya.
  // Setelah itu hanya dokumen deterministik RingkasanAbsensi/{idAnggota}
  // yang akan dipertahankan.
  const legacySummaryRefs = summaryRows
    .filter((item) => {
      const memberId = getMemberId(item);
      return (
        memberId &&
        affectedMemberIds.includes(memberId) &&
        item.id !== memberId
      );
    })
    .map((item) => item.ref);

  const childRefs = [
    ...relatedAttendance.map((item) => item.ref),
    ...relatedSessions.map((item) => item.ref),
    ...relatedExecutions.map((item) => item.ref),
    ...relatedProposals.map((item) => item.ref),
    ...legacySummaryRefs,
  ];

  // 1. Bersihkan seluruh dokumen turunan terlebih dahulu.
  await deleteRefsInChunks(db, childRefs);

  // 2. Hitung ulang statistik anggota yang absensinya ikut terhapus.
  if (nextSummaries.length) {
    await writeSummaryChunks(db, nextSummaries);
  }

  // 3. Kegiatan dihapus PALING AKHIR. Dengan pola ini, error pada cleanup
  //    tidak langsung menghilangkan root Kegiatan dan proses dapat diulang.
  const finalBatch = writeBatch(db);
  finalBatch.delete(doc(db, COLLECTION.KEGIATAN, activityId));
  await finalBatch.commit();

  return {
    activityId,
    deleted: {
      proposal: relatedProposals.length,
      pelaksanaan: relatedExecutions.length,
      sesiAbsensi: relatedSessions.length,
      absensi: relatedAttendance.length,
      kegiatan: 1,
    },
    affectedMemberCount: affectedMemberIds.length,

    // Metadata ini dikembalikan untuk audit/debug. File Cloudinary tidak
    // dihapus dari browser karena destroy Cloudinary membutuhkan API secret
    // dan harus dilakukan lewat endpoint server yang terautentikasi.
    cloudinaryAssets: collectCloudinaryAssets(
      relatedProposals,
      relatedAttendance
    ),
  };
}
