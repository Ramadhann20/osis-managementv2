"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  formatShortDate,
  formatTime,
  toDate,
} from "@/components/anggota/_shared/formatters";
import {
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/anggota/_shared/Ui";
import {
  KOLEKSI_ABSENSI,
  STATUS_KEHADIRAN,
  STATUS_SESI_ABSENSI,
  STATUS_VERIFIKASI_ABSENSI,
  idAbsensiUntukSesi,
  labelStatusKehadiran,
  labelStatusVerifikasi,
} from "@/components/shared/absensi/konfigurasiAbsensi";
import {
  uploadBuktiAbsensiCloudinary,
  validasiBuktiAbsensi,
} from "@/lib/uploadBuktiAbsensiCloudinary";

function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function recordSessionId(record) {
  return record?.idSesi ?? record?.sessionId ?? null;
}

function recordMemberId(record) {
  return record?.idAnggota ?? record?.memberId ?? null;
}

function recordStatus(record) {
  return String(record?.statusKehadiran ?? record?.status ?? "")
    .trim()
    .toLowerCase();
}

function sessionStart(session) {
  return session?.waktuMulai ?? session?.startAt ?? session?.tanggal ?? null;
}

function sessionEnd(session) {
  return session?.waktuSelesai ?? session?.endAt ?? null;
}

function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => {
    const timeA = toDate(a?.diajukanPada ?? a?.dibuatPada)?.getTime() || 0;
    const timeB = toDate(b?.diajukanPada ?? b?.dibuatPada)?.getTime() || 0;
    return timeB - timeA;
  });
}

export default function AbsensiAnggota() {
  const {
    member,
    memberId,
    loading: memberLoading,
    error: memberError,
  } = useCurrentMember();
  const { colRef, query, where, setDoc, serverTimestamp } = useDb();

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(STATUS_KEHADIRAN.HADIR);
  const [alasan, setAlasan] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const attendance = useCollection(
    () =>
      memberId
        ? query(
            colRef(KOLEKSI_ABSENSI.ABSENSI),
            where("idAnggota", "==", memberId)
          )
        : null,
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const activities = useCollection(
    () => colRef(KOLEKSI_ABSENSI.KEGIATAN),
    [],
    { enabled: true }
  );

  const sessions = useCollection(
    () => colRef(KOLEKSI_ABSENSI.SESI_ABSENSI),
    [],
    { enabled: true }
  );

  const loading =
    memberLoading || attendance.loading || activities.loading || sessions.loading;
  const error = memberError || attendance.error || activities.error || sessions.error;

  const data = useMemo(() => {
    const activityRows = rowsOf(activities);
    const sessionRows = rowsOf(sessions);
    const recordRows = rowsOf(attendance);
    const activityMap = new Map(activityRows.map((item) => [item.id, item]));

    const activeSessions = sessionRows
      .filter((session) => session.status === STATUS_SESI_ABSENSI.DIBUKA)
      .map((session) => ({
        ...session,
        activity: activityMap.get(session.idKegiatan ?? session.activityId) || null,
      }))
      .filter((session) => {
        const participantIds = Array.isArray(
          session.activity?.pesertaFinal?.idAnggota
        )
          ? session.activity.pesertaFinal.idAnggota
          : [];
        return memberId && participantIds.includes(memberId);
      })
      .sort((a, b) => {
        const timeA = toDate(sessionStart(a))?.getTime() || 0;
        const timeB = toDate(sessionStart(b))?.getTime() || 0;
        return timeA - timeB;
      });

    const history = sortByDateDesc(recordRows).map((record) => {
      const session = sessionRows.find(
        (item) => item.id === recordSessionId(record)
      );
      const activity = session
        ? activityMap.get(session.idKegiatan ?? session.activityId) || null
        : activityMap.get(record?.idKegiatan ?? record?.activityId) || null;

      return { ...record, session, activity };
    });

    return {
      activityMap,
      recordRows,
      activeSessions,
      history,
    };
  }, [activities, sessions, attendance, memberId]);

  // Jika tombol "Lakukan Absensi" dari detail kegiatan mengirim query ?session=,
  // halaman langsung memilih sesi tersebut. Jika tidak ada, gunakan sesi aktif pertama.
  useEffect(() => {
    if (!data.activeSessions.length) {
      setSelectedSessionId("");
      return;
    }

    const requested =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("session")
        : null;
    const requestedExists = data.activeSessions.some(
      (item) => item.id === requested
    );

    if (requestedExists) {
      setSelectedSessionId(requested);
      return;
    }

    if (!data.activeSessions.some((item) => item.id === selectedSessionId)) {
      setSelectedSessionId(data.activeSessions[0].id);
    }
  }, [data.activeSessions, selectedSessionId]);

  const selectedSession = data.activeSessions.find(
    (item) => item.id === selectedSessionId
  );
  const existingRecord = data.recordRows.find(
    (record) =>
      recordSessionId(record) === selectedSessionId &&
      recordMemberId(record) === memberId
  );

  useEffect(() => {
    if (!selectedSessionId) return;

    setSelectedStatus(
      existingRecord?.statusKehadiran || STATUS_KEHADIRAN.HADIR
    );
    setAlasan(existingRecord?.alasan || existingRecord?.catatan || "");
    setEvidenceFile(null);
    setMessage("");
    setLocalError("");
  }, [selectedSessionId, existingRecord?.id]);

  const summary = useMemo(() => {
    const confirmed = data.history.filter(
      (record) =>
        record.statusVerifikasi === STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
    );

    const count = (status) =>
      confirmed.filter((record) => recordStatus(record) === status).length;

    const hadir = count(STATUS_KEHADIRAN.HADIR);
    const izin = count(STATUS_KEHADIRAN.IZIN);
    const sakit = count(STATUS_KEHADIRAN.SAKIT);
    const alpa = count(STATUS_KEHADIRAN.ALPA);
    const total = confirmed.length;

    return {
      total,
      hadir,
      izin,
      sakit,
      alpa,
      persentase: total ? Math.round((hadir / total) * 100) : 0,
    };
  }, [data.history]);

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const validationError = validasiBuktiAbsensi(file);
    if (validationError) {
      setEvidenceFile(null);
      setLocalError(validationError);
      event.target.value = "";
      return;
    }

    setEvidenceFile(file);
    setLocalError("");
  };

  const handleSubmit = async () => {
    if (!selectedSession || !memberId || saving) return;

    setLocalError("");
    setMessage("");

    const requiresEvidence =
      selectedStatus === STATUS_KEHADIRAN.IZIN ||
      selectedStatus === STATUS_KEHADIRAN.SAKIT;

    if (requiresEvidence && !alasan.trim()) {
      setLocalError("Alasan wajib diisi untuk status Izin atau Sakit.");
      return;
    }

    if (requiresEvidence && !evidenceFile && !existingRecord?.dokumenPendukung?.urlFile) {
      setLocalError("Dokumen pendukung wajib diupload untuk status Izin atau Sakit.");
      return;
    }

    setSaving(true);

    try {
      let dokumenPendukung = existingRecord?.dokumenPendukung || null;
      if (requiresEvidence && evidenceFile) {
        dokumenPendukung = await uploadBuktiAbsensiCloudinary(evidenceFile);
      }

      if (!requiresEvidence) {
        dokumenPendukung = null;
      }

      const waktu = serverTimestamp();
      const activity = selectedSession.activity;
      const id = idAbsensiUntukSesi(selectedSession.id, memberId);

      await setDoc(
        KOLEKSI_ABSENSI.ABSENSI,
        id,
        {
          idSesi: selectedSession.id,
          idPelaksanaan:
            selectedSession.idPelaksanaan ?? selectedSession.executionId ?? null,
          idKegiatan: activity?.id || null,
          idPeriode: activity?.idPeriode || selectedSession.idPeriode || null,
          idAnggota: memberId,
          statusKehadiran: selectedStatus,
          alasan: requiresEvidence ? alasan.trim() : null,
          dokumenPendukung,
          statusVerifikasi:
            STATUS_VERIFIKASI_ABSENSI.MENUNGGU_KONFIRMASI,
          diajukanPada: existingRecord?.diajukanPada || waktu,
          diperbaruiPada: waktu,
          dikonfirmasiPada: null,
          dikonfirmasiOleh: null,
        },
        { merge: true }
      );

      setEvidenceFile(null);
      setMessage(
        "Absensi berhasil dikirim dan sedang menunggu konfirmasi Pembina."
      );
    } catch (submitError) {
      console.error("SIMPAN ABSENSI ANGGOTA ERROR:", submitError);
      setLocalError(
        submitError?.message || "Absensi belum berhasil disimpan."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading message="Memuat absensi anggota..." />;
  if (error) return <PageError message={error.message} />;

  return (
    <div>
      <PageHeading
        eyebrow="Kehadiran Saya"
        title="Absensi Anggota"
        description={`Isi absensi pada sesi yang sedang dibuka dan lihat histori kehadiran ${
          member?.namaLengkap || "Anggota"
        }.`}
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="event_available"
          label="Absensi Final"
          value={summary.total}
          helper={`${summary.persentase}% tingkat kehadiran`}
        />
        <StatCard icon="check" label="Hadir" value={summary.hadir} accent="green" />
        <StatCard icon="fact_check" label="Izin / Sakit" value={summary.izin + summary.sakit} accent="amber" />
        <StatCard icon="calendar_month" label="Alpa" value={summary.alpa} />
      </section>

      <section className="mt-7 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AppIcon name="event_available" size={22} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Sesi Aktif
            </p>
            <h2 className="font-bold text-text">Lakukan Absensi</h2>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Hanya sesi yang sedang dibuka dan melibatkan kamu yang ditampilkan.
            </p>
          </div>
        </div>

        {data.activeSessions.length ? (
          <div className="mt-5">
            {data.activeSessions.length > 1 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Sesi Absensi
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
                >
                  {data.activeSessions.map((session, index) => (
                    <option key={session.id} value={session.id}>
                      {session.activity?.namaKegiatan || "Kegiatan"} · Sesi {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSession && (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-text">
                      {selectedSession.activity?.namaKegiatan || "Kegiatan OSIS"}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatShortDate(sessionStart(selectedSession))} · {formatTime(sessionStart(selectedSession))}
                      {sessionEnd(selectedSession)
                        ? ` - ${formatTime(sessionEnd(selectedSession))}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {selectedSession.activity?.lokasi || "Lokasi belum ditentukan"}
                    </p>
                  </div>

                  {existingRecord && (
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                      {labelStatusVerifikasi(existingRecord.statusVerifikasi)}
                    </span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    [STATUS_KEHADIRAN.HADIR, "Hadir", "check"],
                    [STATUS_KEHADIRAN.IZIN, "Izin", "fact_check"],
                    [STATUS_KEHADIRAN.SAKIT, "Sakit", "medical_services"],
                  ].map(([value, label, icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedStatus(value)}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                        selectedStatus === value
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-card text-text hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      <AppIcon name={icon} size={18} />
                      {label}
                    </button>
                  ))}
                </div>

                {(selectedStatus === STATUS_KEHADIRAN.IZIN ||
                  selectedStatus === STATUS_KEHADIRAN.SAKIT) && (
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        Alasan / Keterangan *
                      </label>
                      <textarea
                        value={alasan}
                        onChange={(event) => setAlasan(event.target.value)}
                        rows={4}
                        placeholder="Jelaskan alasan dengan jelas"
                        className="mt-2 w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        Dokumen Pendukung *
                      </label>
                      <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 text-center transition hover:bg-primary/10">
                        <AppIcon name="upload_file" size={22} className="text-primary" />
                        <span className="mt-2 text-sm font-bold text-primary">
                          {evidenceFile?.name ||
                            existingRecord?.dokumenPendukung?.namaFile ||
                            "Upload PDF / JPG / PNG"}
                        </span>
                        <span className="mt-1 text-[11px] text-text-muted">
                          Maksimal 5 MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={handleEvidenceChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {(localError || message) && (
                  <div
                    className={`mt-4 rounded-xl px-4 py-3 text-xs font-semibold ${
                      localError
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {localError || message}
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSubmit}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AppIcon name="check" size={18} />
                    {saving
                      ? "Menyimpan..."
                      : existingRecord
                        ? "Perbarui Absensi"
                        : "Kirim Absensi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon="event_available"
              title="Belum ada sesi absensi aktif"
              description="Tombol absensi akan tersedia setelah Pembina membuka sesi kegiatan yang melibatkan kamu."
            />
          </div>
        )}
      </section>

      <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="font-bold text-text">Histori Kehadiran</h2>
          <p className="mt-1 text-xs text-text-muted">
            Riwayat pengajuan dan hasil konfirmasi absensi Pembina.
          </p>
        </div>

        {data.history.length ? (
          <div className="divide-y divide-border">
            {data.history.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">
                    {record.activity?.namaKegiatan || "Kegiatan OSIS"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatShortDate(sessionStart(record.session))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                    {labelStatusKehadiran(recordStatus(record))}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      record.statusVerifikasi ===
                      STATUS_VERIFIKASI_ABSENSI.DIKONFIRMASI
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {labelStatusVerifikasi(record.statusVerifikasi)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon="fact_check"
              title="Belum ada histori absensi"
              description="Data akan muncul setelah kamu mengirim absensi pada sesi kegiatan."
            />
          </div>
        )}
      </section>
    </div>
  );
}
