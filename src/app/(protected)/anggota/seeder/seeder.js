"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";

import { useDb } from "@/context/DbContext";

import {
  users,
  organisation,
  academicPeriods,
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
  systemContacts,
} from "@/lib/dummy/dummy";

/*
 * Urutan collection disusun berdasarkan keterkaitan datanya.
 *
 * Catatan:
 * - Seeder hanya mengisi Cloud Firestore.
 * - Seeder tidak membuat akun Firebase Authentication.
 * - Field id digunakan sebagai document ID Firestore.
 * - Field id tidak disimpan ulang di dalam dokumen.
 */
const seedableDatasets = [
  {
    key: "organisation",
    label: "Organisasi",
    collectionName: "Organisasi",
    description:
      "Identitas sekolah, organisasi OSIS, periode aktif, alamat, dan kontak.",
    documents: [organisation],
  },

  {
    key: "academicPeriods",
    label: "Periode",
    collectionName: "Periode",
    description:
      "Master periode kepengurusan OSIS dan tahun ajaran sekolah.",
    documents: academicPeriods,
  },

  {
    key: "users",
    label: "Users",
    collectionName: "Users",
    description:
      "Profil pengguna Firestore dan hak akses. Data ini tidak membuat akun Firebase Authentication.",
    documents: users,
  },

  {
    key: "divisions",
    label: "Divisi",
    collectionName: "Divisi",
    description:
      "Master data seksi bidang, nama divisi, kode, dan koordinator.",
    documents: divisions,
  },

  {
    key: "members",
    label: "Anggota",
    collectionName: "Anggota",
    description:
      "Biodata anggota, calon anggota, jabatan, sekbid, dan status keanggotaan.",
    documents: members,
  },

  {
    key: "registrationReviewLogs",
    label: "Review Pendaftaran",
    collectionName: "ReviewPendaftaran",
    description:
      "Histori pemeriksaan, persetujuan, penolakan, dan revisi pendaftaran anggota.",
    documents: registrationReviewLogs,
  },

  {
    key: "activities",
    label: "Kegiatan",
    collectionName: "Kegiatan",
    description:
      "Data rapat, program kerja, agenda, workshop, dan kegiatan organisasi.",
    documents: activities,
  },

  {
    key: "attendanceSessions",
    label: "Sesi Absensi",
    collectionName: "SesiAbsensi",
    description:
      "Sesi pencatatan kehadiran yang terhubung dengan kegiatan dan tanggal pelaksanaan.",
    documents: attendanceSessions,
  },

  {
    key: "attendanceRecords",
    label: "Absensi",
    collectionName: "Absensi",
    description:
      "Riwayat kehadiran anggota pada setiap kegiatan dan sesi absensi.",
    documents: attendanceRecords,
  },

  {
    key: "attendanceSummaries",
    label: "Ringkasan Absensi Anggota",
    collectionName: "RingkasanAbsensi",
    description:
      "Data agregasi kehadiran setiap anggota untuk dashboard dan laporan.",
    documents: attendanceSummaries,
  },

  {
    key: "organisationAttendanceSummaries",
    label: "Ringkasan Absensi Organisasi",
    collectionName: "RingkasanAbsensiOrganisasi",
    description:
      "Data agregasi kehadiran seluruh organisasi berdasarkan periode.",
    documents: organisationAttendanceSummaries,
  },

  {
    key: "proposals",
    label: "Proposal",
    collectionName: "Proposal",
    description:
      "Proposal kegiatan, file, versi, pengaju, status review, dan catatan pembina.",
    documents: proposals,
  },

  {
    key: "announcements",
    label: "Pengumuman",
    collectionName: "Pengumuman",
    description:
      "Pengumuman draf, terjadwal, diterbitkan, diarsipkan, serta target audiens.",
    documents: announcements,
  },

  {
    key: "notifications",
    label: "Notifikasi",
    collectionName: "Notifikasi",
    description:
      "Notifikasi pengguna untuk pendaftaran, proposal, kegiatan, dan pengumuman.",
    documents: notifications,
  },

  {
    key: "contacts",
    label: "Kontak Sistem",
    collectionName: "KontakSistem",
    description:
      "Kontak sekretaris, pembina, dan pihak yang dapat dihubungi pengguna.",
    documents: [
      {
        id: "osis-sma-mutiara-2",
        ...systemContacts,
      },
    ],
  },
];

/**
 * Memeriksa string tanggal dengan format ISO lengkap.
 *
 * Contoh yang dikonversi menjadi Firestore Timestamp:
 * 2024-10-15T08:00:00+07:00
 * 2024-10-15T01:00:00Z
 *
 * Contoh yang tetap menjadi string:
 * 2024-10-15
 */
function isIsoDateTime(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value
    )
  );
}

/**
 * Mengubah seluruh string ISO datetime menjadi Firestore Timestamp.
 * Object dan array diproses secara rekursif.
 */
function transformForFirestore(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (isIsoDateTime(value)) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return Timestamp.fromDate(date);
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformForFirestore(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        transformForFirestore(nestedValue),
      ])
    );
  }

  return value;
}

/**
 * Mengambil field id sebagai document ID.
 * Field id tidak ikut disimpan di dalam payload Firestore.
 */
function prepareDocument(documentData) {
  if (!documentData || typeof documentData !== "object") {
    throw new Error("Dummy document harus berupa object.");
  }

  const { id, ...payload } = documentData;

  if (!id) {
    throw new Error(
      "Setiap dummy document wajib memiliki field id."
    );
  }

  return {
    id,
    payload: transformForFirestore(payload),
  };
}

/**
 * Label yang ditampilkan pada pilihan dokumen seeder.
 */
function getItemLabel(item) {
  return (
    item.fullName ||
    item.title ||
    item.name ||
    item.label ||
    item.periodLabel ||
    item.academicYear ||
    item.period ||
    item.email ||
    item.code ||
    item.id
  );
}

export default function SeederPage() {
  const { setDoc, deleteDoc, deleteCollection } = useDb();

  const [selectedItems, setSelectedItems] = useState(() =>
    Object.fromEntries(
      seedableDatasets.map((dataset) => [
        dataset.key,
        dataset.documents?.[0]?.id || "",
      ])
    )
  );

  const [busyAction, setBusyAction] = useState("");

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    label: "",
  });

  const [logs, setLogs] = useState([]);

  const seederEnabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_FIREBASE_SEEDER ===
      "true";

  const totalDocuments = useMemo(() => {
    return seedableDatasets.reduce(
      (total, dataset) =>
        total + (dataset.documents?.length || 0),
      0
    );
  }, []);

  function addLog(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString(
      "id-ID"
    );

    setLogs((currentLogs) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        timestamp,
      },
      ...currentLogs,
    ]);
  }

  function updateSelectedItem(datasetKey, documentId) {
    setSelectedItems((currentItems) => ({
      ...currentItems,
      [datasetKey]: documentId,
    }));
  }

  /**
   * Menulis satu dokumen dengan document ID tetap.
   */
  async function seedDocument(dataset, rawDocument) {
    const { id, payload } = prepareDocument(rawDocument);

    await setDoc(
      dataset.collectionName,
      id,
      payload
    );

    return id;
  }

  /**
   * Inject satu item yang dipilih.
   */
  async function handleSeedSingle(dataset) {
    const selectedId = selectedItems[dataset.key];

    const selectedDocument = dataset.documents.find(
      (item) => item.id === selectedId
    );

    if (!selectedDocument) {
      addLog(
        `Dokumen ${dataset.label} belum dipilih.`,
        "error"
      );

      return;
    }

    const actionKey = `seed-item:${dataset.key}:${selectedId}`;

    setBusyAction(actionKey);

    try {
      await seedDocument(
        dataset,
        selectedDocument
      );

      addLog(
        `${dataset.collectionName}/${selectedId} berhasil di-inject.`,
        "success"
      );
    } catch (error) {
      console.error(
        "SEED SINGLE ERROR:",
        error
      );

      addLog(
        `Gagal inject ${dataset.collectionName}/${selectedId}: ${
          error?.message || "Terjadi kesalahan."
        }`,
        "error"
      );
    } finally {
      setBusyAction("");
    }
  }

  /**
   * Menghapus satu item yang dipilih.
   */
  async function handleDeleteSingle(dataset) {
    const selectedId = selectedItems[dataset.key];

    if (!selectedId) {
      addLog(
        `Dokumen ${dataset.label} belum dipilih.`,
        "error"
      );

      return;
    }

    const confirmed = window.confirm(
      `Hapus ${dataset.collectionName}/${selectedId} dari Firestore?`
    );

    if (!confirmed) {
      return;
    }

    const actionKey = `delete-item:${dataset.key}:${selectedId}`;

    setBusyAction(actionKey);

    try {
      await deleteDoc(
        dataset.collectionName,
        selectedId
      );

      addLog(
        `${dataset.collectionName}/${selectedId} berhasil dihapus.`,
        "success"
      );
    } catch (error) {
      console.error(
        "DELETE SINGLE ERROR:",
        error
      );

      addLog(
        `Gagal menghapus ${dataset.collectionName}/${selectedId}: ${
          error?.message || "Terjadi kesalahan."
        }`,
        "error"
      );
    } finally {
      setBusyAction("");
    }
  }

  /**
   * Inject seluruh dokumen pada satu collection.
   */
  async function handleSeedDataset(dataset) {
    if (!dataset.documents?.length) {
      addLog(
        `Dataset ${dataset.label} kosong.`,
        "error"
      );

      return;
    }

    const actionKey = `seed-dataset:${dataset.key}`;

    setBusyAction(actionKey);

    setProgress({
      current: 0,
      total: dataset.documents.length,
      label: dataset.label,
    });

    try {
      for (
        let index = 0;
        index < dataset.documents.length;
        index += 1
      ) {
        const documentData =
          dataset.documents[index];

        await seedDocument(
          dataset,
          documentData
        );

        setProgress({
          current: index + 1,
          total: dataset.documents.length,
          label: dataset.label,
        });
      }

      addLog(
        `${dataset.documents.length} dokumen ${dataset.collectionName} berhasil di-inject.`,
        "success"
      );
    } catch (error) {
      console.error(
        "SEED DATASET ERROR:",
        error
      );

      addLog(
        `Gagal inject ${dataset.label}: ${
          error?.message || "Terjadi kesalahan."
        }`,
        "error"
      );
    } finally {
      setBusyAction("");

      setProgress({
        current: 0,
        total: 0,
        label: "",
      });
    }
  }

  /**
   * Menghapus satu collection.
   */
  async function handleDeleteDataset(dataset) {
    const confirmed = window.confirm(
      `Hapus seluruh collection ${dataset.collectionName}?`
    );

    if (!confirmed) {
      return;
    }

    const actionKey = `delete-dataset:${dataset.key}`;

    setBusyAction(actionKey);

    try {
      await deleteCollection(
        dataset.collectionName
      );

      addLog(
        `Seluruh collection ${dataset.collectionName} berhasil dihapus.`,
        "success"
      );
    } catch (error) {
      console.error(
        "DELETE DATASET ERROR:",
        error
      );

      addLog(
        `Gagal menghapus collection ${dataset.collectionName}: ${
          error?.message || "Terjadi kesalahan."
        }`,
        "error"
      );
    } finally {
      setBusyAction("");
    }
  }

  /**
   * Inject seluruh dataset.
   *
   * Dokumen dengan ID sama akan ditimpa.
   * Dokumen lama dengan ID berbeda tidak otomatis terhapus.
   */
  async function handleSeedAll() {
    const confirmed = window.confirm(
      `Inject ${totalDocuments} dokumen dummy ke ${seedableDatasets.length} collection? Data dengan ID yang sama akan ditimpa.`
    );

    if (!confirmed) {
      return;
    }

    setBusyAction("seed-all");

    setProgress({
      current: 0,
      total: totalDocuments,
      label: "Memulai proses...",
    });

    let completed = 0;

    try {
      for (const dataset of seedableDatasets) {
        if (!dataset.documents?.length) {
          addLog(
            `Dataset ${dataset.label} kosong dan dilewati.`,
            "info"
          );

          continue;
        }

        for (const documentData of dataset.documents) {
          setProgress({
            current: completed,
            total: totalDocuments,
            label: dataset.label,
          });

          await seedDocument(
            dataset,
            documentData
          );

          completed += 1;

          setProgress({
            current: completed,
            total: totalDocuments,
            label: dataset.label,
          });
        }

        addLog(
          `${dataset.collectionName}: ${dataset.documents.length} dokumen selesai.`,
          "success"
        );
      }

      addLog(
        `${completed} dokumen dari seluruh collection berhasil di-inject.`,
        "success"
      );
    } catch (error) {
      console.error(
        "SEED ALL ERROR:",
        error
      );

      addLog(
        `Proses inject semua berhenti pada dokumen ke-${
          completed + 1
        }: ${error?.message || "Terjadi kesalahan."}`,
        "error"
      );
    } finally {
      setBusyAction("");

      setProgress({
        current: 0,
        total: 0,
        label: "",
      });
    }
  }

  /**
   * Menghapus seluruh collection dummy.
   *
   * Collection dihapus dari bagian yang paling bergantung
   * menuju collection master.
   */
  async function handleDeleteAll() {
    const confirmed = window.confirm(
      "Hapus SEMUA collection dummy? Tindakan ini tidak dapat dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.confirm(
      "Konfirmasi terakhir: lanjutkan menghapus seluruh data dummy Firestore?"
    );

    if (!secondConfirmation) {
      return;
    }

    setBusyAction("delete-all");

    setProgress({
      current: 0,
      total: seedableDatasets.length,
      label: "Menghapus collection...",
    });

    let completed = 0;

    try {
      const reversedDatasets = [
        ...seedableDatasets,
      ].reverse();

      for (const dataset of reversedDatasets) {
        setProgress({
          current: completed,
          total: seedableDatasets.length,
          label: dataset.label,
        });

        await deleteCollection(
          dataset.collectionName
        );

        completed += 1;

        setProgress({
          current: completed,
          total: seedableDatasets.length,
          label: dataset.label,
        });

        addLog(
          `Collection ${dataset.collectionName} berhasil dihapus.`,
          "success"
        );
      }

      addLog(
        "Seluruh collection dummy berhasil dihapus.",
        "success"
      );
    } catch (error) {
      console.error(
        "DELETE ALL ERROR:",
        error
      );

      addLog(
        `Proses hapus semua berhenti setelah ${completed} collection: ${
          error?.message || "Terjadi kesalahan."
        }`,
        "error"
      );
    } finally {
      setBusyAction("");

      setProgress({
        current: 0,
        total: 0,
        label: "",
      });
    }
  }

  if (!seederEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-text">
            Firebase Seeder Dinonaktifkan
          </h1>

          <p className="mt-3 leading-7 text-text-muted">
            Jalankan aplikasi dalam mode development
            atau tambahkan environment variable
            berikut:
          </p>

          <code className="mt-5 block rounded-xl bg-input px-4 py-3 text-sm text-text">
            NEXT_PUBLIC_ENABLE_FIREBASE_SEEDER=true
          </code>
        </section>
      </main>
    );
  }

  const progressPercentage =
    progress.total > 0
      ? Math.round(
          (progress.current / progress.total) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Debugging Tool
          </p>

          <h1 className="mt-2 text-3xl font-bold text-text sm:text-4xl">
            Firebase Dummy Seeder
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted sm:text-base">
            Inject data per dokumen, per collection,
            atau seluruh dataset. Setiap dokumen memakai
            ID tetap agar relasi dummy tetap konsisten.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="font-semibold">
            Perhatian
          </h2>

          <p className="mt-1 text-sm leading-6">
            Collection Users yang dibuat melalui halaman
            ini hanya berisi profil Firestore. Seeder
            tidak membuat akun email dan password di
            Firebase Authentication.
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-text">
                Aksi Global
              </h2>

              <p className="mt-1 text-sm text-text-muted">
                {seedableDatasets.length} collection,{" "}
                {totalDocuments} dokumen.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSeedAll}
                disabled={Boolean(busyAction)}
                className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === "seed-all"
                  ? "Inject Berjalan..."
                  : "Inject Semua"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={Boolean(busyAction)}
                className="min-h-11 rounded-xl bg-error-text px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === "delete-all"
                  ? "Menghapus..."
                  : "Hapus Semua Dummy"}
              </button>
            </div>
          </div>

          {progress.total > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-text">
                  {progress.label}
                </span>

                <span className="text-text-muted">
                  {progress.current}/{progress.total}{" "}
                  ({progressPercentage}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-input">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {seedableDatasets.map((dataset) => {
            const selectedId =
              selectedItems[dataset.key];

            const seedItemKey = `seed-item:${dataset.key}:${selectedId}`;

            const deleteItemKey = `delete-item:${dataset.key}:${selectedId}`;

            const seedDatasetKey = `seed-dataset:${dataset.key}`;

            const deleteDatasetKey = `delete-dataset:${dataset.key}`;

            const documentCount =
              dataset.documents?.length || 0;

            return (
              <article
                key={dataset.key}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-text">
                      {dataset.label}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-text-muted">
                      Collection:{" "}
                      <code className="font-semibold">
                        {dataset.collectionName}
                      </code>
                    </p>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {documentCount} dokumen
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-text-muted">
                  {dataset.description}
                </p>

                <div className="mt-5">
                  <label
                    htmlFor={`select-${dataset.key}`}
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted"
                  >
                    Pilih Dokumen
                  </label>

                  <select
                    id={`select-${dataset.key}`}
                    value={selectedId}
                    disabled={
                      Boolean(busyAction) ||
                      documentCount === 0
                    }
                    onChange={(event) =>
                      updateSelectedItem(
                        dataset.key,
                        event.target.value
                      )
                    }
                    className="min-h-11 w-full rounded-xl border border-border bg-input px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {documentCount === 0 ? (
                      <option value="">
                        Dataset kosong
                      </option>
                    ) : (
                      dataset.documents.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {getItemLabel(item)} ({item.id})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSeedSingle(dataset)
                    }
                    disabled={
                      Boolean(busyAction) ||
                      documentCount === 0
                    }
                    className="min-h-10 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === seedItemKey
                      ? "Inject..."
                      : "Inject Item"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteSingle(dataset)
                    }
                    disabled={
                      Boolean(busyAction) ||
                      !selectedId
                    }
                    className="min-h-10 rounded-xl border border-error-text px-3 text-xs font-semibold text-error-text transition hover:bg-error-bg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === deleteItemKey
                      ? "Menghapus..."
                      : "Hapus Item"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSeedDataset(dataset)
                    }
                    disabled={
                      Boolean(busyAction) ||
                      documentCount === 0
                    }
                    className="min-h-10 rounded-xl border border-primary px-3 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === seedDatasetKey
                      ? "Inject..."
                      : "Inject Collection"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteDataset(dataset)
                    }
                    disabled={Boolean(busyAction)}
                    className="min-h-10 rounded-xl border border-border px-3 text-xs font-semibold text-text-muted transition hover:bg-input hover:text-error-text disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === deleteDatasetKey
                      ? "Menghapus..."
                      : "Hapus Collection"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-text">
                Log Seeder
              </h2>

              <p className="mt-1 text-sm text-text-muted">
                Riwayat operasi pada sesi browser ini.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLogs([])}
              disabled={
                logs.length === 0 ||
                Boolean(busyAction)
              }
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-muted hover:bg-input disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bersihkan Log
            </button>
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="rounded-xl bg-input px-4 py-3 text-sm text-text-muted">
                Belum ada operasi.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    log.type === "success"
                      ? "bg-primary/10 text-primary"
                      : log.type === "error"
                        ? "bg-error-bg text-error-text"
                        : "bg-input text-text-muted"
                  }`}
                >
                  <span className="mr-2 text-xs opacity-70">
                    {log.timestamp}
                  </span>

                  {log.message}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}