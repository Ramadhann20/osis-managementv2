"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import {
  isBadanPengurusHarian,
} from "@/components/anggota/_shared/AksesOrganisasi";
import PengumumanFormOverlay from "@/components/pengumuman/PengumumanFormOverlay";
import PengumumanDetailOverlay from "@/components/pengumuman/PengumumanDetailOverlay";
import {
  FILTER_PENGUMUMAN,
  KOLEKSI_PENGUMUMAN,
  OPSI_FILTER_PENGUMUMAN,
  cocokFilterPengumuman,
  cocokPencarianPengumuman,
  formatTanggalPengumuman,
  getAudienceType,
  getTargetDivisionId,
  isPengumumanPenting,
  labelAudiensPengumuman,
  labelDivisi,
  normalisasi,
  rowsOf,
  sortPengumuman,
} from "@/components/pengumuman/konfigurasiPengumuman";

function isKetuaSekbid(member, division) {
  if (!member || !division || isBadanPengurusHarian(division)) return false;

  const jabatan = normalisasi(
    member?.jabatanOrganisasi || member?.organisationPosition || member?.jabatan
  );

  return jabatan === "ketua" || jabatan.startsWith("ketua sekbid");
}

export default function PengumumanAnggota() {
  const {
    member,
    loading: memberLoading,
    error: memberError,
  } = useCurrentMember();
  const { colRef } = useDb();

  const announcements = useCollection(() => colRef(KOLEKSI_PENGUMUMAN), [], {
    enabled: true,
  });
  const divisions = useCollection(() => colRef("Divisi"), [], { enabled: true });

  const [filter, setFilter] = useState(FILTER_PENGUMUMAN.SEMUA);
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailAnnouncement, setDetailAnnouncement] = useState(null);

  const divisionRows = rowsOf(divisions);
  const divisionMap = useMemo(
    () => new Map(divisionRows.map((item) => [item.id, item])),
    [divisionRows]
  );

  const currentDivision = member?.idDivisi
    ? divisionMap.get(member.idDivisi) || null
    : null;

  const memberIsBph = Boolean(currentDivision && isBadanPengurusHarian(currentDivision));
  const memberIsKetuaSekbid = isKetuaSekbid(member, currentDivision);
  const canCreateAnnouncement = Boolean(memberIsBph || memberIsKetuaSekbid);

  const targetableDivisions = useMemo(
    () =>
      divisionRows
        .filter((division) => !isBadanPengurusHarian(division))
        .sort((a, b) => labelDivisi(a).localeCompare(labelDivisi(b), "id")),
    [divisionRows]
  );

  const editor = useMemo(() => {
    if (!canCreateAnnouncement || !member) return null;

    return {
      type: "anggota",
      id: member.id,
      userId: member.idPengguna || member.userId || null,
      name: member.namaLengkap || member.fullName || member.nama || "Pengurus OSIS",
      position: member.jabatanOrganisasi || member.jabatan || "Pengurus OSIS",
      divisionId: member.idDivisi || null,
      divisionName: labelDivisi(currentDivision),

      // BPH dapat memilih Sekbid mana pun. Ketua Sekbid hanya dapat membuat
      // pengumuman internal untuk Sekbidnya sendiri.
      canTargetAnyDivision: memberIsBph,
      fixedInternalDivisionId: memberIsKetuaSekbid ? member.idDivisi : null,
    };
  }, [
    canCreateAnnouncement,
    member,
    currentDivision,
    memberIsBph,
    memberIsKetuaSekbid,
  ]);

  const data = useMemo(() => {
    const visible = sortPengumuman(
      rowsOf(announcements).filter((announcement) => {
        if (announcement.isPublished === false) return false;

        if (
          Array.isArray(announcement.audienceRoles) &&
          !announcement.audienceRoles.includes("anggota")
        ) {
          return false;
        }

        const audienceType = getAudienceType(announcement);
        if (audienceType !== "internal") return true;

        // BPH merupakan pengurus inti, sehingga tetap dapat memantau seluruh
        // pengumuman internal dari akun anggota.
        if (memberIsBph) return true;

        const targetDivisionId = getTargetDivisionId(announcement);
        return Boolean(
          targetDivisionId &&
            member?.idDivisi &&
            targetDivisionId === member.idDivisi
        );
      })
    );

    const filtered = visible.filter(
      (announcement) =>
        cocokFilterPengumuman(announcement, filter) &&
        cocokPencarianPengumuman(announcement, search)
    );

    return {
      all: visible,
      filtered,
      important: visible.filter(isPengumumanPenting),
      internal: visible.filter((item) => getAudienceType(item) === "internal"),
    };
  }, [announcements, member?.idDivisi, memberIsBph, filter, search]);

  const loading = memberLoading || announcements.loading || divisions.loading;
  const error = memberError || announcements.error || divisions.error;

  if (loading) {
    return <MemberState icon="campaign" title="Memuat pengumuman..." />;
  }

  if (error) {
    return (
      <MemberState
        icon="error_outline"
        title="Pengumuman belum dapat dimuat"
        description={error?.message || "Terjadi kesalahan saat membaca data."}
      />
    );
  }

  if (!member) {
    return (
      <MemberState
        icon="person_off"
        title="Data anggota tidak ditemukan"
        description="Pastikan akun login terhubung dengan dokumen Anggota."
      />
    );
  }

  const featured = data.important[0] || data.filtered[0] || null;
  const feedRows = data.filtered.filter((item) => item.id !== featured?.id);

  return (
    <div className="space-y-7">
      {/* Hero dibuat editorial agar halaman pengumuman terasa berbeda dari
          halaman manajemen lain, tetapi seluruh warna tetap memakai token tema. */}
      <section className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative grid grid-cols-1 gap-7 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              <AppIcon name="campaign" size={15} />
              Pusat Informasi OSIS
            </span>

            <h1 className="mt-5 max-w-2xl text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Informasi organisasi yang relevan untuk peran dan Sekbid Anda.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted">
              Pengumuman umum dapat dibaca seluruh anggota. Pengumuman internal
              hanya muncul untuk Sekbid yang dituju, sementara informasi penting
              ditampilkan lebih menonjol.
            </p>

            {canCreateAnnouncement && (
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
              >
                <AppIcon name="add" size={19} />
                Buat Pengumuman
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <HeroMetric label="Terlihat" value={data.all.length} icon="campaign" />
            <HeroMetric
              label="Penting"
              value={data.important.length}
              icon="notifications"
              accent="amber"
            />
            <div className="col-span-2 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Akses Anda
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <AppIcon name={memberIsBph ? "verified_user" : "groups"} size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">
                    {member.jabatanOrganisasi || "Anggota"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {labelDivisi(currentDivision)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[24px] border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex flex-wrap gap-2">
          {OPSI_FILTER_PENGUMUMAN.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                filter === value
                  ? "bg-primary text-white"
                  : "bg-surface text-text-muted hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <AppIcon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pengumuman atau penulis"
            className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </section>

      {featured && (
        <MemberFeaturedCard
          announcement={featured}
          divisionMap={divisionMap}
          onOpen={() => setDetailAnnouncement(featured)}
        />
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Feed Informasi
            </p>
            <h2 className="mt-1 text-xl font-bold text-text">Pengumuman Terbaru</h2>
          </div>
          <p className="text-xs font-semibold text-text-muted">
            {data.filtered.length} pengumuman
          </p>
        </div>

        {feedRows.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {feedRows.map((announcement, index) => (
              <MemberAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                divisionMap={divisionMap}
                index={index}
                onOpen={() => setDetailAnnouncement(announcement)}
              />
            ))}
          </div>
        ) : !featured ? (
          <MemberState
            icon="campaign"
            title="Pengumuman tidak ditemukan"
            description="Coba ubah kategori atau kata pencarian."
            compact
          />
        ) : null}
      </section>

      {composerOpen && editor && (
        <PengumumanFormOverlay
          editor={editor}
          divisions={
            memberIsBph
              ? targetableDivisions
              : currentDivision
                ? [currentDivision]
                : []
          }
          onClose={() => setComposerOpen(false)}
        />
      )}

      {detailAnnouncement && (
        <PengumumanDetailOverlay
          announcement={detailAnnouncement}
          divisionMap={divisionMap}
          onClose={() => setDetailAnnouncement(null)}
        />
      )}
    </div>
  );
}

function MemberFeaturedCard({ announcement, divisionMap, onOpen }) {
  const important = isPengumumanPenting(announcement);
  const internal = getAudienceType(announcement) === "internal";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative w-full overflow-hidden rounded-[28px] border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7 ${
        important
          ? "border-amber-200 bg-gradient-to-br from-amber-50 via-card to-card"
          : "border-border bg-card"
      }`}
    >
      <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {important && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                <AppIcon name="notifications" size={14} />
                Penting
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                internal
                  ? "bg-blue-50 text-blue-700"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {labelAudiensPengumuman(announcement, divisionMap)}
            </span>
          </div>

          <h2 className="mt-5 max-w-3xl text-xl font-bold leading-8 text-text sm:text-2xl">
            {announcement.title}
          </h2>
          <p className="mt-3 max-w-3xl line-clamp-3 text-sm leading-7 text-text-muted">
            {announcement.content || announcement.summary}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Dari
          </p>
          <p className="mt-2 text-sm font-bold text-text">
            {announcement.authorName || "Pengurus OSIS"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {announcement.authorPosition || "Pengurus OSIS"}
          </p>
          <p className="mt-4 text-[11px] font-semibold text-text-muted">
            {formatTanggalPengumuman(announcement.publishedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function MemberAnnouncementCard({ announcement, divisionMap, index, onOpen }) {
  const important = isPengumumanPenting(announcement);
  const internal = getAudienceType(announcement) === "internal";
  const offset = index % 3 === 1 ? "xl:translate-y-3" : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-72 w-full flex-col rounded-[24px] border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6 ${offset}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
            internal
              ? "bg-blue-50 text-blue-700"
              : "bg-primary/10 text-primary"
          }`}
        >
          <AppIcon name={internal ? "groups" : "campaign"} size={14} />
          {labelAudiensPengumuman(announcement, divisionMap)}
        </span>

        {important && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <AppIcon name="notifications" size={17} />
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold leading-7 text-text">
        {announcement.title}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-muted">
        {announcement.content || announcement.summary || "Tidak ada isi pengumuman."}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-text">
            {announcement.authorName || "Pengurus OSIS"}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {formatTanggalPengumuman(announcement.publishedAt)}
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted transition group-hover:text-primary">
          <AppIcon name="chevron_right" size={18} />
        </span>
      </div>
    </button>
  );
}

function HeroMetric({ label, value, icon, accent = "primary" }) {
  const style =
    accent === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${style}`}>
        <AppIcon name={icon} size={18} />
      </span>
      <p className="mt-4 text-2xl font-bold text-text">{value}</p>
      <p className="mt-1 text-xs font-semibold text-text-muted">{label}</p>
    </div>
  );
}

function MemberState({ icon, title, description, compact = false }) {
  return (
    <div
      className={`rounded-[24px] border border-dashed border-border bg-card text-center ${
        compact ? "p-8" : "p-12"
      }`}
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <AppIcon name={icon} size={24} />
      </span>
      <h2 className="mt-4 font-bold text-text">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
