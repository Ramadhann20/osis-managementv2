"use client";

import { useMemo, useState } from "react";

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
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  StatCard,
} from "@/components/anggota/_shared/Ui";

const STATUS_KEHADIRAN = Object.freeze({
  HADIR: "hadir",
  TERLAMBAT: "terlambat",
  IZIN: "izin",
  SAKIT: "sakit",
  ALPA: "alpa",
});

function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function normalisasiStatusKehadiran(value) {
  const status = String(value || "").trim().toLowerCase();

  const mapping = {
    hadir: STATUS_KEHADIRAN.HADIR,
    present: STATUS_KEHADIRAN.HADIR,
    terlambat: STATUS_KEHADIRAN.TERLAMBAT,
    late: STATUS_KEHADIRAN.TERLAMBAT,
    izin: STATUS_KEHADIRAN.IZIN,
    excused: STATUS_KEHADIRAN.IZIN,
    sakit: STATUS_KEHADIRAN.SAKIT,
    sick: STATUS_KEHADIRAN.SAKIT,
    alpa: STATUS_KEHADIRAN.ALPA,
    absent: STATUS_KEHADIRAN.ALPA,
  };

  return mapping[status] || status || "-";
}

function statusRecord(record) {
  return normalisasiStatusKehadiran(
    record?.statusKehadiran ?? record?.status
  );
}

function waktuCheckIn(record) {
  return (
    record?.waktuCheckIn ??
    record?.checkInPada ??
    record?.checkInAt ??
    null
  );
}

function waktuCheckOut(record) {
  return (
    record?.waktuCheckOut ??
    record?.checkOutPada ??
    record?.checkOutAt ??
    null
  );
}

function catatanRecord(record) {
  return record?.catatan ?? record?.note ?? "-";
}

function waktuRecord(record) {
  return (
    waktuCheckIn(record) ??
    record?.dibuatPada ??
    record?.createdAt ??
    null
  );
}

function sortAbsensiTerbaru(records) {
  return [...records].sort((a, b) => {
    const waktuA = toDate(waktuRecord(a))?.getTime() || 0;
    const waktuB = toDate(waktuRecord(b))?.getTime() || 0;
    return waktuB - waktuA;
  });
}

export default function AbsensiAnggota() {
  const {
    member,
    memberId,
    loading: memberLoading,
    error: memberError,
  } = useCurrentMember();

  const { colRef, query, where, limit } = useDb();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const attendance = useCollection(
    () =>
      memberId
        ? query(colRef("Absensi"), where("idAnggota", "==", memberId))
        : null,
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const summaries = useCollection(
    () =>
      memberId
        ? query(
            colRef("RingkasanAbsensi"),
            where("idAnggota", "==", memberId),
            limit(1)
          )
        : null,
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const activities = useCollection(() => colRef("Kegiatan"), [], {
    enabled: true,
  });

  const sessions = useCollection(() => colRef("SesiAbsensi"), [], {
    enabled: true,
  });

  const loading =
    memberLoading ||
    attendance.loading ||
    summaries.loading ||
    activities.loading ||
    sessions.loading;

  const error =
    memberError ||
    attendance.error ||
    summaries.error ||
    activities.error ||
    sessions.error;

  const rows = useMemo(() => {
    const activityMap = new Map(
      rowsOf(activities).map((item) => [item.id, item])
    );

    const sessionMap = new Map(
      rowsOf(sessions).map((item) => [item.id, item])
    );

    const keyword = search.trim().toLowerCase();

    return sortAbsensiTerbaru(rowsOf(attendance))
      .map((record) => {
        const idSesi = record.idSesi ?? record.sessionId ?? null;
        const session = idSesi ? sessionMap.get(idSesi) || null : null;

        const idKegiatan =
          record.idKegiatan ??
          record.activityId ??
          session?.idKegiatan ??
          null;

        return {
          ...record,
          session,
          activity: idKegiatan ? activityMap.get(idKegiatan) || null : null,
          statusTampil: statusRecord(record),
        };
      })
      .filter((record) => {
        const namaKegiatan = String(
          record.activity?.namaKegiatan || ""
        ).toLowerCase();
        const lokasi = String(record.activity?.lokasi || "").toLowerCase();

        const matchesSearch =
          !keyword ||
          namaKegiatan.includes(keyword) ||
          lokasi.includes(keyword);

        const matchesStatus =
          statusFilter === "all" || record.statusTampil === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [activities, sessions, attendance, search, statusFilter]);

  const summary = useMemo(() => {
    const stored = rowsOf(summaries)[0] || null;
    const records = rowsOf(attendance);

    const hitung = (status) =>
      records.filter((item) => statusRecord(item) === status).length;

    const hadir = hitung(STATUS_KEHADIRAN.HADIR);
    const terlambat = hitung(STATUS_KEHADIRAN.TERLAMBAT);
    const izin = hitung(STATUS_KEHADIRAN.IZIN);
    const sakit = hitung(STATUS_KEHADIRAN.SAKIT);
    const alpa = hitung(STATUS_KEHADIRAN.ALPA);

    const persentaseHitung = records.length
      ? Math.round(((hadir + terlambat) / records.length) * 100)
      : 0;

    return {
      jumlahKegiatan: stored?.jumlahKegiatan ?? records.length,
      persentaseKehadiran:
        stored?.persentaseKehadiran ?? persentaseHitung,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
    };
  }, [attendance, summaries]);

  if (loading) {
    return <PageLoading message="Memuat histori kehadiran..." />;
  }

  if (error) {
    return <PageError message={error.message} />;
  }

  if (!member) {
    return (
      <PageError
        title="Profil anggota tidak ditemukan"
        message="Histori absensi hanya dapat ditampilkan jika akun terhubung ke dokumen Anggota melalui idPengguna."
      />
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Kehadiran Anggota"
        title="Histori Kehadiran"
        description={`Rekap kehadiran ${member.namaLengkap || "Anggota"} pada kegiatan OSIS.`}
        action={
          <div className="flex flex-wrap gap-3">
            <DisabledAction icon="download" variant="neutral">
              Export PDF
            </DisabledAction>
            <DisabledAction icon="download">Export Excel</DisabledAction>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="event_available"
          label="Total Presensi"
          value={summary.jumlahKegiatan || 0}
          helper={`${summary.persentaseKehadiran || 0}% tingkat kehadiran`}
        />
        <StatCard
          icon="check"
          label="Hadir"
          value={summary.hadir}
          helper="Hadir tepat waktu."
          accent="green"
        />
        <StatCard
          icon="calendar_month"
          label="Terlambat"
          value={summary.terlambat}
          helper="Kehadiran setelah waktu mulai."
          accent="amber"
        />
        <StatCard
          icon="close"
          label="Izin, Sakit, atau Alpa"
          value={summary.izin + summary.sakit + summary.alpa}
          helper="Kehadiran tidak penuh."
          accent="red"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-text">Daftar Kehadiran</h2>
            <p className="mt-1 text-xs text-text-muted">
              {rows.length} data ditampilkan.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <AppIcon
                name="search"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kegiatan atau lokasi"
                className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Status</option>
              <option value={STATUS_KEHADIRAN.HADIR}>Hadir</option>
              <option value={STATUS_KEHADIRAN.TERLAMBAT}>Terlambat</option>
              <option value={STATUS_KEHADIRAN.IZIN}>Izin</option>
              <option value={STATUS_KEHADIRAN.SAKIT}>Sakit</option>
              <option value={STATUS_KEHADIRAN.ALPA}>Alpa</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="fact_check"
              title="Data kehadiran tidak ditemukan"
              description="Coba ubah kata pencarian atau filter status."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-4 font-semibold">Kegiatan</th>
                  <th className="px-5 py-4 font-semibold">Tanggal</th>
                  <th className="px-5 py-4 font-semibold">Check In</th>
                  <th className="px-5 py-4 font-semibold">Check Out</th>
                  <th className="px-5 py-4 font-semibold">Catatan</th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((record) => (
                  <tr key={record.id} className="hover:bg-input/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text">
                        {record.activity?.namaKegiatan ||
                          "Kegiatan tidak ditemukan"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {record.activity?.lokasi || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatShortDate(
                        record.session?.tanggal ||
                          record.activity?.waktuMulai ||
                          waktuRecord(record)
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatTime(waktuCheckIn(record))}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatTime(waktuCheckOut(record))}
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-sm text-text-muted">
                      {catatanRecord(record)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusKehadiranBadge status={record.statusTampil} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusKehadiranBadge({ status }) {
  const config = {
    hadir: {
      label: "Hadir",
      className: "bg-emerald-50 text-emerald-700",
    },
    terlambat: {
      label: "Terlambat",
      className: "bg-amber-50 text-amber-700",
    },
    izin: {
      label: "Izin",
      className: "bg-blue-50 text-blue-700",
    },
    sakit: {
      label: "Sakit",
      className: "bg-violet-50 text-violet-700",
    },
    alpa: {
      label: "Alpa",
      className: "bg-red-50 text-red-700",
    },
  }[status] || {
    label: status || "-",
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
