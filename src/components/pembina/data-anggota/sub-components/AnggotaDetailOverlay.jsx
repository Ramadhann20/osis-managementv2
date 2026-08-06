"use client";

import { useCallback, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import {
  Avatar,
  MemberStatusBadge,
} from "@/components/pembina/_shared/PembinaUi";
import {
  formatDate,
  formatDateTime,
  percentage,
} from "@/components/pembina/_shared/firestoreHelpers";
import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";

const OFFICIAL_STATUSES = ["active", "inactive", "suspended"];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Aktif",
    description: "Anggota aktif dan tercatat sebagai pengurus periode berjalan.",
    icon: "verified_user",
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
  {
    value: "inactive",
    label: "Tidak Aktif",
    description: "Anggota tetap tersimpan, tetapi tidak sedang aktif sebagai pengurus.",
    icon: "person",
    iconClassName: "bg-slate-100 text-slate-700",
  },
  {
    value: "suspended",
    label: "Ditangguhkan",
    description: "Keanggotaan ditangguhkan sementara sampai ada keputusan berikutnya.",
    icon: "block",
    iconClassName: "bg-orange-50 text-orange-700",
  },
];

function divisionLabel(member) {
  const division = member?.division;

  if (!division) return "-";

  const code = String(division.code || "").trim();
  const name = String(division.shortName || division.name || "").trim();

  if (code && name) return `Sekbid ${code}: ${name}`;
  return name || code || "-";
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function useAnggotaDetailOverlay() {
  const { openOverlay, closeOverlay } = useOverlay();

  const openAnggotaDetail = useCallback(
    (member) => {
      if (!member) return;

      openOverlay({
        closeOnBackdrop: true,
        content: (
          <AnggotaDetailModal
            member={member}
            onClose={() => closeOverlay()}
          />
        ),
      });
    },
    [openOverlay, closeOverlay]
  );

  return { openAnggotaDetail };
}

export default function AnggotaDetailModal({ member, onClose }) {
  const { updateDoc, serverTimestamp } = useDb();
  const { openOverlay, closeOverlay, closeAllOverlays } = useOverlay();

  const [savingDecision, setSavingDecision] = useState(null);
  const [decisionError, setDecisionError] = useState("");

  const attendance = percentage(member?.summary?.attendancePercentage);
  const hasAttendance = Boolean(member?.summary);
  const isPendingReview = member?.membershipStatus === "pending_review";
  const canChangeOfficialStatus = OFFICIAL_STATUSES.includes(
    member?.membershipStatus
  );

  const contactItems = [
    ["Email", member?.email],
    ["Nomor telepon", member?.phoneNumber || member?.phone],
  ].filter(([, value]) => hasValue(value));

  const submittedAt =
    member?.reviewSubmittedAt || member?.submittedAt || null;

  const openStatusPicker = () => {
    setDecisionError("");

    openOverlay({
      closeOnBackdrop: true,
      content: (
        <StatusPickerModal
          member={member}
          onClose={() => closeOverlay()}
        />
      ),
    });
  };

  const handleReviewDecision = async (nextStatus) => {
    if (!member?.id || savingDecision) return;

    setSavingDecision(nextStatus);
    setDecisionError("");

    try {
      const timestamp = serverTimestamp();
      const payload = {
        membershipStatus: nextStatus,
        reviewedAt: timestamp,
        updatedAt: timestamp,
      };

      if (nextStatus === "active" && !member?.joinedAt) {
        payload.joinedAt = timestamp;
      }

      await updateDoc("Anggota", member.id, payload);
      closeAllOverlays();
    } catch (error) {
      console.error("UPDATE MEMBER REVIEW ERROR:", error);
      setDecisionError(
        "Status pendaftaran belum berhasil diubah. Periksa koneksi dan izin Firestore."
      );
    } finally {
      setSavingDecision(null);
    }
  };

  return (
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 p-5 backdrop-blur sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={member?.fullName} size="lg" />

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Detail Anggota
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-text sm:text-2xl">
              {member?.fullName || "-"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {member?.organisationPosition || "Anggota"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail anggota"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input text-text-muted transition hover:bg-error-bg hover:text-error-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AppIcon name="close" size={21} />
        </button>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4">
          <div>
            <p className="text-xs font-semibold text-text-muted">
              Status keanggotaan
            </p>
            <p className="mt-1 text-sm font-semibold text-text">
              Data anggota tersimpan pada periode {member?.period || "-"}
            </p>
          </div>
          <MemberStatusBadge status={member?.membershipStatus} />
        </div>

        <DetailSection title="Informasi Organisasi" icon="badge">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="NIS" value={member?.nis || "-"} />
            <DetailItem label="Kelas" value={member?.className || "-"} />
            <DetailItem
              label="Jabatan"
              value={member?.organisationPosition || "Anggota"}
            />
            <DetailItem label="Divisi / Sekbid" value={divisionLabel(member)} />
            <DetailItem label="Periode" value={member?.period || "-"} />
            <DetailItem
              label="Tanggal bergabung"
              value={formatDate(member?.joinedAt)}
            />
          </div>
        </DetailSection>

        {contactItems.length > 0 && (
          <DetailSection title="Kontak" icon="mail">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {contactItems.map(([label, value]) => (
                <DetailItem key={label} label={label} value={value} />
              ))}
            </div>
          </DetailSection>
        )}

        {hasAttendance && (
          <DetailSection title="Ringkasan Kehadiran" icon="event_available">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-text-muted">
                    Persentase kehadiran
                  </p>
                  <p className="mt-1 text-3xl font-bold text-text">
                    {attendance}%
                  </p>
                </div>

                <p className="text-right text-sm text-text-muted">
                  {member?.summary?.totalActivities || 0} kegiatan
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-input">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${attendance}%` }}
                />
              </div>
            </div>
          </DetailSection>
        )}

        <DetailSection title="Riwayat Data" icon="calendar_month">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {submittedAt && (
              <DetailItem
                label="Tanggal pengajuan"
                value={formatDateTime(submittedAt)}
              />
            )}
            <DetailItem
              label="Dibuat"
              value={formatDateTime(member?.createdAt)}
            />
            <DetailItem
              label="Terakhir diperbarui"
              value={formatDateTime(member?.updatedAt)}
            />
          </div>
        </DetailSection>

        {(isPendingReview || canChangeOfficialStatus) && (
          <section className="border-t border-border pt-6">
            {decisionError && (
              <div
                role="alert"
                className="mb-4 rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error-text"
              >
                {decisionError}
              </div>
            )}

            {isPendingReview ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={Boolean(savingDecision)}
                  onClick={() => handleReviewDecision("active")}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AppIcon name="check" size={20} />
                  {savingDecision === "active"
                    ? "Menerima pendaftaran..."
                    : "Terima Pendaftaran"}
                </button>

                <button
                  type="button"
                  disabled={Boolean(savingDecision)}
                  onClick={() => handleReviewDecision("rejected")}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-error-text px-5 text-sm font-bold text-error-text transition hover:bg-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-text focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AppIcon name="close" size={20} />
                  {savingDecision === "rejected"
                    ? "Menolak pendaftaran..."
                    : "Tolak Pendaftaran"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openStatusPicker}
                className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="settings" size={20} />
                  Ubah Status Aktif
                </span>
                <AppIcon name="chevron_right" size={21} />
              </button>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

function StatusPickerModal({ member, onClose }) {
  const { updateDoc, serverTimestamp } = useDb();
  const { closeAllOverlays } = useOverlay();

  const [savingStatus, setSavingStatus] = useState(null);
  const [error, setError] = useState("");

  const handleSelectStatus = async (nextStatus) => {
    if (
      !member?.id ||
      savingStatus ||
      nextStatus === member?.membershipStatus
    ) {
      return;
    }

    setSavingStatus(nextStatus);
    setError("");

    try {
      await updateDoc("Anggota", member.id, {
        membershipStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });

      closeAllOverlays();
    } catch (updateError) {
      console.error("UPDATE MEMBER STATUS ERROR:", updateError);
      setError(
        "Status anggota belum berhasil diubah. Periksa koneksi dan izin Firestore."
      );
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Status Anggota
          </p>
          <h2 className="mt-1 text-xl font-bold text-text">
            Ubah Status Aktif
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Pilih status baru untuk {member?.fullName || "anggota ini"}.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pilihan status"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input text-text-muted transition hover:bg-error-bg hover:text-error-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AppIcon name="close" size={21} />
        </button>
      </header>

      <div className="space-y-3 p-5">
        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error-text"
          >
            {error}
          </div>
        )}

        {STATUS_OPTIONS.map((option) => {
          const isCurrent = option.value === member?.membershipStatus;
          const isSaving = savingStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={Boolean(savingStatus) || isCurrent}
              onClick={() => handleSelectStatus(option.value)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-surface"
              } ${Boolean(savingStatus) && !isSaving ? "opacity-60" : ""}`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${option.iconClassName}`}
              >
                <AppIcon name={option.icon} size={22} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-text-muted">
                  {option.description}
                </span>
              </span>

              <span className="shrink-0 text-primary">
                {isCurrent ? (
                  <AppIcon name="check" size={21} />
                ) : (
                  <AppIcon name="chevron_right" size={21} />
                )}
              </span>
            </button>
          );
        })}

        {savingStatus && (
          <p className="pt-1 text-center text-xs font-semibold text-text-muted">
            Menyimpan perubahan status...
          </p>
        )}
      </div>
    </section>
  );
}

function DetailSection({ title, icon, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <AppIcon name={icon} size={18} />
        </span>
        <h3 className="font-bold text-text">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-text">
        {value || "-"}
      </p>
    </div>
  );
}