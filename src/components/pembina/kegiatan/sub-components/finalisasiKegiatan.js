import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  JENIS_KEGIATAN,
  KOLEKSI,
  MODE_JADWAL,
  STATUS_JADWAL,
  STATUS_KEGIATAN,
  STATUS_LAPORAN,
  STATUS_PELAKSANAAN,
  STATUS_PROPOSAL,
  STATUS_SESI_ABSENSI,
  SUMBER_FINALISASI_JADWAL,
  buatPayloadPelaksanaan,
  buatPayloadSesiAbsensi,
} from "../konfigurasiManajemenKegiatan";

const MAX_OCCURRENCES = 500;

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value?.toDate === "function") {
    return parseDateOnly(value.toDate());
  }

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function combineDateAndTime(dateKey, time) {
  if (!dateKey || !time) return null;
  const value = new Date(`${dateKey}T${String(time).slice(0, 5)}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function minutesBetween(startAt, endAt) {
  if (!(startAt instanceof Date) || !(endAt instanceof Date)) return 0;
  const value = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
  return value > 0 ? value : 0;
}

function fallbackSchedule(activity) {
  const start = toDate(activity?.waktuMulai);
  const end = toDate(activity?.waktuSelesai);
  if (!start) return null;

  const dateKey = toDateKey(start);
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endTime = end
    ? `${pad(end.getHours())}:${pad(end.getMinutes())}`
    : startTime;

  return {
    modeJadwal: MODE_JADWAL.SEKALI,
    tanggalMulaiPertama: dateKey,
    tanggalSelesaiPertama: dateKey,
    jumlahHariPerPelaksanaan: 1,
    jamMulaiDefault: startTime,
    jamSelesaiDefault: endTime,
    templateSesi: [
      {
        selisihHari: 0,
        jamMulai: startTime,
        jamSelesai: endTime,
        durasiMenit: end ? minutesBetween(start, end) : Number(activity?.durasiMenit || 0),
      },
    ],
  };
}

function buildOccurrenceStarts(schedule, recurrence) {
  const first = parseDateOnly(schedule?.tanggalMulaiPertama);
  if (!first) return [];

  const recurring =
    schedule?.modeJadwal === MODE_JADWAL.BERULANG || recurrence?.aktif === true;

  if (!recurring) return [first];

  const until = parseDateOnly(recurrence?.sampai);
  if (!until || until < first) return [first];

  const interval = Math.max(1, Number(recurrence?.interval) || 1);
  const results = [];
  const cursor = new Date(first);

  while (cursor <= until && results.length < MAX_OCCURRENCES) {
    results.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + interval * 7);
  }

  return results;
}

export function buildOccurrencesFromActivity(activity) {
  const schedule = activity?.jadwalFinal || activity?.jadwalRencana || fallbackSchedule(activity);
  const recurrence = activity?.pengulanganFinal || activity?.pengulanganRencana || {
    aktif: false,
  };

  if (!schedule) return [];

  const templates = Array.isArray(schedule.templateSesi)
    ? schedule.templateSesi
    : [];
  if (!templates.length) return [];

  const starts = buildOccurrenceStarts(schedule, recurrence);
  const results = [];

  starts.forEach((occurrenceStart, occurrenceIndex) => {
    const sessions = templates
      .map((template, sessionIndex) => {
        const sessionDate = new Date(occurrenceStart);
        sessionDate.setDate(
          sessionDate.getDate() + Math.max(0, Number(template?.selisihHari) || 0)
        );
        const date = toDateKey(sessionDate);
        const startAt = combineDateAndTime(
          date,
          template?.jamMulai || schedule?.jamMulaiDefault
        );
        const endAt = combineDateAndTime(
          date,
          template?.jamSelesai || schedule?.jamSelesaiDefault
        );

        if (!startAt || !endAt || endAt <= startAt) return null;

        return {
          sessionIndex,
          date,
          startAt,
          endAt,
          durationMinutes:
            Number(template?.durasiMenit) > 0
              ? Number(template.durasiMenit)
              : minutesBetween(startAt, endAt),
        };
      })
      .filter(Boolean);

    if (!sessions.length) return;

    results.push({
      occurrenceIndex,
      startDate: sessions[0].date,
      endDate: sessions[sessions.length - 1].date,
      sessions,
    });
  });

  return results;
}

async function commitSetChunks(db, writes, chunkSize = 425) {
  const committedRefs = [];

  for (let index = 0; index < writes.length; index += chunkSize) {
    const chunk = writes.slice(index, index + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
    committedRefs.push(...chunk.map(({ ref }) => ref));
  }

  return committedRefs;
}

async function deleteRefsInChunks(db, refs, chunkSize = 425) {
  for (let index = 0; index < refs.length; index += chunkSize) {
    const batch = writeBatch(db);
    refs.slice(index, index + chunkSize).forEach((ref) => batch.delete(ref));
    await batch.commit().catch(() => {});
  }
}

export async function finalisasiKegiatan({
  db,
  activity,
  proposal = null,
  participantIds = [],
  serverTimestamp,
  updateDoc,
}) {
  if (!db || !activity?.id) {
    throw new Error("Data kegiatan belum lengkap untuk difinalisasi.");
  }

  const ids = Array.from(new Set(participantIds.filter(Boolean)));
  if (!ids.length) {
    throw new Error("Tentukan minimal satu peserta sebelum menyetujui kegiatan.");
  }

  const isProgramKerja = activity.jenisKegiatan === JENIS_KEGIATAN.PROGRAM_KERJA;
  if (
    isProgramKerja &&
    (proposal?.status || activity?.statusProposal) !== STATUS_PROPOSAL.DISETUJUI
  ) {
    throw new Error("Proposal harus disetujui terlebih dahulu.");
  }

  const existingExecution = await getDocs(
    query(
      collection(db, KOLEKSI.PELAKSANAAN_KEGIATAN),
      where("idKegiatan", "==", activity.id),
      limit(1)
    )
  );

  if (!existingExecution.empty) {
    throw new Error(
      "Pelaksanaan kegiatan sudah pernah dibuat. Finalisasi dibatalkan untuk mencegah sesi absensi ganda."
    );
  }

  const occurrences = buildOccurrencesFromActivity(activity);
  if (!occurrences.length) {
    throw new Error("Jadwal kegiatan belum valid untuk membuat sesi absensi.");
  }

  const waktu = serverTimestamp();
  const childWrites = [];

  for (const occurrence of occurrences) {
    const first = occurrence.sessions[0];
    const last = occurrence.sessions[occurrence.sessions.length - 1];
    const pelaksanaanRef = doc(collection(db, KOLEKSI.PELAKSANAAN_KEGIATAN));

    childWrites.push({
      ref: pelaksanaanRef,
      data: buatPayloadPelaksanaan({
        idKegiatan: activity.id,
        idPeriode: activity.idPeriode || null,
        indeksPelaksanaan: occurrence.occurrenceIndex,
        tanggalMulai: occurrence.startDate,
        tanggalSelesai: occurrence.endDate,
        waktuMulai: first?.startAt || null,
        waktuSelesai: last?.endAt || null,
        jumlahSesi: occurrence.sessions.length,
        status: STATUS_PELAKSANAAN.TERENCANA,
        dibatalkanPada: null,
        dibuatPada: waktu,
        diperbaruiPada: waktu,
      }),
    });

    for (const session of occurrence.sessions) {
      const sesiRef = doc(collection(db, KOLEKSI.SESI_ABSENSI));
      childWrites.push({
        ref: sesiRef,
        data: buatPayloadSesiAbsensi({
          idKegiatan: activity.id,
          idPelaksanaan: pelaksanaanRef.id,
          idPeriode: activity.idPeriode || null,
          indeksPelaksanaan: occurrence.occurrenceIndex,
          indeksSesi: session.sessionIndex,
          tanggal: session.date,
          waktuMulai: session.startAt,
          waktuSelesai: session.endAt,
          durasiMenit: session.durationMinutes,
          status: STATUS_SESI_ABSENSI.TERJADWAL,
          dibuatPada: waktu,
          diperbaruiPada: waktu,
        }),
      });
    }
  }

  const committedRefs = [];

  try {
    committedRefs.push(...(await commitSetChunks(db, childWrites)));

    const firstOccurrence = occurrences[0];
    const lastOccurrence = occurrences[occurrences.length - 1];
    const firstSession = firstOccurrence.sessions[0];
    const firstLastSession = firstOccurrence.sessions[firstOccurrence.sessions.length - 1];
    const seriesLastSession = lastOccurrence.sessions[lastOccurrence.sessions.length - 1];
    const totalSessions = occurrences.reduce(
      (total, item) => total + item.sessions.length,
      0
    );

    const usulanPeserta = activity.usulanPeserta
      ? {
          ...activity.usulanPeserta,
          statusReview: "disetujui",
          ditinjauPada: waktu,
        }
      : null;

    const updatePayload = {
      jadwalFinal: activity.jadwalFinal || activity.jadwalRencana || null,
      pengulanganFinal:
        activity.pengulanganFinal || activity.pengulanganRencana || null,
      statusJadwal: STATUS_JADWAL.DIFINALISASI,
      sumberFinalisasiJadwal:
        activity.sumberFinalisasiJadwal || SUMBER_FINALISASI_JADWAL.RENCANA,
      difinalisasiPada: waktu,
      waktuMulai: firstSession?.startAt || activity.waktuMulai || null,
      waktuSelesai: firstLastSession?.endAt || activity.waktuSelesai || null,
      waktuSelesaiSeri: seriesLastSession?.endAt || activity.waktuSelesaiSeri || null,
      jumlahPelaksanaan: occurrences.length,
      jumlahSesiAbsensi: totalSessions,
      kapasitasPeserta: ids.length,
      jumlahPeserta: 0,
      pesertaFinal: {
        idAnggota: ids,
        jumlahPeserta: ids.length,
        sumber: activity.usulanPeserta ? "usulan_anggota" : "ditentukan_pembina",
        difinalisasiPada: waktu,
      },
      usulanPeserta,
      status: STATUS_KEGIATAN.AKAN_DATANG,
      statusLaporan:
        isProgramKerja
          ? activity.statusLaporan || STATUS_LAPORAN.BELUM_DIMULAI
          : activity.statusLaporan || null,
      diperbaruiPada: waktu,
    };

    if (isProgramKerja && proposal?.id) {
      updatePayload.idProposal = proposal.id;
      updatePayload.statusProposal = STATUS_PROPOSAL.DISETUJUI;
    }

    if (activity.pengajuanRapat) {
      updatePayload.pengajuanRapat = {
        ...activity.pengajuanRapat,
        status: "disetujui",
        ditinjauPada: waktu,
      };
    }

    if (activity.pengajuanProgramKerja) {
      updatePayload.pengajuanProgramKerja = {
        ...activity.pengajuanProgramKerja,
        status: "disetujui",
        ditinjauPada: waktu,
      };
    }

    await updateDoc(KOLEKSI.KEGIATAN, activity.id, updatePayload);

    return {
      jumlahPelaksanaan: occurrences.length,
      jumlahSesiAbsensi: totalSessions,
      jumlahPeserta: ids.length,
    };
  } catch (error) {
    if (committedRefs.length) {
      await deleteRefsInChunks(db, [...committedRefs].reverse());
    }
    throw error;
  }
}
