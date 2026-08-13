"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { buatIdReferensiPengumuman } from "@/lib/codefication";
import {
  AUDIENS_PENGUMUMAN,
  KOLEKSI_PENGUMUMAN,
  buatPayloadPengumuman,
  getAudienceType,
  getTargetDivisionId,
  labelDivisi,
} from "./konfigurasiPengumuman";

const inputClass =
  "min-h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function initialForm(initialAnnouncement, editor) {
  const initialAudience = initialAnnouncement
    ? getAudienceType(initialAnnouncement)
    : AUDIENS_PENGUMUMAN.SEMUA;

  return {
    title: initialAnnouncement?.title || "",
    content: initialAnnouncement?.content || initialAnnouncement?.summary || "",
    audienceType: initialAudience,
    targetDivisionId:
      getTargetDivisionId(initialAnnouncement) ||
      editor?.fixedInternalDivisionId ||
      "",
    isImportant: Boolean(
      initialAnnouncement?.isPinned || initialAnnouncement?.isImportant
    ),
  };
}

export default function PengumumanFormOverlay({
  editor,
  divisions = [],
  initialAnnouncement = null,
  onClose,
  onSaved,
}) {
  const { addDoc, updateDoc, serverTimestamp } = useDb();

  const [form, setForm] = useState(() =>
    initialForm(initialAnnouncement, editor)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(initialAnnouncement?.id);

  const divisionMap = useMemo(
    () => new Map(divisions.map((item) => [item.id, item])),
    [divisions]
  );

  const targetDivision = form.targetDivisionId
    ? divisionMap.get(form.targetDivisionId) || null
    : null;

  const canTargetAnyDivision = editor?.canTargetAnyDivision !== false;

  const update = (field) => (event) => {
    const value =
      event?.target?.type === "checkbox"
        ? event.target.checked
        : event?.target?.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
  };

  const changeAudience = (audienceType) => {
    setForm((current) => ({
      ...current,
      audienceType,
      targetDivisionId:
        audienceType === AUDIENS_PENGUMUMAN.INTERNAL
          ? current.targetDivisionId || editor?.fixedInternalDivisionId || ""
          : "",
    }));
    setError("");
  };

  const validate = () => {
    if (!editor?.name) return "Identitas pembuat pengumuman belum tersedia.";
    if (form.title.trim().length < 5) return "Judul minimal 5 karakter.";
    if (form.content.trim().length < 10) return "Isi pengumuman minimal 10 karakter.";

    if (
      form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL &&
      !form.targetDivisionId
    ) {
      return "Pilih Sekbid tujuan untuk pengumuman internal.";
    }

    if (
      editor?.fixedInternalDivisionId &&
      form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL &&
      form.targetDivisionId !== editor.fixedInternalDivisionId
    ) {
      return "Ketua Sekbid hanya dapat membuat pengumuman internal untuk Sekbidnya sendiri.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const waktu = serverTimestamp();
      const idReferensi =
        initialAnnouncement?.idReferensi ||
        (await buatIdReferensiPengumuman());

      const payload = buatPayloadPengumuman({
        idReferensi,
        title: form.title,
        content: form.content,
        audienceType: form.audienceType,
        targetDivisionId:
          form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL
            ? form.targetDivisionId
            : null,
        targetDivisionName:
          form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL
            ? labelDivisi(targetDivision)
            : null,
        isImportant: form.isImportant,
        author: editor,
        waktu,
      });

      if (editing) {
        // Saat edit, identitas pembuat pertama tetap dipertahankan agar histori
        // pengumuman tidak berubah hanya karena diedit oleh Pembina.
        await updateDoc(KOLEKSI_PENGUMUMAN, initialAnnouncement.id, {
          ...payload,
          authorId: initialAnnouncement.authorId ?? payload.authorId,
          authorUserId:
            initialAnnouncement.authorUserId ?? payload.authorUserId,
          authorType: initialAnnouncement.authorType ?? payload.authorType,
          authorName: initialAnnouncement.authorName ?? payload.authorName,
          authorPosition:
            initialAnnouncement.authorPosition ?? payload.authorPosition,
          authorDivisionId:
            initialAnnouncement.authorDivisionId ?? payload.authorDivisionId,
          authorDivisionName:
            initialAnnouncement.authorDivisionName ?? payload.authorDivisionName,
          publishedAt: initialAnnouncement.publishedAt || waktu,
        });

        onSaved?.({
          id: initialAnnouncement.id,
          ...initialAnnouncement,
          ...payload,
        });
      } else {
        const created = await addDoc(KOLEKSI_PENGUMUMAN, {
          ...payload,
          dibuatPada: waktu,
          createdAt: waktu,
        });

        onSaved?.({
          id: created.id,
          ...payload,
        });
      }

      onClose?.();
    } catch (saveError) {
      console.error("SIMPAN PENGUMUMAN ERROR:", saveError);
      setError(
        saveError?.message ||
          "Pengumuman belum berhasil disimpan. Periksa koneksi dan izin Firestore."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose?.();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[94dvh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl"
      >
        <header className="relative border-b border-border bg-gradient-to-br from-primary/12 via-card to-card px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <AppIcon name="campaign" size={14} />
                Pusat Informasi
              </span>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
                {editing ? "Edit Pengumuman" : "Buat Pengumuman"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                Tentukan isi, sasaran pembaca, dan tandai sebagai penting bila
                informasi perlu lebih menonjol.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card/80 text-text-muted transition hover:bg-surface hover:text-text disabled:opacity-50"
              aria-label="Tutup form pengumuman"
            >
              <AppIcon name="close" size={21} />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(94dvh-190px)] overflow-y-auto px-5 py-6 sm:px-7">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="space-y-5">
              <FormField label="Judul Pengumuman" required>
                <input
                  type="text"
                  value={form.title}
                  onChange={update("title")}
                  placeholder="Contoh: Persiapan Rapat Evaluasi Bulanan"
                  maxLength={120}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Isi Pengumuman" required>
                <textarea
                  value={form.content}
                  onChange={update("content")}
                  placeholder="Tuliskan informasi yang ingin disampaikan kepada anggota..."
                  rows={9}
                  maxLength={3000}
                  className={`${inputClass} resize-y py-3 leading-6`}
                />
                <p className="mt-2 text-right text-[11px] font-medium text-text-muted">
                  {form.content.length}/3000
                </p>
              </FormField>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Sasaran Pengumuman
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <AudienceButton
                    active={form.audienceType === AUDIENS_PENGUMUMAN.SEMUA}
                    icon="campaign"
                    label="Semua"
                    onClick={() => changeAudience(AUDIENS_PENGUMUMAN.SEMUA)}
                  />
                  <AudienceButton
                    active={form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL}
                    icon="groups"
                    label="Internal"
                    onClick={() => changeAudience(AUDIENS_PENGUMUMAN.INTERNAL)}
                  />
                </div>

                {form.audienceType === AUDIENS_PENGUMUMAN.INTERNAL && (
                  <div className="mt-4">
                    <label className="text-xs font-bold text-text">
                      Sekbid Tujuan
                    </label>

                    {canTargetAnyDivision ? (
                      <select
                        value={form.targetDivisionId}
                        onChange={update("targetDivisionId")}
                        className={`${inputClass} mt-2`}
                      >
                        <option value="">Pilih Sekbid</option>
                        {divisions.map((division) => (
                          <option key={division.id} value={division.id}>
                            {labelDivisi(division)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm font-bold text-blue-800">
                          {labelDivisi(targetDivision) || editor?.divisionName}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          Sebagai Ketua Sekbid, pengumuman internal diarahkan ke
                          Sekbid Anda.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={update("isImportant")}
                  className="mt-1 h-4 w-4 rounded border-amber-300 accent-amber-600"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <AppIcon name="notifications" size={18} />
                    Tandai Penting
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-amber-800">
                    Pengumuman penting ditampilkan lebih menonjol dan diprioritaskan
                    pada daftar anggota.
                  </span>
                </span>
              </label>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Diterbitkan Sebagai
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <AppIcon name="person" size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text">
                      {editor?.name || "Pengurus OSIS"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {editor?.position || "Pengurus OSIS"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-error-bg px-4 py-3 text-sm font-semibold text-error-text">
              {error}
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-xl border border-border bg-card px-5 text-sm font-bold text-text transition hover:bg-surface disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name="send" size={18} />
            {saving
              ? "Menerbitkan..."
              : editing
                ? "Simpan Perubahan"
                : "Terbitkan Pengumuman"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function AudienceButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-primary"
      }`}
    >
      <AppIcon name={icon} size={20} />
      {label}
    </button>
  );
}
