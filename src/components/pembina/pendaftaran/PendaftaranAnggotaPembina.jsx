"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  firstError,
  formatDate,
  formatDateTime,
  formatLongDate,
  isLoading,
  rowsOf,
  sortDateDesc,
} from "@/components/pembina/_shared/firestoreHelpers";
import {
  Avatar,
  DisabledAction,
  EmptyState,
  MemberStatusBadge,
  PageError,
  PageHeading,
  PageLoading,
  SectionHeader,
  StatCard,
} from "@/components/pembina/_shared/PembinaUi";

export default function PendaftaranAnggotaPembina() {
  const { colRef } = useDb();

  const members = useCollection(() => colRef("Anggota"), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], {
    enabled: true,
  });
  const reviewLogs = useCollection(
    () => colRef("ReviewPendaftaran"),
    [],
    { enabled: true }
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");

  const loading = isLoading(members, divisions, reviewLogs);
  const error = firstError(members, divisions, reviewLogs);

  const data = useMemo(() => {
    const divisionRows = rowsOf(divisions);
    const divisionMap = new Map(
      divisionRows.map((item) => [item.id, item])
    );
    const logs = rowsOf(reviewLogs);

    const registrations = sortDateDesc(
      rowsOf(members).filter(
        (item) =>
          ["pending_review", "rejected"].includes(
            item.membershipStatus
          ) ||
          (item.membershipStatus === "active" && item.submittedAt)
      ),
      "submittedAt"
    ).map((item) => ({
      ...item,
      division: divisionMap.get(
        item.divisionInterest || item.divisionId
      ),
      logs: sortDateDesc(
        logs.filter((log) => log.memberId === item.id),
        "createdAt"
      ),
    }));

    const keyword = search.trim().toLowerCase();

    return {
      registrations,
      filtered: registrations.filter((item) => {
        return (
          (!keyword ||
            item.fullName?.toLowerCase().includes(keyword) ||
            item.nis?.toLowerCase().includes(keyword) ||
            item.className?.toLowerCase().includes(keyword)) &&
          (statusFilter === "all" ||
            item.membershipStatus === statusFilter) &&
          (divisionFilter === "all" ||
            item.divisionInterest === divisionFilter ||
            item.divisionId === divisionFilter)
        );
      }),
      divisionRows,
      pending: registrations.filter(
        (item) => item.membershipStatus === "pending_review"
      ).length,
      rejected: registrations.filter(
        (item) => item.membershipStatus === "rejected"
      ).length,
      accepted: registrations.filter(
        (item) => item.membershipStatus === "active"
      ).length,
      resubmitted: registrations.filter(
        (item) => Number(item.resubmissionCount || 0) > 0
      ).length,
    };
  }, [
    members,
    divisions,
    reviewLogs,
    search,
    statusFilter,
    divisionFilter,
  ]);

  useEffect(() => {
    if (
      data.filtered.length &&
      !data.filtered.some((item) => item.id === selectedId)
    ) {
      setSelectedId(data.filtered[0].id);
    }
  }, [data.filtered, selectedId]);

  if (loading)
    return <PageLoading message="Memuat pendaftaran anggota..." />;
  if (error) return <PageError message={error.message} />;

  const selected = data.registrations.find(
    (item) => item.id === selectedId
  );

  return (
    <div>
      <PageHeading
        eyebrow="Perekrutan Anggota"
        title="Pendaftaran Anggota"
        description="Tinjau biodata, pilihan sekbid, motivasi, dan status calon anggota OSIS."
        action={
          <DisabledAction icon="download" variant="outline">
            Export Pendaftar
          </DisabledAction>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="person_add"
          label="Menunggu Review"
          value={data.pending}
          helper="Belum mendapat keputusan"
          accent="amber"
        />
        <StatCard
          icon="close"
          label="Ditolak"
          value={data.rejected}
          helper="Pendaftaran ditolak"
          accent="red"
        />
        <StatCard
          icon="verified_user"
          label="Diterima"
          value={data.accepted}
          helper="Sudah menjadi anggota"
          accent="green"
        />
        <StatCard
          icon="edit"
          label="Daftar Ulang"
          value={data.resubmitted}
          helper="Pendaftar yang pernah memperbaiki data"
          accent="blue"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:col-span-3">
          <div className="border-b border-border p-5">
            <SectionHeader
              icon="person_add"
              title="Daftar Pendaftar"
              description={`${data.filtered.length} data ditampilkan.`}
            />

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau NIS"
                className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
              >
                <option value="all">Semua Status</option>
                <option value="pending_review">Menunggu Review</option>
                <option value="rejected">Ditolak</option>
                <option value="active">Diterima</option>
              </select>

              <select
                value={divisionFilter}
                onChange={(event) =>
                  setDivisionFilter(event.target.value)
                }
                className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary"
              >
                <option value="all">Semua Sekbid</option>
                {data.divisionRows.map((division) => (
                  <option key={division.id} value={division.id}>
                    Sekbid {division.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {data.filtered.length ? (
            <div className="divide-y divide-border">
              {data.filtered.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedId(member.id)}
                  className={`flex w-full items-center gap-4 p-5 text-left transition ${
                    selectedId === member.id
                      ? "bg-primary/5"
                      : "hover:bg-input/40"
                  }`}
                >
                  <Avatar name={member.fullName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text">
                        {member.fullName}
                      </p>
                      <MemberStatusBadge
                        status={member.membershipStatus}
                      />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {member.nis} · {member.className} ·{" "}
                      {member.division
                        ? `Sekbid ${member.division.code}`
                        : "Belum memilih sekbid"}
                    </p>
                    <p className="mt-2 text-[11px] text-text-muted">
                      Diajukan {formatDateTime(member.submittedAt)}
                    </p>
                  </div>
                  <AppIcon
                    name="chevron_right"
                    size={20}
                    className="text-text-muted"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                icon="person_add"
                title="Pendaftar tidak ditemukan"
              />
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
          {selected ? (
            <RegistrationDetail member={selected} />
          ) : (
            <EmptyState
              icon="person"
              title="Pilih pendaftar"
              description="Klik salah satu data untuk melihat detail."
            />
          )}
        </article>
      </section>
    </div>
  );
}

function RegistrationDetail({ member }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <Avatar name={member.fullName} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-text">
              {member.fullName}
            </h2>
            <MemberStatusBadge status={member.membershipStatus} />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {member.nis} · {member.className}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <DetailItem
          label="Tempat, Tanggal Lahir"
          value={`${member.placeOfBirth || "-"}, ${formatLongDate(
            member.dateOfBirth
          )}`}
        />
        <DetailItem
          label="Sekbid yang Diminati"
          value={
            member.division
              ? `Sekbid ${member.division.code}: ${member.division.name}`
              : "-"
          }
        />
        <DetailItem
          label="Motivasi"
          value={member.motivation || "-"}
        />
        <DetailItem
          label="Pengalaman Organisasi"
          value={member.organizationExperience || "-"}
        />
        <DetailItem
          label="Kontak"
          value={`${member.email || "-"} · ${member.whatsapp || "-"}`}
        />
        <DetailItem
          label="Jumlah Daftar Ulang"
          value={String(member.resubmissionCount || 0)}
        />
      </div>

      {member.logs?.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Histori Review
          </p>
          <div className="mt-3 space-y-3">
            {member.logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl bg-surface p-4"
              >
                <p className="text-sm font-semibold text-text">
                  {log.action}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  {log.note || "Tidak ada catatan."}
                </p>
                <p className="mt-2 text-[10px] text-primary">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3">
        <DisabledAction icon="check">Setujui Pendaftaran</DisabledAction>
        <DisabledAction icon="edit" variant="outline">
          Minta Perbaikan
        </DisabledAction>
        <DisabledAction icon="close" variant="danger">
          Tolak Pendaftaran
        </DisabledAction>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-text">
        {value}
      </p>
    </div>
  );
}
