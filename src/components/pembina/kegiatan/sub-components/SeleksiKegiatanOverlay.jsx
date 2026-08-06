"use client";

import { useCallback, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";

const CATEGORY_OPTIONS = [
  {
    value: "work_program",
    label: "Program Kerja",
    description: "Kegiatan utama yang dapat dihubungkan dengan proposal.",
    icon: "campaign",
  },
  {
    value: "meeting",
    label: "Meeting",
    description: "Agenda rapat, koordinasi, atau pertemuan organisasi.",
    icon: "groups",
  },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  location: "",
  divisionId: "",
  organiserMemberId: "",
  participantCapacity: "",
  proposalId: "",
};

export function useSeleksiKegiatanOverlay({
  proposals = [],
  divisions = [],
  members = [],
  onCreated,
} = {}) {
  const { openOverlay, closeOverlay } = useOverlay();

  const openSeleksiKegiatan = useCallback(() => {
    openOverlay({
      closeOnBackdrop: true,
      content: (
        <SeleksiKegiatanModal
          proposals={proposals}
          divisions={divisions}
          members={members}
          onCreated={(selectedType) => {
            onCreated?.(selectedType);
            closeOverlay();
          }}
          onClose={() => closeOverlay()}
        />
      ),
    });
  }, [
    openOverlay,
    closeOverlay,
    proposals,
    divisions,
    members,
    onCreated,
  ]);

  return { openSeleksiKegiatan };
}

export default function SeleksiKegiatanModal({
  proposals = [],
  divisions = [],
  members = [],
  onCreated,
  onClose,
}) {
  const { addDoc, serverTimestamp } = useDb();

  const [step, setStep] = useState("select");
  const [activityType, setActivityType] = useState("work_program");
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const proposalOptions = useMemo(
    () =>
      [...proposals].sort((a, b) =>
        String(a?.title || a?.activity?.title || "").localeCompare(
          String(b?.title || b?.activity?.title || ""),
          "id"
        )
      ),
    [proposals]
  );

  const officialMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        String(a?.fullName || "").localeCompare(
          String(b?.fullName || ""),
          "id"
        )
      ),
    [members]
  );

  const chooseCategory = (value) => {
    setActivityType(value);
    setForm((current) => ({
      ...current,
      proposalId: value === "work_program" ? current.proposalId : "",
    }));
    setError("");
    setStep("form");
  };

  const changeType = (value) => {
    setActivityType(value);
    setForm((current) => ({
      ...current,
      proposalId: value === "work_program" ? current.proposalId : "",
    }));
    setError("");
  };

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const location = form.location.trim();

    if (!title || !form.startAt || !location) {
      setError("Nama kegiatan, waktu mulai, dan lokasi wajib diisi.");
      return;
    }

    if (
      form.endAt &&
      new Date(form.endAt).getTime() < new Date(form.startAt).getTime()
    ) {
      setError("Waktu selesai tidak boleh lebih awal dari waktu mulai.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addDoc("Kegiatan", {
        title,
        description: form.description.trim(),
        activityType,
        startAt: new Date(form.startAt),
        endAt: form.endAt ? new Date(form.endAt) : null,
        location,
        divisionId: form.divisionId || null,
        organiserMemberId: form.organiserMemberId || null,
        participantCount: 0,
        participantCapacity: form.participantCapacity
          ? Number(form.participantCapacity)
          : null,
        proposalId:
          activityType === "work_program"
            ? form.proposalId || null
            : null,
        status: "draft",
        reportStatus:
          activityType === "work_program"
            ? "not_started"
            : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onCreated?.(activityType);
    } catch (submitError) {
      console.error("CREATE ACTIVITY ERROR:", submitError);
      setError(
        submitError?.message ||
          "Kegiatan belum berhasil disimpan. Coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-[max-width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        step === "select" ? "max-w-xl" : "max-w-4xl"
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border bg-card/95 px-5 py-5 backdrop-blur sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Tambah Kegiatan
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl">
            {step === "select"
              ? "Pilih Kategori Kegiatan"
              : activityType === "work_program"
                ? "Tambah Program Kerja"
                : "Tambah Meeting"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            {step === "select"
              ? "Tentukan jenis kegiatan yang ingin dibuat."
              : "Lengkapi informasi kegiatan. Data akan disimpan sebagai draf."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form kegiatan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input text-text-muted transition duration-300 hover:rotate-90 hover:bg-error-bg hover:text-error-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AppIcon name="close" size={21} />
        </button>
      </header>

      <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto">
        {step === "select" ? (
          <div className="kegiatan-stage grid grid-cols-2 gap-4 p-5 sm:gap-5 sm:p-6">
            {CATEGORY_OPTIONS.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseCategory(option.value)}
                className="group flex min-h-48 flex-col items-center justify-center rounded-3xl border border-border bg-surface px-4 py-6 text-center shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary group-hover:text-white">
                  <AppIcon name={option.icon} size={31} />
                </span>

                <span className="mt-4 text-base font-bold text-text">
                  {option.label}
                </span>

                <span className="mt-2 max-w-44 text-xs leading-5 text-text-muted">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={submitForm}
            className="kegiatan-stage p-5 sm:p-6"
          >
            <div className="mb-6">
              <div className="inline-flex w-full rounded-2xl bg-input p-1 sm:w-auto">
                <TypeTab
                  active={activityType === "work_program"}
                  icon="campaign"
                  label="Program Kerja"
                  onClick={() => changeType("work_program")}
                />
                <TypeTab
                  active={activityType === "meeting"}
                  icon="groups"
                  label="Meeting"
                  onClick={() => changeType("meeting")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                className="sm:col-span-2"
                label="Nama kegiatan"
                required
              >
                <input
                  type="text"
                  value={form.title}
                  onChange={updateField("title")}
                  placeholder={
                    activityType === "work_program"
                      ? "Contoh: Class Meeting 2026"
                      : "Contoh: Meeting Persiapan Class Meeting"
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField
                className="sm:col-span-2"
                label="Deskripsi"
              >
                <textarea
                  value={form.description}
                  onChange={updateField("description")}
                  placeholder="Tuliskan tujuan atau gambaran singkat kegiatan"
                  rows={4}
                  className={`${inputClass} resize-y py-3`}
                />
              </FormField>

              <FormField label="Waktu mulai" required>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={updateField("startAt")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Waktu selesai">
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={updateField("endAt")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Lokasi" required>
                <input
                  type="text"
                  value={form.location}
                  onChange={updateField("location")}
                  placeholder="Ruang OSIS atau Aula Sekolah"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Kapasitas peserta">
                <input
                  type="number"
                  min="0"
                  value={form.participantCapacity}
                  onChange={updateField("participantCapacity")}
                  placeholder="Contoh: 100"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Divisi / Sekbid">
                <select
                  value={form.divisionId}
                  onChange={updateField("divisionId")}
                  className={inputClass}
                >
                  <option value="">Pengurus Inti / belum ditentukan</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.code
                        ? `Sekbid ${division.code} - `
                        : ""}
                      {division.shortName || division.name || "Tanpa nama"}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Penanggung jawab">
                <select
                  value={form.organiserMemberId}
                  onChange={updateField("organiserMemberId")}
                  className={inputClass}
                >
                  <option value="">Belum ditentukan</option>
                  {officialMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName || "Anggota tanpa nama"}
                      {member.organisationPosition
                        ? ` — ${member.organisationPosition}`
                        : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div
              className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activityType === "work_program"
                  ? "mt-6 grid-rows-[1fr] opacity-100"
                  : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
              aria-hidden={activityType !== "work_program"}
            >
              <div className="overflow-hidden">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <AppIcon name="receipt" size={20} />
                    </span>
                    <div>
                      <h3 className="font-bold text-text">
                        Proposal Terkait
                      </h3>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Pilih proposal untuk Program Kerja ini.
                      </p>
                    </div>
                  </div>

                  <select
                    value={form.proposalId}
                    onChange={updateField("proposalId")}
                    tabIndex={activityType === "work_program" ? 0 : -1}
                    className={inputClass}
                  >
                    <option value="">Belum memilih proposal</option>
                    {proposalOptions.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.activity?.title ||
                          proposal.title ||
                          proposal.fileName ||
                          "Proposal tanpa judul"}
                        {proposal.status
                          ? ` — ${proposal.status}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {!proposalOptions.length && (
                    <p className="mt-3 text-xs leading-5 text-text-muted">
                      Belum ada proposal yang dapat dipilih.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-error-text/20 bg-error-bg px-4 py-3 text-sm text-error-text"
              >
                {error}
              </div>
            )}

            <footer className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setError("");
                }}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-text-muted transition duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppIcon name="arrow_back" size={18} />
                Pilih ulang kategori
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <AppIcon name="check" size={18} />
                {saving ? "Menyimpan..." : "Simpan sebagai Draf"}
              </button>
            </footer>
          </form>
        )}
      </div>

      <style jsx>{`
        .kegiatan-stage {
          animation: kegiatanStageIn 420ms
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes kegiatanStageIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kegiatan-stage {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-text outline-none transition duration-300 placeholder:text-text-muted/70 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10";

function TypeTab({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-300 sm:flex-none ${
        active
          ? "bg-card text-primary shadow-sm"
          : "text-text-muted hover:text-text"
      }`}
    >
      <AppIcon name={icon} size={18} />
      {label}
    </button>
  );
}

function FormField({ label, required = false, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-text">
        {label}
        {required && <span className="ml-1 text-error-text">*</span>}
      </span>
      {children}
    </label>
  );
}