"use client";

import { useMemo } from "react";

import { useCurrentMember } from "@/components/anggota/_shared/useCurrentMember";
import { useDoc } from "@/hooks/useDoc";

/**
 * Aturan akses organisasi yang dapat dipakai lintas halaman side Anggota.
 *
 * PIMPINAN_ORGANISASI saat ini berarti:
 * - anggota aktif yang berada di Badan Pengurus Harian; ATAU
 * - anggota aktif yang menjabat Ketua pada sebuah Sekbid.
 */
export const ATURAN_AKSES_ORGANISASI = Object.freeze({
  ANGGOTA_AKTIF: "anggota_aktif",
  BADAN_PENGURUS_HARIAN: "badan_pengurus_harian",
  KETUA_SEKBID: "ketua_sekbid",
  PIMPINAN_ORGANISASI: "pimpinan_organisasi",
});

function normalisasi(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Kompatibilitas pembacaan status.
 * Skema terbaru menggunakan "aktif".
 * Nilai "active" tetap diterima agar data lama tidak langsung hilang dari UI.
 */
export function isAnggotaAktif(member) {
  const status = normalisasi(
    member?.statusKeanggotaan ?? member?.membershipStatus
  );

  return status === "aktif" || status === "active";
}

export function isBadanPengurusHarian(divisi) {
  const kode = String(divisi?.kode ?? divisi?.code ?? "")
    .trim()
    .toUpperCase();

  const kandidatNama = [
    divisi?.namaSingkat,
    divisi?.nama,
    divisi?.shortName,
    divisi?.name,
  ]
    .map(normalisasi)
    .filter(Boolean);

  return (
    kode === "BPH" ||
    kandidatNama.some((nama) =>
      [
        "badan pengurus harian",
        "badan pengurus harian osis",
        "badan pengurus",
        "bph",
      ].includes(nama)
    )
  );
}

export function isKetuaSekbid(member, divisi) {
  if (!member || !divisi || isBadanPengurusHarian(divisi)) return false;

  const jabatan = normalisasi(
    member?.jabatanOrganisasi ?? member?.organisationPosition ?? member?.jabatan
  );

  return jabatan === "ketua" || jabatan.startsWith("ketua sekbid");
}

export function evaluasiAksesOrganisasi({
  member,
  divisi,
  aturan = ATURAN_AKSES_ORGANISASI.ANGGOTA_AKTIF,
}) {
  const anggotaAktif = isAnggotaAktif(member);
  const badanPengurusHarian = anggotaAktif && isBadanPengurusHarian(divisi);
  const ketuaSekbid = anggotaAktif && isKetuaSekbid(member, divisi);
  const pimpinanOrganisasi = badanPengurusHarian || ketuaSekbid;

  switch (aturan) {
    case ATURAN_AKSES_ORGANISASI.ANGGOTA_AKTIF:
      return anggotaAktif;

    case ATURAN_AKSES_ORGANISASI.BADAN_PENGURUS_HARIAN:
      return badanPengurusHarian;

    case ATURAN_AKSES_ORGANISASI.KETUA_SEKBID:
      return ketuaSekbid;

    case ATURAN_AKSES_ORGANISASI.PIMPINAN_ORGANISASI:
      return pimpinanOrganisasi;

    default:
      return false;
  }
}

/**
 * Hook reusable apabila halaman lain membutuhkan hasil akses organisasi.
 */
export function useAksesOrganisasi() {
  const currentMember = useCurrentMember();

  const idDivisi =
    currentMember.member?.idDivisi ??
    currentMember.member?.divisionId ??
    null;

  const divisiResult = useDoc("Divisi", idDivisi, {
    enabled: Boolean(idDivisi),
  });

  const divisi = divisiResult.data || null;
  const loading = currentMember.loading || divisiResult.loading;
  const error = currentMember.error || divisiResult.error;

  const hasil = useMemo(() => {
    const member = currentMember.member;
    const anggotaAktif = isAnggotaAktif(member);
    const badanPengurusHarian =
      anggotaAktif && isBadanPengurusHarian(divisi);
    const ketuaSekbid = anggotaAktif && isKetuaSekbid(member, divisi);

    return {
      anggotaAktif,
      badanPengurusHarian,
      ketuaSekbid,
      pimpinanOrganisasi: badanPengurusHarian || ketuaSekbid,
    };
  }, [currentMember.member, divisi]);

  const boleh = (aturan) =>
    evaluasiAksesOrganisasi({
      member: currentMember.member,
      divisi,
      aturan,
    });

  return {
    member: currentMember.member,
    memberId: currentMember.memberId,
    divisi,
    loading,
    error,
    ...hasil,
    boleh,
  };
}

/**
 * Guard component.
 */
export default function AksesOrganisasi({
  aturan = ATURAN_AKSES_ORGANISASI.ANGGOTA_AKTIF,
  children,
  fallback = null,
  loadingFallback = null,
}) {
  const akses = useAksesOrganisasi();

  if (akses.loading) return loadingFallback;
  if (akses.error || !akses.boleh(aturan)) return fallback;

  return typeof children === "function" ? children(akses) : children;
}
