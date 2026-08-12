"use client";

import AppIcon from "@/components/global/AppIcon";
import {
  Avatar,
  MemberStatusBadge,
} from "../DataAnggotaUi";
import {
  formatDate,
  percentage,
} from "../dataAnggotaHelpers";
import { useAnggotaDetailOverlay } from "./AnggotaDetailOverlay";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isBoardDivision(division) {
  const divisionName = normalizeText(
    division?.namaSingkat || division?.nama || division?.kode
  );

  return [
    "badan pengurus harian",
    "badan pengurus harian osis",
    "bph",
  ].includes(divisionName);
}

function numericSuffixRank(value) {
  const text = normalizeText(value);

  if (/\b(1|i|satu)\b/.test(text)) return 0;
  if (/\b(2|ii|dua)\b/.test(text)) return 1;
  if (/\b(3|iii|tiga)\b/.test(text)) return 2;

  return 0;
}

function boardRoleRank(position) {
  const value = normalizeText(position);

  if (/^ketua(?:\s+(osis|umum))?$/.test(value)) return 0;
  if (/^wakil(?:\s+ketua)?$/.test(value)) return 10 + numericSuffixRank(value);
  if (/^sekretaris\b/.test(value)) return 20 + numericSuffixRank(value);
  if (/^bendahara\b/.test(value)) return 30 + numericSuffixRank(value);

  return 99;
}

function sekbidRoleRank(position) {
  const value = normalizeText(position);

  if (/^ketua(?:\s+(sekbid|seksi bidang|divisi))?\b/.test(value)) return 0;
  if (/^wakil(?:\s+ketua)?\b/.test(value)) return 10;
  if (/^sekretaris\b/.test(value)) return 20;
  if (/^bendahara\b/.test(value)) return 30;
  if (/^(koordinator|koor)\b/.test(value)) return 40;

  return 100;
}

export function isBadanPengurus(member) {
  // Keanggotaan Badan Pengurus Harian ditentukan HANYA dari relasi divisi.
  // Jabatan "Ketua" pada sekbid tetap masuk ke daftar/filter sekbid.
  return isBoardDivision(member?.divisi);
}

export function isBadanPengurusDivision(division) {
  return isBoardDivision(division);
}

export function sortBadanPengurus(items) {
  return [...items].sort((a, b) => {
    const rankDifference =
      boardRoleRank(a?.jabatanOrganisasi) -
      boardRoleRank(b?.jabatanOrganisasi);

    if (rankDifference !== 0) return rankDifference;

    return String(a?.namaLengkap || "").localeCompare(
      String(b?.namaLengkap || ""),
      "id",
      { sensitivity: "base" }
    );
  });
}

export function sortSekbidMembers(items) {
  return [...items].sort((a, b) => {
    const rankDifference =
      sekbidRoleRank(a?.jabatanOrganisasi) -
      sekbidRoleRank(b?.jabatanOrganisasi);

    if (rankDifference !== 0) return rankDifference;

    return String(a?.namaLengkap || "").localeCompare(
      String(b?.namaLengkap || ""),
      "id",
      { sensitivity: "base" }
    );
  });
}

export default function BadanPengurusSection({ members = [] }) {
  const { openAnggotaDetail } = useAnggotaDetailOverlay();

  if (!members.length) return null;

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AppIcon name="groups" size={23} />
          </div>

          <div>
            <h2 className="font-bold text-text">Badan Pengurus Harian</h2>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Ketua, wakil ketua, sekretaris, dan bendahara OSIS.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {members.length} pengurus
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        {members.map((member, index) => (
          <article
            key={member.id}
            role="button"
            tabIndex={0}
            title={`Lihat detail ${member.namaLengkap || "anggota"}`}
            onClick={() => openAnggotaDetail(member)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openAnggotaDetail(member);
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="absolute right-4 top-4 text-3xl font-black text-primary/10">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-3 pr-10">
              <Avatar name={member.namaLengkap} size="lg" />

              <div className="min-w-0">
                <p className="truncate font-bold text-text">
                  {member.namaLengkap || "-"}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {member.jabatanOrganisasi || "Badan Pengurus Harian"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-input p-3">
                <p className="text-text-muted">NIS</p>
                <p className="mt-1 truncate font-semibold text-text">
                  {member.nis || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-input p-3">
                <p className="text-text-muted">Kelas</p>
                <p className="mt-1 truncate font-semibold text-text">
                  {member.namaKelas || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Kehadiran</span>
                <span className="font-bold text-text">
                  {percentage(member.ringkasan?.persentaseKehadiran)}%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-input">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${percentage(
                      member.ringkasan?.persentaseKehadiran
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[11px] text-text-muted">
                Bergabung {formatDate(member.bergabungPada)}
              </p>

              <div className="flex items-center gap-2">
                <MemberStatusBadge status={member.statusKeanggotaan} />
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition group-hover:translate-x-0.5 group-hover:bg-primary/10 group-hover:text-primary">
                  <AppIcon name="chevron_right" size={21} />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}