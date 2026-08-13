/**
 * Source of truth untuk modul Pengumuman.
 *
 * Catatan desain:
 * - `category` dipertahankan untuk kompatibilitas data lama.
 * - `audienceType` menjadi penentu utama apakah pengumuman berlaku untuk
 *   semua anggota atau hanya satu Sekbid.
 * - `isPinned` dipakai sebagai mark "Penting", bukan kategori tersendiri.
 */

export const KOLEKSI_PENGUMUMAN = "Pengumuman";

export const AUDIENS_PENGUMUMAN = Object.freeze({
  SEMUA: "semua",
  INTERNAL: "internal",
});

export const FILTER_PENGUMUMAN = Object.freeze({
  SEMUA: "all",
  UMUM: "general",
  INTERNAL: "internal",
  PENTING: "important",
});

export const OPSI_FILTER_PENGUMUMAN = Object.freeze([
  [FILTER_PENGUMUMAN.SEMUA, "Semua"],
  [FILTER_PENGUMUMAN.UMUM, "Umum"],
  [FILTER_PENGUMUMAN.INTERNAL, "Internal"],
  [FILTER_PENGUMUMAN.PENTING, "Penting"],
]);

export function rowsOf(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

export function normalisasi(value) {
  return String(value || "").trim().toLowerCase();
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTanggalPengumuman(value, { withTime = false } = {}) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

export function labelDivisi(divisi) {
  return (
    divisi?.namaSingkat ||
    divisi?.nama ||
    divisi?.shortName ||
    divisi?.name ||
    "Sekbid"
  );
}

/**
 * Data lama mungkin belum memiliki audienceType.
 * Karena itu `category: internal` tetap dibaca sebagai audiens internal.
 */
export function getAudienceType(announcement) {
  if (announcement?.audienceType === AUDIENS_PENGUMUMAN.INTERNAL) {
    return AUDIENS_PENGUMUMAN.INTERNAL;
  }

  if (announcement?.category === "internal") {
    return AUDIENS_PENGUMUMAN.INTERNAL;
  }

  return AUDIENS_PENGUMUMAN.SEMUA;
}

export function getTargetDivisionId(announcement) {
  return (
    announcement?.targetDivisionId ||
    announcement?.idDivisiTarget ||
    announcement?.audienceDivisionId ||
    (Array.isArray(announcement?.audienceDivisionIds)
      ? announcement.audienceDivisionIds[0]
      : null) ||
    null
  );
}

export function getTargetDivisionName(announcement, divisionMap = null) {
  const stored =
    announcement?.targetDivisionName ||
    announcement?.namaDivisiTarget ||
    null;

  if (stored) return stored;

  const targetId = getTargetDivisionId(announcement);
  if (targetId && divisionMap?.get) {
    return labelDivisi(divisionMap.get(targetId));
  }

  return "Internal Sekbid";
}

/**
 * `Penting` adalah mark. Data legacy kategori important / priority tinggi tetap
 * dianggap penting agar pengumuman lama tidak kehilangan penanda visual.
 */
export function isPengumumanPenting(announcement) {
  return Boolean(
    announcement?.isPinned ||
      announcement?.isImportant ||
      announcement?.category === "important" ||
      announcement?.priority === "high" ||
      announcement?.priority === "urgent"
  );
}

export function labelAudiensPengumuman(announcement, divisionMap = null) {
  if (getAudienceType(announcement) === AUDIENS_PENGUMUMAN.INTERNAL) {
    return `Internal · ${getTargetDivisionName(announcement, divisionMap)}`;
  }

  return "Semua Anggota";
}

/**
 * Kompetisi sudah tidak menjadi kategori di versi baru. Bila masih terdapat
 * data lama dengan category=competition, data tersebut diperlakukan sebagai
 * pengumuman umum agar tidak hilang dari histori.
 */
export function kategoriTampilan(announcement) {
  return getAudienceType(announcement) === AUDIENS_PENGUMUMAN.INTERNAL
    ? FILTER_PENGUMUMAN.INTERNAL
    : FILTER_PENGUMUMAN.UMUM;
}

export function cocokFilterPengumuman(announcement, filter) {
  if (filter === FILTER_PENGUMUMAN.SEMUA) return true;
  if (filter === FILTER_PENGUMUMAN.PENTING) {
    return isPengumumanPenting(announcement);
  }

  return kategoriTampilan(announcement) === filter;
}

export function cocokPencarianPengumuman(announcement, keyword) {
  const search = normalisasi(keyword);
  if (!search) return true;

  return [
    announcement?.title,
    announcement?.summary,
    announcement?.content,
    announcement?.authorName,
    announcement?.authorPosition,
    announcement?.targetDivisionName,
    announcement?.idReferensi,
  ]
    .map(normalisasi)
    .some((value) => value.includes(search));
}

export function sortPengumuman(rows) {
  return [...rows].sort((a, b) => {
    const importantDiff =
      Number(isPengumumanPenting(b)) - Number(isPengumumanPenting(a));
    if (importantDiff) return importantDiff;

    const aTime =
      toDate(a?.publishedAt || a?.dibuatPada || a?.createdAt)?.getTime() || 0;
    const bTime =
      toDate(b?.publishedAt || b?.dibuatPada || b?.createdAt)?.getTime() || 0;

    return bTime - aTime;
  });
}

export function buatRingkasan(content, maxLength = 160) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function buatPayloadPengumuman({
  idReferensi,
  title,
  content,
  audienceType,
  targetDivisionId = null,
  targetDivisionName = null,
  isImportant = false,
  author,
  waktu,
}) {
  const isInternal = audienceType === AUDIENS_PENGUMUMAN.INTERNAL;

  return {
    idReferensi: idReferensi || null,
    title: String(title || "").trim(),
    summary: buatRingkasan(content),
    content: String(content || "").trim(),

    // category dipertahankan agar komponen/data lama masih kompatibel.
    category: isInternal ? "internal" : "general",
    audienceType: isInternal
      ? AUDIENS_PENGUMUMAN.INTERNAL
      : AUDIENS_PENGUMUMAN.SEMUA,
    targetDivisionId: isInternal ? targetDivisionId || null : null,
    targetDivisionName: isInternal ? targetDivisionName || null : null,
    audienceRoles: ["anggota"],

    // Penting adalah mark, bukan kategori.
    isPinned: Boolean(isImportant),
    isImportant: Boolean(isImportant),
    isPublished: true,

    authorId: author?.id || null,
    authorUserId: author?.userId || null,
    authorType: author?.type || "anggota",
    authorName: author?.name || "Pengurus OSIS",
    authorPosition: author?.position || "Pengurus OSIS",
    authorDivisionId: author?.divisionId || null,
    authorDivisionName: author?.divisionName || null,

    publishedAt: waktu,
    diperbaruiPada: waktu,
  };
}
