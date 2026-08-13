"use client";

import AppIcon from "@/components/global/AppIcon";
import {
  formatTanggalPengumuman,
  getAudienceType,
  isPengumumanPenting,
  labelAudiensPengumuman,
} from "./konfigurasiPengumuman";

export default function PengumumanDetailOverlay({
  announcement,
  divisionMap,
  onClose,
}) {
  if (!announcement) return null;

  const important = isPengumumanPenting(announcement);
  const isInternal = getAudienceType(announcement) === "internal";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className="max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <header className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/12 via-card to-card px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    isInternal
                      ? "bg-blue-50 text-blue-700"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <AppIcon name={isInternal ? "groups" : "campaign"} size={14} />
                  {labelAudiensPengumuman(announcement, divisionMap)}
                </span>

                {important && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    <AppIcon name="notifications" size={14} />
                    Penting
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-bold leading-8 tracking-tight text-text sm:text-2xl">
                {announcement.title || "Pengumuman"}
              </h2>

              <p className="mt-2 text-xs font-semibold text-text-muted">
                {announcement.idReferensi ? `${announcement.idReferensi} · ` : ""}
                {formatTanggalPengumuman(announcement.publishedAt, {
                  withTime: true,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail pengumuman"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card/80 text-text-muted transition hover:bg-surface hover:text-text"
            >
              <AppIcon name="close" size={21} />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(92dvh-190px)] overflow-y-auto px-5 py-6 sm:px-7">
          <article className="whitespace-pre-line text-sm leading-7 text-text sm:text-[15px]">
            {announcement.content ||
              announcement.summary ||
              "Tidak ada isi pengumuman."}
          </article>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Diterbitkan Oleh
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {(announcement.authorName || "P").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">
                    {announcement.authorName || "Pengurus OSIS"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {announcement.authorPosition || "Pengurus OSIS"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Sasaran Informasi
              </p>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <AppIcon name={isInternal ? "groups" : "campaign"} size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text">
                    {labelAudiensPengumuman(announcement, divisionMap)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    {isInternal
                      ? "Pengumuman ini ditujukan untuk internal Sekbid yang dipilih."
                      : "Pengumuman ini dapat dibaca seluruh anggota OSIS."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
