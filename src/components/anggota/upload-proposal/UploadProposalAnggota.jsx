"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  formatBytes,
  formatDateTime,
  sortByDateDescending,
} from "@/components/anggota/_shared/formatters";
import {
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  ProposalStatusBadge,
  StatCard,
} from "@/components/anggota/_shared/Ui";

export default function UploadProposalAnggota() {
  const { member, memberId, loading: memberLoading, error: memberError } =
    useCurrentMember();
  const { colRef, query, where } = useDb();

  const [statusFilter, setStatusFilter] = useState("all");

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

  const loading =
    memberLoading ||
    proposals.loading ||
    activities.loading;

  const error =
    memberError ||
    proposals.error ||
    activities.error;

  const data = useMemo(() => {
    const activityMap = new Map(
      (activities.data || []).map((item) => [item.id, item])
    );

    const all = sortByDateDescending(
      proposals.data || [],
      "submittedAt"
    ).map((proposal) => ({
      ...proposal,
      activity:
        activityMap.get(proposal.activityId) || null,
    }));

    return {
      all,
      filtered:
        statusFilter === "all"
          ? all
          : all.filter(
              (proposal) =>
                proposal.status === statusFilter
            ),
      approved: all.filter(
        (item) => item.status === "approved"
      ).length,
      pending: all.filter(
        (item) => item.status === "pending_review"
      ).length,
      revision: all.filter(
        (item) => item.status === "revision_required"
      ).length,
    };
  }, [
    activities.data,
    proposals.data,
    statusFilter,
  ]);

  if (loading) {
    return <PageLoading message="Memuat proposal anggota..." />;
  }

  if (error) {
    return <PageError />;
  }

  if (!member) {
    return (
      <PageError
        title="Profil anggota tidak ditemukan"
        message="Proposal hanya dapat ditampilkan setelah akun terhubung ke dokumen Anggota."
      />
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Dokumen Kegiatan"
        title="Upload Proposal"
        description={`Kelola tampilan proposal yang diajukan oleh ${member.fullName}. Fitur upload akan diaktifkan pada tahap berikutnya.`}
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="receipt"
          label="Total Proposal"
          value={data.all.length}
          helper="Seluruh proposal milik akun ini."
        />
        <StatCard
          icon="check"
          label="Disetujui"
          value={data.approved}
          helper="Proposal yang telah mendapat persetujuan."
          accent="green"
        />
        <StatCard
          icon="calendar_month"
          label="Menunggu Review"
          value={data.pending}
          helper="Sedang diperiksa oleh pembina."
          accent="amber"
        />
        <StatCard
          icon="edit"
          label="Perlu Revisi"
          value={data.revision}
          helper="Proposal yang perlu diperbaiki."
          accent="red"
        />
      </section>

      <section className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AppIcon name="upload_file" size={30} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-text">
            Unggah Proposal Kegiatan
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
            Area ini akan digunakan untuk memilih kegiatan, mengunggah file,
            dan mengirim proposal ke pembina.
          </p>

          <input
            type="file"
            disabled
            className="hidden"
            accept=".pdf,.docx"
          />

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <DisabledAction icon="upload_file">
              Pilih File
            </DisabledAction>
            <DisabledAction icon="arrow_forward" variant="outline">
              Kirim Proposal
            </DisabledAction>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            Format PDF atau DOCX, maksimal 10 MB.
          </p>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-text">
              Riwayat Proposal
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {data.filtered.length} proposal ditampilkan.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="min-h-11 rounded-xl border border-border bg-input px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draf</option>
            <option value="pending_review">
              Menunggu Review
            </option>
            <option value="revision_required">
              Perlu Revisi
            </option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {data.filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="upload_file"
              title="Belum ada proposal"
              description="Proposal yang sudah tersimpan di Firestore akan tampil di sini."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.filtered.map((proposal) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProposalRow({ proposal }) {
  return (
    <article className="p-5 hover:bg-input/40">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppIcon name="receipt" size={23} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-text">
                {proposal.title}
              </h3>
              <ProposalStatusBadge status={proposal.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {proposal.activity?.title ||
                "Kegiatan tidak ditemukan"}
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">
              {proposal.description || "Tidak ada deskripsi."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm lg:w-[360px]">
          <div>
            <p className="text-xs text-text-muted">File</p>
            <p className="mt-1 truncate font-semibold text-text">
              {proposal.fileName || "-"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {formatBytes(proposal.fileSizeBytes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Dikirim</p>
            <p className="mt-1 font-semibold text-text">
              {formatDateTime(proposal.submittedAt)}
            </p>
          </div>
        </div>

        <DisabledAction icon="download" variant="outline">
          Lihat File
        </DisabledAction>
      </div>

      {proposal.reviewNote && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${
            proposal.status === "revision_required" ||
            proposal.status === "rejected"
              ? "bg-amber-50 text-amber-800"
              : "bg-primary/5 text-text-muted"
          }`}
        >
          <span className="font-semibold">Catatan pembina: </span>
          {proposal.reviewNote}
        </div>
      )}
    </article>
  );
}
