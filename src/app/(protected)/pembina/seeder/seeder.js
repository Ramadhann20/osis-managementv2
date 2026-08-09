"use client";

import { useMemo, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";

import { useDb } from "@/context/DbContext";
import {
  periodeSeeder,
  divisiSeeder,
  anggotaSeeder,
} from "@/lib/dummy/dummy";

const DATASETS = [
  {
    key: "periode",
    label: "Periode",
    collectionName: "Periode",
    documents: periodeSeeder,
    description: "Periode kepengurusan untuk relasi anggota.",
  },
  {
    key: "divisi",
    label: "Divisi",
    collectionName: "Divisi",
    documents: divisiSeeder,
    description: "Badan Pengurus dan beberapa Sekbid.",
  },
  {
    key: "anggota",
    label: "Anggota",
    collectionName: "Anggota",
    documents: anggotaSeeder,
    description: "BPH lengkap dan beberapa Ketua Sekbid.",
  },
];

function isIsoDateTime(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value
    )
  );
}

function transformForFirestore(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);

  if (isIsoDateTime(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : Timestamp.fromDate(date);
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

function getItemLabel(datasetKey, item, index) {
  if (datasetKey === "anggota") {
    return `${item.namaLengkap || `Anggota ${index + 1}`} — ${
      item.jabatanOrganisasi || "Anggota"
    }`;
  }

  if (datasetKey === "divisi") {
    return `${item.kode || "-"} — ${item.namaSingkat || item.nama || "Divisi"}`;
  }

  return item.namaPeriode || `Periode ${index + 1}`;
}

function kodeDivisiUntukAnggota(anggota) {
  const jabatan = String(anggota?.jabatanOrganisasi || "").trim();

  if (
    /^(ketua osis|wakil ketua|sekretaris|bendahara)/i.test(jabatan)
  ) {
    return "BPH";
  }

  const match = /^ketua\s+sekbid\s+([ivxlcdm]+)$/i.exec(jabatan);
  if (match) return match[1].toUpperCase();

  return null;
}

export default function SeederPage() {
  const { addDoc, deleteDoc, deleteCollection } = useDb();

  // Registry ini hanya hidup selama halaman seeder terbuka.
  // BUKAN bagian dummy dan BUKAN field Firestore.
  const runtimeRef = useRef({
    idPeriodeAktif: null,
    idDivisiByKode: new Map(),
    createdIds: {
      periode: new Map(),
      divisi: new Map(),
      anggota: new Map(),
    },
  });

  const [selectedIndex, setSelectedIndex] = useState({
    periode: 0,
    divisi: 0,
    anggota: 0,
  });
  const [busyAction, setBusyAction] = useState("");
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });

  const seederEnabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_FIREBASE_SEEDER === "true";

  const totalDocuments = useMemo(
    () => DATASETS.reduce((sum, dataset) => sum + dataset.documents.length, 0),
    []
  );

  function addLog(message, type = "info") {
    setLogs((current) => [
      {
        key: `${Date.now()}-${Math.random()}`,
        message,
        type,
        time: new Date().toLocaleTimeString("id-ID"),
      },
      ...current,
    ]);
  }

  function rememberCreatedId(datasetKey, index, firestoreId) {
    const map = runtimeRef.current.createdIds[datasetKey];
    const current = map.get(index) || [];
    map.set(index, [...current, firestoreId]);
  }

  function latestCreatedId(datasetKey, index) {
    const ids = runtimeRef.current.createdIds[datasetKey].get(index) || [];
    return ids.at(-1) || null;
  }

  function forgetLatestCreatedId(datasetKey, index) {
    const map = runtimeRef.current.createdIds[datasetKey];
    const ids = map.get(index) || [];
    ids.pop();
    if (ids.length) map.set(index, ids);
    else map.delete(index);
  }

  async function seedPeriode(index = 0) {
    const data = periodeSeeder[index];
    if (!data) throw new Error("Data periode tidak ditemukan.");

    const created = await addDoc("Periode", transformForFirestore(data));
    rememberCreatedId("periode", index, created.id);

    if (data.aktif || !runtimeRef.current.idPeriodeAktif) {
      runtimeRef.current.idPeriodeAktif = created.id;
    }

    addLog(`Periode dibuat dengan Auto ID ${created.id}.`, "success");
    return created.id;
  }

  async function ensurePeriodeAktif() {
    if (runtimeRef.current.idPeriodeAktif) {
      return runtimeRef.current.idPeriodeAktif;
    }

    const activeIndex = Math.max(
      0,
      periodeSeeder.findIndex((item) => item.aktif)
    );

    return seedPeriode(activeIndex);
  }

  async function seedDivisi(index) {
    const data = divisiSeeder[index];
    if (!data) throw new Error("Data divisi tidak ditemukan.");

    const created = await addDoc("Divisi", transformForFirestore(data));
    rememberCreatedId("divisi", index, created.id);
    runtimeRef.current.idDivisiByKode.set(data.kode, created.id);

    addLog(`Divisi ${data.kode} dibuat dengan Auto ID ${created.id}.`, "success");
    return created.id;
  }

  async function ensureDivisi(kode) {
    if (!kode) return null;

    const existing = runtimeRef.current.idDivisiByKode.get(kode);
    if (existing) return existing;

    const index = divisiSeeder.findIndex((item) => item.kode === kode);
    if (index < 0) {
      throw new Error(`Divisi dengan kode ${kode} tidak tersedia pada dummy.`);
    }

    return seedDivisi(index);
  }

  async function seedAnggota(index) {
    const data = anggotaSeeder[index];
    if (!data) throw new Error("Data anggota tidak ditemukan.");

    const idPeriode = await ensurePeriodeAktif();
    const kodeDivisi = kodeDivisiUntukAnggota(data);
    const idDivisi = await ensureDivisi(kodeDivisi);

    // Sama seperti alur pendaftaran anggota:
    // langsung addDoc() dan biarkan Firestore membuat document ID.
    const payload = transformForFirestore({
      ...data,
      idPeriode,
      idDivisi,
    });

    const created = await addDoc("Anggota", payload);
    rememberCreatedId("anggota", index, created.id);

    addLog(
      `${data.namaLengkap} dibuat dengan Auto ID ${created.id}.`,
      "success"
    );

    return created.id;
  }

  async function seedSingle(dataset) {
    const index = selectedIndex[dataset.key] ?? 0;
    setBusyAction(`single:${dataset.key}`);

    try {
      if (dataset.key === "periode") await seedPeriode(index);
      if (dataset.key === "divisi") await seedDivisi(index);
      if (dataset.key === "anggota") await seedAnggota(index);
    } catch (error) {
      console.error("SEED SINGLE ERROR:", error);
      addLog(error?.message || "Gagal membuat data.", "error");
    } finally {
      setBusyAction("");
    }
  }

  async function seedDataset(dataset) {
    setBusyAction(`dataset:${dataset.key}`);
    setProgress({ current: 0, total: dataset.documents.length, label: dataset.label });

    try {
      for (let index = 0; index < dataset.documents.length; index += 1) {
        if (dataset.key === "periode") await seedPeriode(index);
        if (dataset.key === "divisi") await seedDivisi(index);
        if (dataset.key === "anggota") await seedAnggota(index);

        setProgress({
          current: index + 1,
          total: dataset.documents.length,
          label: dataset.label,
        });
      }

      addLog(`${dataset.label} selesai di-inject.`, "success");
    } catch (error) {
      console.error("SEED DATASET ERROR:", error);
      addLog(error?.message || `Gagal inject ${dataset.label}.`, "error");
    } finally {
      setBusyAction("");
      setProgress({ current: 0, total: 0, label: "" });
    }
  }

  async function seedAll() {
    const confirmed = window.confirm(
      `Inject ${totalDocuments} dokumen? Setiap klik akan membuat Auto ID baru.`
    );
    if (!confirmed) return;

    setBusyAction("all");
    setProgress({ current: 0, total: totalDocuments, label: "Memulai..." });

    let done = 0;

    try {
      for (let i = 0; i < periodeSeeder.length; i += 1) {
        await seedPeriode(i);
        done += 1;
        setProgress({ current: done, total: totalDocuments, label: "Periode" });
      }

      for (let i = 0; i < divisiSeeder.length; i += 1) {
        await seedDivisi(i);
        done += 1;
        setProgress({ current: done, total: totalDocuments, label: "Divisi" });
      }

      for (let i = 0; i < anggotaSeeder.length; i += 1) {
        await seedAnggota(i);
        done += 1;
        setProgress({ current: done, total: totalDocuments, label: "Anggota" });
      }

      addLog(`Inject semua selesai: ${done} dokumen dibuat.`, "success");
    } catch (error) {
      console.error("SEED ALL ERROR:", error);
      addLog(error?.message || "Inject semua gagal.", "error");
    } finally {
      setBusyAction("");
      setProgress({ current: 0, total: 0, label: "" });
    }
  }

  async function deleteLatest(dataset) {
    const index = selectedIndex[dataset.key] ?? 0;
    const firestoreId = latestCreatedId(dataset.key, index);

    if (!firestoreId) {
      addLog(
        "Belum ada Auto ID yang dibuat untuk item ini pada sesi halaman sekarang.",
        "error"
      );
      return;
    }

    setBusyAction(`delete:${dataset.key}`);

    try {
      await deleteDoc(dataset.collectionName, firestoreId);
      forgetLatestCreatedId(dataset.key, index);

      if (dataset.key === "periode" && runtimeRef.current.idPeriodeAktif === firestoreId) {
        runtimeRef.current.idPeriodeAktif = null;
      }

      if (dataset.key === "divisi") {
        const kode = divisiSeeder[index]?.kode;
        if (kode && runtimeRef.current.idDivisiByKode.get(kode) === firestoreId) {
          runtimeRef.current.idDivisiByKode.delete(kode);
        }
      }

      addLog(`${dataset.collectionName}/${firestoreId} dihapus.`, "success");
    } catch (error) {
      console.error("DELETE LATEST ERROR:", error);
      addLog(error?.message || "Gagal menghapus data.", "error");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteDataset(dataset) {
    const confirmed = window.confirm(
      `Hapus seluruh collection ${dataset.collectionName}?`
    );
    if (!confirmed) return;

    setBusyAction(`delete-dataset:${dataset.key}`);

    try {
      await deleteCollection(dataset.collectionName);
      runtimeRef.current.createdIds[dataset.key].clear();

      if (dataset.key === "periode") runtimeRef.current.idPeriodeAktif = null;
      if (dataset.key === "divisi") runtimeRef.current.idDivisiByKode.clear();

      addLog(`Collection ${dataset.collectionName} dihapus.`, "success");
    } catch (error) {
      console.error("DELETE DATASET ERROR:", error);
      addLog(error?.message || "Gagal menghapus collection.", "error");
    } finally {
      setBusyAction("");
    }
  }

  if (!seederEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="max-w-lg rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-bold text-text">Seeder Dinonaktifkan</h1>
          <p className="mt-2 text-sm text-text-muted">
            Jalankan development mode atau aktifkan NEXT_PUBLIC_ENABLE_FIREBASE_SEEDER=true.
          </p>
        </div>
      </main>
    );
  }

  const percentage = progress.total
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Debugging Tool
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text">Firebase Seeder — Auto ID</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            Seeder ini tidak memakai ID dummy, ref dummy, maupun setDoc dengan document ID buatan.
            Seluruh dokumen dibuat langsung menggunakan addDoc(), sama seperti pendaftaran anggota.
          </p>
        </header>

        <section className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Setiap kali tombol inject ditekan, Firestore akan membuat document ID baru. ID hasil addDoc
          hanya digunakan saat runtime untuk mengisi foreign key seperti idPeriode dan idDivisi.
        </section>

        <section className="mb-7 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-text">Inject Semua</h2>
              <p className="mt-1 text-sm text-text-muted">{totalDocuments} dokumen dummy.</p>
            </div>
            <button
              type="button"
              onClick={seedAll}
              disabled={Boolean(busyAction)}
              className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busyAction === "all" ? "Inject Berjalan..." : "Inject Semua"}
            </button>
          </div>

          {progress.total > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-text-muted">
                <span>{progress.label}</span>
                <span>{progress.current}/{progress.total} ({percentage}%)</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-input">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {DATASETS.map((dataset) => {
            const index = selectedIndex[dataset.key] ?? 0;
            const latestId = latestCreatedId(dataset.key, index);

            return (
              <article key={dataset.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-text">{dataset.label}</h2>
                    <p className="mt-1 text-xs text-text-muted">{dataset.collectionName}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {dataset.documents.length}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-text-muted">{dataset.description}</p>

                <select
                  value={index}
                  onChange={(event) =>
                    setSelectedIndex((current) => ({
                      ...current,
                      [dataset.key]: Number(event.target.value),
                    }))
                  }
                  className="mt-5 min-h-11 w-full rounded-xl border border-border bg-input px-3 text-sm text-text"
                >
                  {dataset.documents.map((item, itemIndex) => (
                    <option key={`${dataset.key}-${itemIndex}`} value={itemIndex}>
                      {getItemLabel(dataset.key, item, itemIndex)}
                    </option>
                  ))}
                </select>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => seedSingle(dataset)}
                    disabled={Boolean(busyAction)}
                    className="min-h-10 rounded-xl bg-primary px-3 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Inject Item
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteLatest(dataset)}
                    disabled={Boolean(busyAction) || !latestId}
                    className="min-h-10 rounded-xl border border-error-text px-3 text-xs font-bold text-error-text disabled:opacity-40"
                  >
                    Hapus Terakhir
                  </button>

                  <button
                    type="button"
                    onClick={() => seedDataset(dataset)}
                    disabled={Boolean(busyAction)}
                    className="min-h-10 rounded-xl border border-primary px-3 text-xs font-bold text-primary disabled:opacity-50"
                  >
                    Inject Collection
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteDataset(dataset)}
                    disabled={Boolean(busyAction)}
                    className="min-h-10 rounded-xl border border-border px-3 text-xs font-bold text-text-muted disabled:opacity-50"
                  >
                    Hapus Collection
                  </button>
                </div>

                {latestId && (
                  <p className="mt-3 break-all rounded-xl bg-input px-3 py-2 text-[11px] text-text-muted">
                    Auto ID terakhir: {latestId}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-text">Log Seeder</h2>
              <p className="mt-1 text-xs text-text-muted">Auto ID ditampilkan hanya untuk debugging.</p>
            </div>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-muted"
            >
              Bersihkan
            </button>
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="rounded-xl bg-input px-4 py-3 text-sm text-text-muted">Belum ada operasi.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.key}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    log.type === "success"
                      ? "bg-primary/10 text-primary"
                      : log.type === "error"
                        ? "bg-error-bg text-error-text"
                        : "bg-input text-text-muted"
                  }`}
                >
                  <span className="mr-2 text-xs opacity-70">{log.time}</span>
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
