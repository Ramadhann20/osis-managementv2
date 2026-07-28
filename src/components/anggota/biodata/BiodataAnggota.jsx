"use client";

import { useMemo } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  formatDate,
  formatPhone,
  getInitials,
  getMembershipStatusLabel,
} from "@/components/anggota/_shared/formatters";
import {
  DisabledAction,
  EmptyState,
  PageError,
  PageHeading,
  PageLoading,
  SectionTitle,
} from "@/components/anggota/_shared/Ui";

export default function BiodataAnggota() {
  const { member, loading: memberLoading, error: memberError } =
    useCurrentMember();
  const { colRef } = useDb();

  const divisions = useCollection(
    () => colRef("Divisi"),
    [],
    { enabled: true }
  );

  const loading = memberLoading || divisions.loading;
  const error = memberError || divisions.error;

  const division = useMemo(
    () =>
      (divisions.data || []).find(
        (item) => item.id === member?.divisionId
      ) || null,
    [divisions.data, member?.divisionId]
  );

  if (loading) {
    return <PageLoading message="Memuat biodata anggota..." />;
  }

  if (error) {
    return <PageError />;
  }

  if (!member) {
    return (
      <PageError
        title="Biodata anggota tidak ditemukan"
        message="Pastikan dokumen Anggota terhubung dengan akun yang sedang login."
      />
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Profil Anggota"
        title="Biodata Anggota"
        description="Informasi pribadi, kontak, dan posisi organisasi yang tersimpan di Firestore."
        action={
          <div className="flex flex-wrap gap-3">
            <DisabledAction icon="arrow_back" variant="outline">
              Kembali
            </DisabledAction>
            <DisabledAction icon="edit">
              Edit Data
            </DisabledAction>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/5" />

        <div className="relative flex flex-col items-center gap-6 md:flex-row">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-3xl font-bold text-primary">
            {getInitials(member.fullName)}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col items-center gap-3 md:flex-row">
              <h1 className="text-2xl font-bold text-text">
                {member.fullName}
              </h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                NIS: {member.nis || "-"}
              </span>
            </div>

            <p className="mt-2 text-base font-semibold text-primary">
              {member.organisationPosition || "Anggota OSIS"}
              {division ? ` (${division.shortName})` : ""}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
              <ProfileChip
                icon="school"
                label={member.className || "-"}
              />
              <ProfileChip
                icon="verified"
                label={getMembershipStatusLabel(
                  member.membershipStatus
                )}
              />
              <ProfileChip
                icon="calendar_month"
                label={`Periode ${member.period || "-"}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <InfoCard
            icon="person"
            title="Informasi Pribadi"
          >
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <InfoItem
                label="Tempat, Tanggal Lahir"
                value={`${member.placeOfBirth || "-"}, ${formatDate(
                  member.dateOfBirth
                )}`}
              />
              <InfoItem
                label="Jenis Kelamin"
                value={
                  member.gender === "male"
                    ? "Laki-laki"
                    : member.gender === "female"
                      ? "Perempuan"
                      : "-"
                }
              />
              <InfoItem
                label="Alamat Lengkap"
                value={member.address || "-"}
                full
              />
              <InfoItem
                label="Agama"
                value={member.religion || "-"}
              />
              <InfoItem
                label="Golongan Darah"
                value={member.bloodType || "-"}
              />
            </div>
          </InfoCard>

          <InfoCard
            icon="mail"
            title="Informasi Kontak"
          >
            <div className="space-y-4">
              <ContactItem
                icon="mail"
                label="Email"
                value={member.email || "-"}
              />
              <ContactItem
                icon="person"
                label="Nomor WhatsApp"
                value={formatPhone(member.whatsapp)}
              />
            </div>
          </InfoCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <InfoCard
            icon="groups"
            title="Informasi Organisasi"
          >
            <div className="space-y-5">
              <InfoItem
                label="Jabatan Utama"
                value={
                  member.organisationPosition ||
                  "Anggota OSIS"
                }
              />
              <InfoItem
                label="Divisi atau Sekbid"
                value={
                  division
                    ? `Sekbid ${division.code}: ${division.name}`
                    : "Belum ditentukan"
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {getMembershipStatusLabel(
                      member.membershipStatus
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Bergabung
                  </p>
                  <p className="mt-2 text-sm font-semibold text-text">
                    {formatDate(member.joinedAt)}
                  </p>
                </div>
              </div>
            </div>
          </InfoCard>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionTitle
              icon="badge"
              title="Pencapaian dan Tugas"
              description="Catatan kontribusi yang tersimpan pada profil."
            />

            <div className="mt-5 space-y-3">
              {member.achievements?.length ? (
                member.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 rounded-xl bg-surface p-4"
                  >
                    <div className="mt-0.5 text-primary">
                      <AppIcon name="verified" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-6 text-text">
                        {achievement.title}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {achievement.year || "-"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="badge"
                  title="Belum ada pencapaian"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileChip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text">
      <span className="text-primary">
        <AppIcon name={icon} size={18} />
      </span>
      {label}
    </span>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <SectionTitle icon={icon} title={title} />
      <div className="mt-6">{children}</div>
    </article>
  );
}

function InfoItem({ label, value, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-text">
        {value}
      </p>
    </div>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <AppIcon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-text">
          {value}
        </p>
      </div>
    </div>
  );
}
