"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/pembina/_shared/PembinaUi";
import {
  formatDateTime,
  rowsOf,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  KOLEKSI_ABSENSI,
  OPSI_STATUS_KEHADIRAN,
  STATUS_KEGIATAN_ABSENSI,
  STATUS_KEHADIRAN,
  STATUS_SESI_ABSENSI,
  STATUS_VERIFIKASI_ABSENSI,
  idAbsensiUntukSesi,
  labelStatusKehadiran,
  labelStatusVerifikasi,
} from "@/components/shared/absensi/konfigurasiAbsensi";
import { downloadRekapAbsensiKegiatan } from "@/lib/downloadRekapAbsensiKegiatan";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sessionStart(session) {
  return session?.waktuMulai ?? session?.startAt ?? session?.tanggal ?? null;
}

function sessionEnd(session) {
  return session?.waktuSelesai ?? session?.endAt ?? null;
}

function recordSessionId(record) {
  return record?.idSesi ?? record?.sessionId ?? null;
}

function recordMemberId(record) {
  return record?.idAnggota ?? record?.memberId ?? null;
}

function recordStatus(record) {
  const raw = String(record?.statusKehadiran ?? record?.status ?? "")
    .trim()
    .toLowerCase();

  return (
    {
      present: STATUS_KEHADIRAN.HADIR,
      hadir: STATUS_KEHADIRAN.HADIR,
      excused: STATUS_KEHADIRAN.IZIN,
      izin: STATUS_KEHADIRAN.IZIN,
      sick: STATUS_KEHADIRAN.SAKIT,
      sakit: STATUS_KEHADIRAN.SAKIT,
      absent: STATUS_KEHADIRAN.ALPA,
      alpa: STATUS_KEHADIRAN.ALPA,
    }[raw] || raw
  );
}

function memberName(member) {
  return member?.namaLengkap || member?.fullName || member?.nama || "Anggota OSIS";
}

function memberPosition(member) {
  return (
    member?.jabatanOrganisasi ||
    member?.organisationPosition ||
    member?.jabatan ||
    "Anggota"
  );
}

function memberDivisionId(member) {
  return member?.idDivisi ?? member?.divisionId ?? null;
}

function labelDivision(division) {
  return division?.namaSingkat || division?.nama || division?.name || "Tanpa divisi";
}

function statusSessionLabel(status) {
  return (
    {
      [STATUS_SESI_ABSENSI.TERJADWAL]: "Terjadwal",
      [STATUS_SESI_ABSENSI.DIBUKA]: "Sedang Dibuka",
      [STATUS_SESI_ABSENSI.DITUTUP]: "Sudah Ditutup",
      [STATUS_SESI_ABSENSI.DIBATALKAN]: "Dibatalkan",
    }[status] || status || "-"
  );
}

export default function AbsensiPembina() {
  const { user } = useAuth();
  const { db, colRef, updateDoc, setDoc } = useDb();

  const activities = useCollection(() => colRef(KOLEKSI_ABSENSI.KEGIATAN), [], {
    enabled: true,
  });
  const sessions = useCollection(() => colRef(KOLEKSI_ABSENSI.SESI_ABSENSI), [], {
    enabled: true,
  });
  const records = useCollection(() => colRef(KOLEKSI_ABSENSI.ABSENSI), [], {
    enabled: true,
  });
  const members = useCollection(() => colRef(KOLEKSI_ABSENSI.ANGGOTA), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef(KOLEKSI_ABSENSI.DIVISI), [], {
    enabled: true,
  });

  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const loading =
    activities.loading ||
    sessions.loading ||
    records.loading ||
    members.loading ||
    divisions.loading;
  const error =
    activities.error ||
    sessions.error ||
    records.error ||
    members.error ||
    divisions.error;

  const data = useMemo(() => {
    const activityRows = rowsOf(activities);
    const sessionRows = rowsOf(sessions);
    const recordRows = rowsOf(records);
    const memberRows = rowsOf(members);
    const divisionRows = rowsOf(divisions);

    const activityMap = new Map(activityRows.map((item) => [item.id, item]));
    const memberMap = new Map(memberRows.map((item) => [item.id, item]));
    const divisionMap = new Map(divisionRows.map((item) => [item.id, item]));

    const normalizedSessions = sessionRows
      .map((session) => ({
        ...session,
        idKegiatan: session.idKegiatan ?? session.activityId ?? null,
        activity:
          activityMap.get(session.idKegiatan ?? session.activityId) || null,
      }))
      .sort((a, b) => {
        const timeA = toDate(sessionStart(a))?.getTime() || 0;
        const timeB = toDate(sessionStart(b))?.getTime() || 0;
        return timeA - timeB;
      });

    // Hanya kegiatan yang sudah mempunyai SesiAbsensi yang relevan untuk menu ini.
    const activityIdsWithSession = new Set(
      normalizedSessions.map((item) => item.idKegiatan).filter(Boolean)
    );
    const activityOptions = activityRows
      .filter((activity) => activityIdsWithSession.has(activity.id))
      .sort((a, b) => {
        const timeA = toDate(a?.waktuMulai)?.getTime() || 0;
        const timeB = toDate(b?.waktuMulai)?.getTime() || 0;
        return timeB - timeA;
      });

    return {
      activityRows,
      activityMap,
      activityOptions,
      sessionRows: normalizedSessions,
      recordRows,
      memberRows,
      memberMap,
      divisionRows,
      divisionMap,
    };
  }, [activities, sessions, records, members, divisions]);

  // Pilih kegiatan pertama. Prioritas diberikan pada kegiatan yang memiliki sesi dibuka.
  useEffect(() => {
    if (!data.activityOptions.length) {
      setSelectedActivityId("");
      return;
    }

    if (data.activityOptions.some((item) => item.id === selectedActivityId)) return;

    const openSession = data.sessionRows.find(
      (session) => session.status === STATUS_SESI_ABSENSI.DIBUKA
    );
    setSelectedActivityId(openSession?.idKegiatan || data.activityOptions[0].id);
  }, [data.activityOptions, data.sessionRows, selectedActivityId]);

  const selectedActivity = data.activityMap.get(selectedActivityId) || null;
  const activitySessions = data.sessionRows.filter(
    (session) => session.idKegiatan === selectedActivityId
  );

  // Setelah kegiatan dipilih, selector kedua hanya berisi sesi milik kegiatan itu.
  useEffect(() => {
    if (!activitySessions.length) {
      setSelectedSessionId("");
      return;
    }

    if (activitySessions.some((item) => item.id === selectedSessionId)) return;

    const openSession = activitySessions.find(
      (item) => item.status === STATUS_SESI_ABSENSI.DIBUKA
    );
    setSelectedSessionId(openSession?.id || activitySessions[0].id);
  }, [selectedActivityId, activitySessions, selectedSessionId]);

  useEffect(() => {
    setSelectedRecordIds(new Set());
    setMessage("");
    setLocalError("");
  }, [selectedSessionId]);

  const selectedSession = activitySessions.find(
    (item) => item.id === selectedSessionId
  );

  const participantIds = Array.isArray(selectedActivity?.pesertaFinal?.idAnggota)
    ? selectedActivity.pesertaFinal.idAnggota
    : [];

  const sessionRecords = data.recordRows.filter(
    (record) => recordSessionId(record) === selectedSessionId
  );
  const sessionRecordMap = new Map(
    sessionRecords.map((record) => [recordMemberId(record), record])
  );

  const participantRows = participantIds
    .map((idAnggota) => {
      const member = data.memberMap.get(idAnggota) || null;
      const record = sessionRecordMap.get(idAnggota) || null;
      const division = data.divisionMap.get(memberDivisionId(member)) || null;
      return { idAnggota, member, division, record };
    })
    .filter(({ member, division }) => {
      const keyword = search.trim().toLowerCase();
      const searchable = `${memberName(member)} ${memberPosition(member)} ${labelDivision(
        division
      )}`.toLowerCase();
      const matchesSearch = !keyword || searchable.includes(keyword);
      const matchesDivision =
        divisionFilter === "all" || memberDivisionId(member) === divisionFilter;
      return matchesSearch && matchesDivision;
    })
    .sort((a, b) => memberName(a.member).localeCompare(memberName(b.member), "id"));

  const counts = useMemo(() => {
    const result = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
      belum: 0,
      menunggu: 0,
      dikonfirmasi: 0,
    };

    participantIds.forEach((idAnggota) => {
      const record = sessionRecordMap.get(idAnggota);
      if (!record) {
        result.belum += 1;
        return;
      }

      const status = recordStatus(record);
      if (Object.prototype.hasOwnProperty.call(result, status)) {
        result[status] += 1;
      }

      if (
        record.statusVerifikasi === STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
      ) {
        result.dikonfirmasi += 1;
      } else {
        result.menunggu += 1;
      }
    });

    return result;
  }, [participantIds, sessionRecordMap]);

  const allActivityRecords = data.recordRows.filter(
    (record) =>
      (record?.idKegiatan ?? record?.activityId) === selectedActivityId
  );
  const reportableSessions = activitySessions.filter(
    (session) => session.status !== STATUS_SESI_ABSENSI.DIBATALKAN
  );
  const requiredRecordCount = participantIds.length * reportableSessions.length;
  const confirmedActivityRecordCount = allActivityRecords.filter(
    (record) =>
      record.statusVerifikasi === STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
  ).length;
  const canDownloadReport =
    selectedActivity?.status === STATUS_KEGIATAN_ABSENSI.SELESAI &&
    requiredRecordCount > 0 &&
    confirmedActivityRecordCount >= requiredRecordCount;

  const handleOpenSession = async () => {
    if (!selectedSession || busyAction) return;
    setBusyAction("open");
    setLocalError("");
    setMessage("");

    try {
      const waktu = serverTimestamp();
      await updateDoc(KOLEKSI_ABSENSI.SESI_ABSENSI, selectedSession.id, {
        status: STATUS_SESI_ABSENSI.DIBUKA,
        dibukaPada: waktu,
        diperbaruiPada: waktu,
      });

      if (selectedActivity?.id) {
        await updateDoc(KOLEKSI_ABSENSI.KEGIATAN, selectedActivity.id, {
          status: STATUS_KEGIATAN_ABSENSI.BERLANGSUNG,
          diperbaruiPada: waktu,
        });
      }

      if (selectedSession?.idPelaksanaan) {
        await updateDoc(
          KOLEKSI_ABSENSI.PELAKSANAAN_KEGIATAN,
          selectedSession.idPelaksanaan,
          { status: "berlangsung", diperbaruiPada: waktu }
        );
      }

      setMessage("Sesi absensi berhasil dibuka.");
    } catch (actionError) {
      console.error("BUKA SESI ABSENSI ERROR:", actionError);
      setLocalError(actionError?.message || "Sesi absensi belum berhasil dibuka.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession || busyAction) return;
    setBusyAction("close");
    setLocalError("");
    setMessage("");

    try {
      const batch = writeBatch(db);
      const waktu = serverTimestamp();

      // Peserta yang tidak mengisi selama sesi dibuka otomatis menjadi ALPA,
      // tetapi statusnya tetap menunggu konfirmasi Pembina.
      participantIds.forEach((idAnggota) => {
        if (sessionRecordMap.has(idAnggota)) return;

        const id = idAbsensiUntukSesi(selectedSession.id, idAnggota);
        batch.set(
          doc(db, KOLEKSI_ABSENSI.ABSENSI, id),
          {
            idSesi: selectedSession.id,
            idPelaksanaan: selectedSession.idPelaksanaan || null,
            idKegiatan: selectedActivity?.id || null,
            idPeriode: selectedActivity?.idPeriode || selectedSession.idPeriode || null,
            idAnggota,
            statusKehadiran: STATUS_KEHADIRAN.ALPA,
            alasan: null,
            dokumenPendukung: null,
            statusVerifikasi:
              STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI,
            diajukanPada: waktu,
            diperbaruiPada: waktu,
            sumber: "otomatis_penutupan_sesi",
            dikonfirmasiPada: null,
            dikonfirmasiOleh: null,
          },
          { merge: true }
        );
      });

      batch.update(doc(db, KOLEKSI_ABSENSI.SESI_ABSENSI, selectedSession.id), {
        status: STATUS_SESI_ABSENSI.DITUTUP,
        ditutupPada: waktu,
        diperbaruiPada: waktu,
      });

      const allSessionsClosedAfterThis = activitySessions
        .filter((session) => session.status !== STATUS_SESI_ABSENSI.DIBATALKAN)
        .every(
          (session) =>
            session.id === selectedSession.id ||
            session.status === STATUS_SESI_ABSENSI.DITUTUP
        );

      if (selectedSession?.idPelaksanaan) {
        const sameExecutionSessions = activitySessions.filter(
          (item) => item.idPelaksanaan === selectedSession.idPelaksanaan
        );
        const executionFinished = sameExecutionSessions
          .filter((item) => item.status !== STATUS_SESI_ABSENSI.DIBATALKAN)
          .every(
            (item) =>
              item.id === selectedSession.id ||
              item.status === STATUS_SESI_ABSENSI.DITUTUP
          );

        if (executionFinished) {
          batch.update(
            doc(
              db,
              KOLEKSI_ABSENSI.PELAKSANAAN_KEGIATAN,
              selectedSession.idPelaksanaan
            ),
            { status: "selesai", diperbaruiPada: waktu }
          );
        }
      }

      // Kegiatan dianggap selesai setelah seluruh sesi di dalam kegiatan sudah ditutup.
      // Data belum otomatis menjadi laporan final sampai Pembina mengonfirmasi Absensi.
      if (allSessionsClosedAfterThis && selectedActivity?.id) {
        batch.update(doc(db, KOLEKSI_ABSENSI.KEGIATAN, selectedActivity.id), {
          status: STATUS_KEGIATAN_ABSENSI.SELESAI,
          diperbaruiPada: waktu,
        });
      }

      await batch.commit();
      setMessage(
        allSessionsClosedAfterThis
          ? "Sesi ditutup. Seluruh sesi kegiatan selesai dan absensi menunggu konfirmasi Pembina."
          : "Sesi ditutup. Peserta yang belum mengisi otomatis dicatat sebagai Alpa dan menunggu konfirmasi."
      );
    } catch (actionError) {
      console.error("TUTUP SESI ABSENSI ERROR:", actionError);
      setLocalError(actionError?.message || "Sesi absensi belum berhasil ditutup.");
    } finally {
      setBusyAction("");
    }
  };

  const handleChangeStatus = async (record, nextStatus) => {
    if (!record?.id || busyAction) return;
    setLocalError("");

    try {
      await updateDoc(KOLEKSI_ABSENSI.ABSENSI, record.id, {
        statusKehadiran: nextStatus,
        diperbaruiPada: serverTimestamp(),
        // Koreksi status membuat data harus dikonfirmasi lagi.
        statusVerifikasi:
          STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI,
        dikonfirmasiPada: null,
        dikonfirmasiOleh: null,
      });
    } catch (statusError) {
      console.error("KOREKSI STATUS ABSENSI ERROR:", statusError);
      setLocalError(statusError?.message || "Status absensi belum berhasil diubah.");
    }
  };

  const toggleRecordSelection = (id) => {
    setSelectedRecordIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    setSelectedRecordIds(
      new Set(
        sessionRecords
          .filter(
            (record) =>
              record.statusVerifikasi !==
              STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
          )
          .map((record) => record.id)
      )
    );
  };

  const handleConfirmSelected = async () => {
    if (!selectedRecordIds.size || busyAction) return;
    setBusyAction("confirm");
    setLocalError("");
    setMessage("");

    try {
      const batch = writeBatch(db);
      const waktu = serverTimestamp();
      const selectedIds = new Set(selectedRecordIds);
      const affectedMembers = new Set();

      sessionRecords.forEach((record) => {
        if (!selectedIds.has(record.id)) return;
        const idAnggota = recordMemberId(record);
        if (idAnggota) affectedMembers.add(idAnggota);

        batch.update(doc(db, KOLEKSI_ABSENSI.ABSENSI, record.id), {
          statusVerifikasi: STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI,
          dikonfirmasiPada: waktu,
          dikonfirmasiOleh: user?.uid || null,
          diperbaruiPada: waktu,
        });
      });

      await batch.commit();

      // Bangun kembali RingkasanAbsensi untuk anggota yang baru dikonfirmasi.
      // Perhitungan menggunakan seluruh record yang sudah final, termasuk record
      // yang baru saja dikonfirmasi pada batch di atas.
      const projectedRecords = data.recordRows.map((record) =>
        selectedIds.has(record.id)
          ? {
              ...record,
              statusVerifikasi: STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI,
            }
          : record
      );

      await Promise.all(
        Array.from(affectedMembers).map(async (idAnggota) => {
          const confirmed = projectedRecords.filter(
            (record) =>
              recordMemberId(record) === idAnggota &&
              record.statusVerifikasi ===
                STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
          );

          const count = (status) =>
            confirmed.filter((record) => recordStatus(record) === status).length;
          const hadir = count(STATUS_KEHADIRAN.HADIR);
          const izin = count(STATUS_KEHADIRAN.IZIN);
          const sakit = count(STATUS_KEHADIRAN.SAKIT);
          const alpa = count(STATUS_KEHADIRAN.ALPA);
          const total = confirmed.length;

          await setDoc(
            KOLEKSI_ABSENSI.RINGKASAN_ABSENSI,
            idAnggota,
            {
              idAnggota,
              jumlahKegiatan: total,
              hadir,
              izin,
              sakit,
              alpa,
              persentaseKehadiran: total
                ? Math.round((hadir / total) * 100)
                : 0,
              diperbaruiPada: serverTimestamp(),
            },
            { merge: true }
          );
        })
      );

      setSelectedRecordIds(new Set());
      setMessage(`${selectedIds.size} data absensi berhasil dikonfirmasi.`);
    } catch (confirmError) {
      console.error("KONFIRMASI ABSENSI ERROR:", confirmError);
      setLocalError(
        confirmError?.message || "Data absensi belum berhasil dikonfirmasi."
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleDownload = () => {
    if (!canDownloadReport || !selectedActivity) return;

    try {
      downloadRekapAbsensiKegiatan({
        activity: selectedActivity,
        sessions: activitySessions,
        records: allActivityRecords,
        members: data.memberRows,
        divisions: data.divisionRows,
      });
    } catch (downloadError) {
      console.error("DOWNLOAD REKAP ABSENSI ERROR:", downloadError);
      setLocalError(
        downloadError?.message || "Rekap absensi belum dapat dibuat."
      );
    }
  };

  if (loading) return <PageLoading message="Memuat absensi anggota..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Kehadiran Organisasi"
        title="Absensi Anggota"
        description="Pilih kegiatan terlebih dahulu, kemudian kelola setiap sesi absensi di dalam kegiatan tersebut."
      />

      {!data.activityOptions.length ? (
        <EmptyState
          icon="event_available"
          title="Belum ada sesi absensi"
          description="Sesi akan muncul setelah kegiatan difinalisasi oleh Pembina."
        />
      ) : (
        <>
          <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Pilih Kegiatan
                </label>
                <select
                  value={selectedActivityId}
                  onChange={(event) => setSelectedActivityId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
                >
                  {data.activityOptions.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.namaKegiatan || "Kegiatan tanpa nama"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Sesi Absensi
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
                >
                  {activitySessions.map((session, index) => (
                    <option key={session.id} value={session.id}>
                      Sesi {index + 1} · {formatDateTime(sessionStart(session))}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedActivity && selectedSession && (
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox label="Kegiatan" value={selectedActivity.namaKegiatan || "-"} />
                <InfoBox
                  label="Waktu Sesi"
                  value={`${formatDateTime(sessionStart(selectedSession))}${
                    sessionEnd(selectedSession)
                      ? ` - ${new Intl.DateTimeFormat("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(toDate(sessionEnd(selectedSession)))}`
                      : ""
                  }`}
                />
                <InfoBox label="Lokasi" value={selectedActivity.lokasi || "-"} />
                <InfoBox
                  label="Status Sesi"
                  value={statusSessionLabel(selectedSession.status)}
                />
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs leading-5 text-text-muted">
                {selectedActivity?.status === STATUS_KEGIATAN_ABSENSI.SELESAI ? (
                  canDownloadReport ? (
                    <span className="font-bold text-emerald-700">
                      Kegiatan selesai dan seluruh absensi sudah dikonfirmasi. Rekap siap didownload.
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700">
                      Kegiatan selesai, tetapi {Math.max(
                        0,
                        requiredRecordCount - confirmedActivityRecordCount
                      )} data absensi masih belum dikonfirmasi.
                    </span>
                  )
                ) : (
                  "Rekap kegiatan tersedia setelah seluruh sesi selesai dan seluruh absensi dikonfirmasi."
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {selectedActivity?.status === STATUS_KEGIATAN_ABSENSI.SELESAI && (
                  <button
                    type="button"
                    disabled={!canDownloadReport}
                    onClick={handleDownload}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AppIcon name="download" size={18} />
                    Download Rekap Kegiatan
                  </button>
                )}

                {selectedSession?.status === STATUS_SESI_ABSENSI.TERJADWAL && (
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={handleOpenSession}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    <AppIcon name="play_arrow" size={18} />
                    {busyAction === "open" ? "Membuka..." : "Mulai Sesi Absensi"}
                  </button>
                )}

                {selectedSession?.status === STATUS_SESI_ABSENSI.DIBUKA && (
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={handleCloseSession}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <AppIcon name="stop_circle" size={18} />
                    {busyAction === "close" ? "Menutup..." : "Tutup Sesi Absensi"}
                  </button>
                )}
              </div>
            </div>
          </section>

          {(message || localError) && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                localError
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {localError || message}
            </div>
          )}

          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard icon="groups" label="Peserta" value={participantIds.length} />
            <StatCard icon="check" label="Hadir" value={counts.hadir} accent="green" />
            <StatCard icon="fact_check" label="Izin" value={counts.izin} />
            <StatCard icon="medical_services" label="Sakit" value={counts.sakit} />
            <StatCard icon="calendar_month" label="Alpa" value={counts.alpa} />
            <StatCard icon="event_available" label="Menunggu" value={counts.menunggu + counts.belum} accent="amber" />
          </section>

          <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <h2 className="font-bold text-text">Daftar Absensi Sesi</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Setelah sesi ditutup, periksa data lalu konfirmasi sebelum rekap dibuat.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <AppIcon
                    name="search"
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari anggota"
                    className="min-h-10 rounded-xl border border-border bg-input pl-9 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <select
                  value={divisionFilter}
                  onChange={(event) => setDivisionFilter(event.target.value)}
                  className="min-h-10 rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="all">Semua Sekbid</option>
                  {data.divisionRows.map((division) => (
                    <option key={division.id} value={division.id}>
                      {labelDivision(division)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {participantRows.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-surface">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <th className="w-12 px-4 py-3 text-center">Pilih</th>
                      <th className="px-4 py-3">Anggota</th>
                      <th className="px-4 py-3">Jabatan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Bukti / Alasan</th>
                      <th className="px-4 py-3">Konfirmasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {participantRows.map(({ idAnggota, member, division, record }) => {
                      const canSelect =
                        selectedSession?.status === STATUS_SESI_ABSENSI.DITUTUP &&
                        record &&
                        record.statusVerifikasi !==
                          STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI;

                      return (
                        <tr key={idAnggota} className="bg-card">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={!canSelect}
                              checked={Boolean(record?.id && selectedRecordIds.has(record.id))}
                              onChange={() => record?.id && toggleRecordSelection(record.id)}
                              className="h-4 w-4 rounded border-border accent-primary disabled:opacity-30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-text">{memberName(member)}</p>
                            <p className="mt-0.5 text-xs text-text-muted">{labelDivision(division)}</p>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{memberPosition(member)}</td>
                          <td className="px-4 py-3">
                            {record ? (
                              <select
                                value={recordStatus(record)}
                                disabled={
                                  selectedSession?.status !== STATUS_SESI_ABSENSI.DITUTUP ||
                                  record.statusVerifikasi ===
                                    STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
                                }
                                onChange={(event) =>
                                  handleChangeStatus(record, event.target.value)
                                }
                                className="min-h-9 rounded-lg border border-border bg-input px-2 text-xs font-bold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {OPSI_STATUS_KEHADIRAN.map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                Belum Absen
                              </span>
                            )}
                          </td>
                          <td className="max-w-xs px-4 py-3">
                            {record?.alasan ? (
                              <p className="text-xs leading-5 text-text-muted">{record.alasan}</p>
                            ) : (
                              <span className="text-xs text-text-muted">-</span>
                            )}
                            {record?.dokumenPendukung?.urlFile && (
                              <a
                                href={record.dokumenPendukung.urlFile}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex text-xs font-bold text-primary hover:underline"
                              >
                                Lihat dokumen pendukung
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {record ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  record.statusVerifikasi ===
                                  STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {labelStatusVerifikasi(record.statusVerifikasi)}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <EmptyState icon="groups" title="Anggota tidak ditemukan" />
              </div>
            )}

            {selectedSession?.status === STATUS_SESI_ABSENSI.DITUTUP && (
              <div className="flex flex-col gap-3 border-t border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={selectAllPending}
                  className="text-left text-xs font-bold text-primary hover:underline"
                >
                  Pilih semua yang menunggu konfirmasi
                </button>

                <button
                  type="button"
                  disabled={!selectedRecordIds.size || Boolean(busyAction)}
                  onClick={handleConfirmSelected}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <AppIcon name="check" size={18} />
                  {busyAction === "confirm"
                    ? "Mengonfirmasi..."
                    : `Konfirmasi Terpilih (${selectedRecordIds.size})`}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-text">
        {value || "-"}
      </p>
    </div>
  );
}
