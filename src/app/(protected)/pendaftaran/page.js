"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useDoc } from "@/hooks/useDoc";

const MEMBERSHIP_STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
  ACTIVE: "active",
};

const initialForm = {
  fullName: "",
  nis: "",
  className: "",
  gender: "",
  whatsapp: "",
  address: "",
  divisionInterest: "",
  motivation: "",
  organizationExperience: "",
};

const classOptions = [
  "X MIPA 1",
  "X MIPA 2",
  "X IPS 1",
  "XI MIPA 1",
  "XI IPS 1",
  "XII MIPA 1",
  "XII IPS 1",
];

const divisionOptions = [
  "Sekbid I: Keimanan dan Ketakwaan",
  "Sekbid II: Budi Pekerti Luhur",
  "Sekbid III: Bela Negara",
  "Sekbid IV: Akademik dan IPTEK",
  "Sekbid V: Organisasi dan Kepemimpinan",
  "Sekbid VI: Kreativitas dan Kewirausahaan",
  "Sekbid VII: Kualitas Jasmani dan Kesehatan",
  "Sekbid VIII: Sastra dan Budaya",
  "Sekbid IX: Teknologi Informasi dan Komunikasi",
  "Sekbid X: Komunikasi Bahasa Inggris",
];

export default function PendaftaranPage() {
  const { user, userDoc, accessLoading } = useAuth();
  const { setDoc, serverTimestamp } = useDb();

  const {
    data: member,
    loading: memberLoading,
    error: memberError,
  } = useDoc("Anggota", user?.uid, {
    enabled: Boolean(user?.uid),
  });

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const email = useMemo(
    () => user?.email ?? userDoc?.email ?? "",
    [user?.email, userDoc?.email]
  );

  const membershipStatus =
    member?.membershipStatus ?? MEMBERSHIP_STATUS.NOT_SUBMITTED;

  useEffect(() => {
    setForm({
      fullName: member?.fullName ?? userDoc?.fullName ?? "",
      nis: member?.nis ?? userDoc?.nis ?? "",
      className: member?.className ?? userDoc?.className ?? "",
      gender: member?.gender ?? userDoc?.gender ?? "",
      whatsapp: member?.whatsapp ?? userDoc?.whatsapp ?? "",
      address: member?.address ?? userDoc?.address ?? "",
      divisionInterest: member?.divisionInterest ?? "",
      motivation: member?.motivation ?? "",
      organizationExperience: member?.organizationExperience ?? "",
    });
  }, [member, userDoc]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setActionError("");
  }

  function validateForm() {
    const requiredValues = [
      form.fullName,
      form.nis,
      form.className,
      form.gender,
      form.whatsapp,
      form.address,
      form.divisionInterest,
      form.motivation,
    ];

    if (requiredValues.some((value) => !String(value).trim())) {
      return "Lengkapi seluruh kolom wajib sebelum mengirim pendaftaran.";
    }

    if (form.fullName.trim().length < 3) {
      return "Nama lengkap minimal 3 karakter.";
    }

    if (!/^\d{5,20}$/.test(form.nis.trim())) {
      return "NIS harus berisi 5 sampai 20 digit angka.";
    }

    const normalizedWhatsapp = form.whatsapp.replace(/\D/g, "");

    if (normalizedWhatsapp.length < 9 || normalizedWhatsapp.length > 15) {
      return "Nomor WhatsApp harus berisi 9 sampai 15 digit.";
    }

    if (form.address.trim().length < 10) {
      return "Alamat lengkap minimal 10 karakter.";
    }


    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user?.uid) {
      setActionError("Sesi pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setActionError("");

    try {
      await setDoc(
        "Anggota",
        user.uid,
        {
          uid: user.uid,
          email,
          username: userDoc?.username ?? "",
          fullName: form.fullName.trim(),
          nis: form.nis.trim(),
          className: form.className,
          gender: form.gender,
          whatsapp: form.whatsapp.replace(/\D/g, ""),
          address: form.address.trim(),
          divisionInterest: form.divisionInterest,
          motivation: form.motivation.trim(),
          organizationExperience:
            form.organizationExperience.trim() || null,

          membershipStatus: MEMBERSHIP_STATUS.PENDING_REVIEW,

          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,

          createdAt: member?.createdAt ?? serverTimestamp(),
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("PENDAFTARAN SUBMIT ERROR:", error);
      setActionError(
        "Pendaftaran belum berhasil dikirim. Periksa koneksi lalu coba kembali."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestartRegistration() {
    if (!user?.uid) {
      setActionError("Sesi pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    setRestarting(true);
    setActionError("");

    try {
      await setDoc(
        "Anggota",
        user.uid,
        {
          membershipStatus: MEMBERSHIP_STATUS.NOT_SUBMITTED,
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("RESTART PENDAFTARAN ERROR:", error);
      setActionError(
        "Pendaftaran belum dapat dimulai ulang. Periksa koneksi lalu coba kembali."
      );
    } finally {
      setRestarting(false);
    }
  }

  if (accessLoading || memberLoading) {
    return <PageLoader />;
  }

  if (memberError) {
    return (
      <CenteredStatus
        icon="close"
        title="Data tidak dapat dimuat"
        description="Muat ulang halaman atau periksa koneksi internet."
        tone="error"
      />
    );
  }

  if (membershipStatus === MEMBERSHIP_STATUS.PENDING_REVIEW) {
    return (
      <PendingReviewView
        member={member}
        actionError={actionError}
      />
    );
  }

  if (membershipStatus === MEMBERSHIP_STATUS.REJECTED) {
    return (
      <RejectedView
        reviewNote={member?.reviewNote}
        restarting={restarting}
        actionError={actionError}
        onRestart={handleRestartRegistration}
      />
    );
  }

  if (membershipStatus === MEMBERSHIP_STATUS.ACTIVE) {
    return (
      <CenteredStatus
        icon="verified_user"
        title="Pendaftaran disetujui"
        description="Pembina telah menyetujui pendaftaranmu. Akunmu sudah tercatat sebagai anggota aktif."
        tone="success"
      />
    );
  }

  return (
    <RegistrationForm
      form={form}
      email={email}
      submitting={submitting}
      formError={formError}
      actionError={actionError}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

function RegistrationForm({
  form,
  email,
  submitting,
  formError,
  actionError,
  onChange,
  onSubmit,
}) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <AppIcon name="person_add" size={30} />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Pendaftaran Anggota
          </p>

          <h1 className="mt-2 text-3xl font-bold text-text sm:text-4xl">
            Lengkapi biodata calon anggota
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
            Data akan diperiksa oleh pembina. Role anggota baru diberikan
            setelah pendaftaran disetujui.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-8"
          noValidate
        >
          <FormSection
            icon="person"
            title="Informasi pribadi"
            description="Masukkan identitas sesuai data sekolah."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                id="fullName"
                label="Nama Lengkap"
                value={form.fullName}
                placeholder="Contoh: Muhammad Rizky"
                onChange={onChange}
                disabled={submitting}
                required
              />

              <TextField
                id="nis"
                label="Nomor Induk Siswa"
                value={form.nis}
                placeholder="Masukkan NIS"
                inputMode="numeric"
                onChange={onChange}
                disabled={submitting}
                required
              />

              <SelectField
                id="className"
                label="Kelas"
                value={form.className}
                options={classOptions}
                placeholder="Pilih kelas"
                onChange={onChange}
                disabled={submitting}
                required
              />

              <div>
                <FieldLabel required>Jenis Kelamin</FieldLabel>

                <div className="flex min-h-12 items-center gap-6 rounded-xl border border-border bg-input px-4">
                  <RadioField
                    name="gender"
                    value="laki-laki"
                    label="Laki-laki"
                    checked={form.gender === "laki-laki"}
                    onChange={onChange}
                    disabled={submitting}
                  />

                  <RadioField
                    name="gender"
                    value="perempuan"
                    label="Perempuan"
                    checked={form.gender === "perempuan"}
                    onChange={onChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon="mail"
            title="Informasi kontak"
            description="Gunakan kontak aktif yang dapat dihubungi pembina."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                id="email"
                label="Email Akun"
                type="email"
                value={email}
                disabled
                readOnly
              />

              <TextField
                id="whatsapp"
                label="Nomor WhatsApp"
                type="tel"
                value={form.whatsapp}
                placeholder="Contoh: 081234567890"
                inputMode="tel"
                onChange={onChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="mt-5">
              <TextareaField
                id="address"
                label="Alamat Lengkap"
                value={form.address}
                placeholder="Masukkan alamat tempat tinggal"
                rows={3}
                onChange={onChange}
                disabled={submitting}
                required
              />
            </div>
          </FormSection>

          <FormSection
            icon="receipt"
            title="Informasi organisasi"
            description="Jelaskan minat dan alasan mengikuti organisasi."
          >
            <SelectField
              id="divisionInterest"
              label="Divisi atau Sekbid yang Diminati"
              value={form.divisionInterest}
              options={divisionOptions}
              placeholder="Pilih divisi"
              onChange={onChange}
              disabled={submitting}
              required
            />

            <div className="mt-5">
              <TextareaField
                id="motivation"
                label="Alasan Bergabung"
                value={form.motivation}
                placeholder="Jelaskan motivasi dan kontribusi yang ingin kamu berikan"
                rows={4}
                onChange={onChange}
                disabled={submitting}
                required
                hint="Minimal 30 karakter."
              />
            </div>

            <div className="mt-5">
              <TextareaField
                id="organizationExperience"
                label="Pengalaman Organisasi"
                value={form.organizationExperience}
                placeholder="Ceritakan pengalaman organisasi atau kepanitiaan sebelumnya"
                rows={4}
                onChange={onChange}
                disabled={submitting}
                hint="Opsional. Kosongkan jika belum memiliki pengalaman."
              />
            </div>
          </FormSection>

          {(formError || actionError) && (
            <AlertMessage message={formError || actionError} />
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-text-muted sm:max-w-md">
              Pastikan seluruh data benar. Pembina akan menggunakan informasi
              ini untuk meninjau pendaftaranmu.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon name="arrow_forward" size={20} />
              {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function PendingReviewView({ member, actionError }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <AppIcon name="verified" size={38} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Pendaftaran Terkirim
        </p>

        <h1 className="mt-2 text-3xl font-bold text-text">
          Sedang menunggu review
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-text-muted">
          Data pendaftaranmu sudah diterima dan sedang diperiksa oleh pembina.
          Role anggota akan diberikan setelah pendaftaran disetujui.
        </p>

        <div className="mt-7 rounded-2xl border border-border bg-input p-5 text-left">
          <StatusRow label="Nama" value={member?.fullName || "-"} />
          <StatusRow label="NIS" value={member?.nis || "-"} />
          <StatusRow label="Kelas" value={member?.className || "-"} />
          <StatusRow
            label="Status"
            value="Menunggu pemeriksaan pembina"
            last
          />
        </div>

        <div className="mt-6 rounded-xl bg-primary/5 px-4 py-3 text-sm leading-6 text-text-muted">
          Kamu tidak perlu mengirim formulir lagi. Perubahan status akan tampil
          otomatis ketika pembina selesai melakukan review.
        </div>

        {actionError && (
          <div className="mt-5">
            <AlertMessage message={actionError} />
          </div>
        )}
      </section>
    </main>
  );
}

function RejectedView({
  reviewNote,
  restarting,
  actionError,
  onRestart,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-error-bg text-error-text">
          <AppIcon name="close" size={38} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-error-text">
          Pendaftaran Ditolak
        </p>

        <h1 className="mt-2 text-3xl font-bold text-text">
          Data perlu didaftarkan ulang
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-text-muted">
          Pembina belum dapat menyetujui pendaftaranmu. Baca catatan berikut,
          lalu mulai ulang pendaftaran untuk memperbaiki data.
        </p>

        <div className="mt-7 rounded-2xl bg-error-bg p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-error-text">
            Catatan Pembina
          </p>
          <p className="mt-2 leading-7 text-error-text">
            {reviewNote || "Tidak ada catatan tambahan dari pembina."}
          </p>
        </div>

        {actionError && (
          <div className="mt-5">
            <AlertMessage message={actionError} />
          </div>
        )}

        <button
          type="button"
          onClick={onRestart}
          disabled={restarting}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AppIcon name="edit" size={20} />
          {restarting ? "Memulai Ulang..." : "Daftar Ulang"}
        </button>

        <p className="mt-3 text-xs leading-5 text-text-muted">
          Data lama tetap digunakan sebagai isian awal agar kamu hanya perlu
          memperbaiki bagian yang diperlukan.
        </p>
      </section>
    </main>
  );
}

function PageLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-text-muted shadow-sm">
        Memuat pendaftaran...
      </div>
    </main>
  );
}

function CenteredStatus({
  icon,
  title,
  description,
  tone = "success",
}) {
  const iconClass =
    tone === "error"
      ? "bg-error-bg text-error-text"
      : "bg-primary/10 text-primary";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <AppIcon name={icon} size={32} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-text">{title}</h1>
        <p className="mt-3 leading-7 text-text-muted">{description}</p>
      </section>
    </main>
  );
}

function FormSection({ icon, title, description, children }) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AppIcon name={icon} size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-text">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function FieldLabel({ children, required }) {
  return (
    <span className="mb-2 block text-sm font-medium text-text">
      {children}
      {required && <span className="ml-1 text-error-text">*</span>}
    </span>
  );
}

function TextField({
  id,
  label,
  type = "text",
  value,
  placeholder,
  inputMode,
  onChange,
  disabled,
  readOnly,
  required,
}) {
  return (
    <div>
      <label htmlFor={id}>
        <FieldLabel required={required}>{label}</FieldLabel>
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className="min-h-12 w-full rounded-xl border border-border bg-input px-4 text-text outline-none transition placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  required,
}) {
  return (
    <div>
      <label htmlFor={id}>
        <FieldLabel required={required}>{label}</FieldLabel>
      </label>

      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="min-h-12 w-full rounded-xl border border-border bg-input px-4 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  placeholder,
  rows,
  onChange,
  disabled,
  required,
  hint,
}) {
  return (
    <div>
      <label htmlFor={id}>
        <FieldLabel required={required}>{label}</FieldLabel>
      </label>

      <textarea
        id={id}
        name={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="w-full resize-y rounded-xl border border-border bg-input px-4 py-3 text-text outline-none transition placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function RadioField({
  name,
  value,
  label,
  checked,
  onChange,
  disabled,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
      <input
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}

function StatusRow({ label, value, last = false }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-text">{value}</span>
    </div>
  );
}

function AlertMessage({ message }) {
  return (
    <div
      className="rounded-xl bg-error-bg px-4 py-3 text-sm text-error-text"
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
