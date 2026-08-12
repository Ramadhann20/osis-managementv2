"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import {
  isAnggotaAktif,
  isBadanPengurusHarian,
} from "@/components/anggota/_shared/AksesOrganisasi";

function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function normalisasi(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function labelDivisi(divisi) {
  return (
    divisi?.namaSingkat ||
    divisi?.nama ||
    divisi?.shortName ||
    divisi?.name ||
    "Tanpa divisi"
  );
}

function normalisasiAnggota(item) {
  return {
    ...item,
    namaLengkap: item?.namaLengkap || item?.fullName || item?.nama || "Anggota",
    nis: item?.nis || null,
    idDivisi: item?.idDivisi || item?.divisionId || null,
    idPeriode: item?.idPeriode || item?.periodId || null,
    jabatanOrganisasi:
      item?.jabatanOrganisasi ||
      item?.organisationPosition ||
      item?.jabatan ||
      "Anggota",
    statusKeanggotaan:
      item?.statusKeanggotaan || item?.membershipStatus || null,
  };
}

function sortByName(rows) {
  return [...rows].sort((a, b) =>
    String(a?.namaLengkap || "").localeCompare(String(b?.namaLengkap || ""), "id")
  );
}

function enrichMember(member, divisionMap) {
  const normalized = normalisasiAnggota(member);
  const divisiData = normalized.idDivisi
    ? divisionMap.get(normalized.idDivisi) || null
    : null;

  return {
    ...normalized,
    divisiData,
    labelDivisi: labelDivisi(divisiData),
  };
}

export default function PilihPesertaKegiatanOverlay({
  mode = "kelompok",
  member,
  divisi,
  existingParticipantIds = [],
  onApplyGroup,
  onAddMembers,
  onClose,
}) {
  const { colRef } = useDb();
  const [search, setSearch] = useState("");
  const [manualSelection, setManualSelection] = useState(() => new Set());

  const members = useCollection(() => colRef("Anggota"), [], { enabled: true });
  const divisions = useCollection(() => colRef("Divisi"), [], { enabled: true });

  const loading = members.loading || divisions.loading;
  const error = members.error || divisions.error;

  const data = useMemo(() => {
    const divisionRows = rowsOf(divisions);
    const divisionMap = new Map(divisionRows.map((item) => [item.id, item]));

    const activeMembers = sortByName(
      rowsOf(members)
        .map(normalisasiAnggota)
        .filter(isAnggotaAktif)
        .map((item) => enrichMember(item, divisionMap))
    );

    const bphMembers = activeMembers.filter((item) =>
      isBadanPengurusHarian(item.divisiData)
    );

    const ketuaSekbid = activeMembers.filter((item) => {
      if (isBadanPengurusHarian(item.divisiData)) return false;

      const jabatan = normalisasi(item.jabatanOrganisasi);
      return jabatan === "ketua" || jabatan.startsWith("ketua sekbid");
    });

    const idDivisiPengaju = member?.idDivisi || member?.divisionId || null;

    const sekbidSaya = activeMembers.filter(
      (item) => idDivisiPengaju && item.idDivisi === idDivisiPengaju
    );

    const preset = [
      {
        key: "badan_pengurus_harian",
        label: "Badan Pengurus Harian",
        description: "Seluruh anggota aktif Badan Pengurus Harian.",
        icon: "account_balance",
        members: bphMembers,
      },
      {
        key: "sekbid_saya",
        label: `Sekbid Penyelenggara · ${labelDivisi(divisi)}`,
        description: "Seluruh anggota aktif pada divisi atau sekbid penyelenggara.",
        icon: "groups",
        members: sekbidSaya,
      },
      {
        key: "ketua_seluruh_sekbid",
        label: "Ketua Seluruh Sekbid",
        description: "Semua ketua sekbid aktif, tidak termasuk anggota BPH.",
        icon: "workspace_premium",
        members: ketuaSekbid,
      },
      {
        key: "bph_dan_ketua_sekbid",
        label: "BPH + Ketua Seluruh Sekbid",
        description: "Badan Pengurus Harian beserta seluruh ketua sekbid aktif.",
        icon: "hub",
        members: sortByName(
          Array.from(
            new Map([...bphMembers, ...ketuaSekbid].map((item) => [item.id, item])).values()
          )
        ),
      },
      {
        key: "seluruh_anggota_osis",
        label: "Seluruh Anggota OSIS",
        description: "Seluruh anggota OSIS aktif pada periode kepengurusan yang sama.",
        icon: "diversity_3",
        members: activeMembers,
      },
    ];

    const divisionGroups = divisionRows
      .map((division) => ({
        division,
        members: activeMembers.filter((item) => item.idDivisi === division.id),
      }))
      .filter((item) => item.members.length > 0)
      .sort((a, b) => labelDivisi(a.division).localeCompare(labelDivisi(b.division), "id"));

    return {
      activeMembers,
      preset,
      divisionGroups,
    };
  }, [
    divisions,
    members,
    member?.idDivisi,
    member?.divisionId,
    divisi,
  ]);

  const existingIdSet = useMemo(
    () => new Set(existingParticipantIds.filter(Boolean)),
    [existingParticipantIds]
  );

  const manualRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.activeMembers.filter((item) => {
      if (existingIdSet.has(item.id)) return false;

      if (!keyword) return true;

      return (
        String(item.namaLengkap || "").toLowerCase().includes(keyword) ||
        String(item.nis || "").toLowerCase().includes(keyword) ||
        String(item.jabatanOrganisasi || "").toLowerCase().includes(keyword) ||
        String(item.labelDivisi || "").toLowerCase().includes(keyword)
      );
    });
  }, [data.activeMembers, existingIdSet, search]);

  const toggleManual = (id) => {
    setManualSelection((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddManual = () => {
    const selected = data.activeMembers.filter((item) => manualSelection.has(item.id));
    if (!selected.length) return;
    onAddMembers?.(selected);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-5">
      <style jsx global>{`
        @keyframes pesertaKegiatanBackdropMasuk {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pesertaKegiatanPanelMasuk {
          from { opacity: 0; transform: translateY(18px) scale(0.975); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <button
        type="button"
        aria-label="Tutup pemilihan peserta"
        onClick={onClose}
        style={{ animation: "pesertaKegiatanBackdropMasuk 160ms ease-out both" }}
        className="absolute inset-0 bg-on-surface/55 backdrop-blur-sm"
      />

      <section
        style={{
          animation: "pesertaKegiatanPanelMasuk 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-card p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {mode === "manual" ? "Tambah Peserta" : "Pemilihan Peserta"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-text">
              {mode === "manual" ? "Cari Anggota" : "Pilih Kelompok Peserta"}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
              {mode === "manual"
                ? "Cari anggota aktif lalu tambahkan beberapa orang ke daftar peserta kegiatan."
                : "Pilih kelompok peserta atau satu divisi. Daftar anggota akan dimuat ke formulir utama dan tetap dapat disesuaikan dengan mencentang atau menghapus centang anggota tertentu."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input text-text-muted transition hover:bg-error-bg hover:text-error-text"
          >
            <AppIcon name="close" size={21} />
          </button>
        </header>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <StateCard icon="hourglass_top" title="Memuat anggota..." />
          ) : error ? (
            <StateCard
              icon="error_outline"
              title="Data anggota belum dapat dimuat"
              description={error.message}
              tone="error"
            />
          ) : mode === "manual" ? (
            <div>
              <div className="relative">
                <AppIcon
                  name="search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, NIS, jabatan, atau sekbid"
                  autoFocus
                  className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="mt-4 space-y-2">
                {manualRows.length === 0 ? (
                  <StateCard
                    icon="person_search"
                    title="Anggota tidak ditemukan"
                    description="Coba gunakan kata pencarian lain atau cek apakah anggota sudah ada di daftar peserta."
                  />
                ) : (
                  manualRows.map((item) => {
                    const checked = manualSelection.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-card hover:bg-surface"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleManual(item.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {initials(item.namaLengkap)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-text">
                            {item.namaLengkap || "Anggota"}
                          </span>
                          <span className="mt-1 block truncate text-xs text-text-muted">
                            {item.jabatanOrganisasi || "Anggota"} · {item.labelDivisi}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="sticky bottom-0 mt-5 flex justify-end gap-3 border-t border-border bg-card pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-text hover:bg-surface"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!manualSelection.size}
                  onClick={handleAddManual}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AppIcon name="person_add" size={18} />
                  Tambahkan {manualSelection.size || ""} Peserta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Pilihan Kelompok
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.preset.map((preset) => (
                    <KelompokPesertaCard
                      key={preset.key}
                      icon={preset.icon}
                      title={preset.label}
                      description={preset.description}
                      count={preset.members.length}
                      disabled={!preset.members.length}
                      onClick={() => {
                        onApplyGroup?.(preset.members, {
                          tipe: "preset",
                          key: preset.key,
                          label: preset.label,
                          idDivisi: null,
                        });
                        onClose?.();
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Pilih Berdasarkan Divisi / Sekbid
                </p>
                {data.divisionGroups.length === 0 ? (
                  <StateCard
                    icon="groups"
                    title="Belum ada divisi dengan anggota aktif"
                    description="Pilihan divisi akan tersedia setelah terdapat anggota aktif yang terhubung ke divisi tersebut."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.divisionGroups.map(({ division, members: divisionMembers }) => (
                    <KelompokPesertaCard
                      key={division.id}
                      icon={isBadanPengurusHarian(division) ? "account_balance" : "groups"}
                      title={labelDivisi(division)}
                      description={`${divisionMembers.length} anggota aktif pada divisi ini.`}
                      count={divisionMembers.length}
                      onClick={() => {
                        onApplyGroup?.(divisionMembers, {
                          tipe: "divisi",
                          key: `divisi:${division.id}`,
                          label: labelDivisi(division),
                          idDivisi: division.id,
                        });
                        onClose?.();
                      }}
                    />
                  ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function KelompokPesertaCard({ icon, title, description, count, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex min-h-32 items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
        <AppIcon name={icon} size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-bold text-text">{title}</span>
          <span className="rounded-full bg-input px-2.5 py-1 text-[10px] font-bold text-text-muted">
            {count}
          </span>
        </span>
        <span className="mt-2 block text-xs leading-5 text-text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}

function StateCard({ icon, title, description = "", tone = "default" }) {
  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        tone === "error"
          ? "border-error-text/20 bg-error-bg text-error-text"
          : "border-border bg-surface text-text"
      }`}
    >
      <AppIcon name={icon} size={28} />
      <p className="mt-3 text-sm font-bold">{title}</p>
      {description && <p className="mt-1 text-xs leading-5 opacity-80">{description}</p>}
    </div>
  );
}

function initials(value) {
  return String(value || "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
