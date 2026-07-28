"use client";

import Link from "next/link";
import { useMemo } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useDoc } from "@/hooks/useDoc";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  formatShortDate,
  formatTime,
  getMembershipStatusLabel,
  sortByDateDescending,
  toDate,
} from "@/components/anggota/_shared/formatters";
import {
  AttendanceBadge,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  SectionTitle,
  StatCard,
} from "@/components/anggota/_shared/Ui";

export default function DashboardAnggota() {
  const { member, memberId, loading: memberLoading, error: memberError } =
    useCurrentMember();
  const { colRef, query, where, limit } = useDb();

  const attendance = useCollection(
    () =>
      query(
        colRef("Absensi"),
        where("memberId", "==", memberId)
      ),
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const summaries = useCollection(
    () =>
      query(
        colRef("RingkasanAbsensi"),
        where("memberId", "==", memberId),
        limit(1)
      ),
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const proposals = useCollection(
    () =>
      query(
        colRef("Proposal"),
        where("uploadedBy", "==", memberId)
      ),
    [memberId],
    { enabled: Boolean(memberId) }
  );

  const activities = useCollection(
    () => colRef("Kegiatan"),
    [],
    { enabled: true }
  );

  const announcements = useCollection(
    () => colRef("Pengumuman"),
    [],
    { enabled: true }
  );

  const divisions = useCollection(
    () => colRef("Divisi"),
    [],
    { enabled: true }
  );

  const contacts = useDoc(
    "KontakSistem",
    "osis-sma-mutiara-2",
    { enabled: true }
  );

  const loading =
    memberLoading ||
    attendance.loading ||
    summaries.loading ||
    proposals.loading ||
    activities.loading ||
    announcements.loading ||
    divisions.loading ||
    contacts.loading;

  const error =
    memberError ||
    attendance.error ||
    summaries.error ||
    proposals.error ||
    activities.error ||
    announcements.error ||
    divisions.error ||
    contacts.error;

  const data = useMemo(() => {
    const activityMap = new Map(
      (activities.data || []).map((item) => [item.id, item])
    );

    const recentAttendance = sortByDateDescending(
      attendance.data || [],
      "createdAt"
    )
      .slice(0, 5)
      .map((record) => ({
        ...record,
        activity: activityMap.get(record.activityId) || null,
      }));

    const upcomingActivities = (activities.data || [])
      .filter((activity) =>
        ["upcoming", "ongoing"].includes(activity.status)
      )
      .sort((a, b) => {
        const dateA = toDate(a.startAt)?.getTime() || 0;
        const dateB = toDate(b.startAt)?.getTime() || 0;
        return dateA - dateB;
      })
      .slice(0, 4);

    const publishedAnnouncements = sortByDateDescending(
      (announcements.data || []).filter(
        (item) =>
          item.isPublished !== false &&
          (!Array.isArray(item.audienceRoles) ||
            item.audienceRoles.includes("anggota"))
      ),
      "publishedAt"
    ).slice(0, 4);

    const joinedActivities = (activities.data || []).filter(
      (activity) =>
        activity.organiserMemberId === memberId ||
        activity.participantMemberIds?.includes(memberId) ||
        activity.committeeMemberIds?.includes(memberId)
    );

    const division = (divisions.data || []).find(
      (item) => item.id === member?.divisionId
    );

    return {
      recentAttendance,
      upcomingActivities,
      publishedAnnouncements,
      joinedActivities,
      division,
      summary: summaries.data?.[0] || null,
    };
  }, [
    activities.data,
    attendance.data,
    announcements.data,
    divisions.data,
    member,
    memberId,
    summaries.data,
  ]);

  if (loading) {
    return <PageLoading message="Memuat dashboard anggota..." />;
  }

  if (error) {
    return <PageError />;
  }

  if (!member) {
    return (
      <PageError
        title="Profil anggota tidak ditemukan"
        message="Hubungkan dokumen Anggota dengan akun login melalui field uid, userId, atau email."
      />
    );
  }

  const attendancePercentage =
    data.summary?.attendancePercentage ??
    calculateAttendancePercentage(attendance.data || []);

  const pendingProposalCount = (proposals.data || []).filter(
    (item) =>
      item.status === "pending_review" ||
      item.status === "revision_required"
  ).length;

  return (
    <div>
      <PageHeading
        eyebrow="Dashboard Anggota"
        title={`Halo, ${member.fullName || "Anggota"}`}
        description="Pantau kehadiran, kegiatan, proposal, dan informasi organisasi dalam satu halaman."
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="verified_user"
          label="Total Kehadiran"
          value={`${attendancePercentage}%`}
          helper="Persentase kehadiran pada periode aktif."
        />

        <StatCard
          icon="event_available"
          label="Kegiatan Diikuti"
          value={data.joinedActivities.length}
          helper="Jumlah kegiatan yang terhubung dengan akunmu."
          accent="blue"
        />

        <StatCard
          icon="badge"
          label="Status Keanggotaan"
          value={getMembershipStatusLabel(member.membershipStatus)}
          helper={
            data.division
              ? `Sekbid ${data.division.code}: ${data.division.shortName}`
              : "Divisi belum ditentukan."
          }
          accent="green"
        />

        <article className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-sm">
          <p className="text-xs font-medium opacity-80">Butuh Bantuan?</p>
          <h2 className="mt-2 text-lg font-bold">Hubungi Sekretaris</h2>
          <p className="mt-2 max-w-[220px] text-xs leading-5 opacity-80">
            {contacts.data?.secretary?.name ||
              "Kontak sekretaris belum tersedia."}
          </p>
          <button
            type="button"
            disabled
            className="mt-5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-primary opacity-90"
          >
            Hubungi Admin
          </button>
          <div className="absolute -bottom-4 -right-3 opacity-15">
            <AppIcon name="help_outline" size={86} />
          </div>
        </article>
      </section>

      <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:col-span-3">
          <div className="border-b border-border p-5">
            <SectionTitle
              icon="fact_check"
              title="Histori Kehadiran"
              description="Lima catatan kehadiran terakhir."
              action={
                <Link
                  href="/anggota/absensi"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Lihat Semua
                </Link>
              }
            />
          </div>

          {data.recentAttendance.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="fact_check"
                title="Belum ada histori kehadiran"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-input text-xs uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Nama Kegiatan
                    </th>
                    <th className="px-5 py-4 font-semibold">Tanggal</th>
                    <th className="px-5 py-4 font-semibold">
                      Jam Presensi
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-input/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-text">
                          {record.activity?.title ||
                            "Kegiatan tidak ditemukan"}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {record.activity?.location || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {formatShortDate(
                          record.activity?.startAt ||
                            record.createdAt
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {formatTime(record.checkInAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <AttendanceBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <SectionTitle
            icon="calendar_month"
            title="Kegiatan Mendatang"
            description="Agenda terdekat yang perlu diperhatikan."
            action={
              <Link
                href="/anggota/kegiatan"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lihat Semua
              </Link>
            }
          />

          <div className="mt-5 space-y-3">
            {data.upcomingActivities.length === 0 ? (
              <EmptyState
                icon="calendar_month"
                title="Tidak ada kegiatan mendatang"
              />
            ) : (
              data.upcomingActivities.map((activity) => (
                <article
                  key={activity.id}
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                    <span className="text-[10px] font-semibold uppercase">
                      {new Intl.DateTimeFormat("id-ID", {
                        month: "short",
                      }).format(toDate(activity.startAt))}
                    </span>
                    <span className="text-base font-bold leading-none">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "2-digit",
                      }).format(toDate(activity.startAt))}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-text">
                      {activity.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatTime(activity.startAt)}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-muted">
                      {activity.location}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <SectionTitle
          icon="campaign"
          title="Pengumuman Terbaru"
          description="Informasi resmi untuk anggota OSIS."
          action={
            <Link
              href="/anggota/pengumuman"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Buka Pengumuman
            </Link>
          }
        />

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.publishedAnnouncements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-text">
                  {announcement.title}
                </h3>
                {announcement.isPinned && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    Disematkan
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">
                {announcement.summary || announcement.content}
              </p>
              <p className="mt-3 text-[11px] font-medium text-primary">
                {formatShortDate(announcement.publishedAt)}
              </p>
            </article>
          ))}
        </div>

        {pendingProposalCount > 0 && (
          <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Kamu memiliki {pendingProposalCount} proposal yang sedang
            menunggu review atau membutuhkan revisi.
          </div>
        )}
      </section>
    </div>
  );
}

function calculateAttendancePercentage(records) {
  if (!records.length) return 0;

  const attended = records.filter((item) =>
    ["present", "late"].includes(item.status)
  ).length;

  return Math.round((attended / records.length) * 100);
}
