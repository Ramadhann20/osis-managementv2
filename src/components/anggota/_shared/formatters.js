export function toDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function formatDate(value, options = {}) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatShortDate(value) {
  return formatDate(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value) {
  const date = toDate(value);

  if (!date) return "-";

  return `${new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)} WIB`;
}

export function formatDateTime(value) {
  const date = toDate(value);

  if (!date) return "-";

  return `${formatShortDate(date)}, ${formatTime(date)}`;
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "-";

  if (digits.startsWith("62")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(
      5,
      9
    )}-${digits.slice(9)}`.replace(/-$/, "");
  }

  return digits;
}

export function formatBytes(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / 1024 ** index;

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getInitials(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function getAttendanceLabel(status) {
  const labels = {
    present: "Hadir",
    late: "Terlambat",
    excused: "Izin",
    sick: "Sakit",
    absent: "Alpa",
  };

  return labels[status] || status || "-";
}

export function getActivityStatusLabel(status) {
  const labels = {
    draft: "Draf",
    upcoming: "Akan Datang",
    ongoing: "Berlangsung",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status] || status || "-";
}

export function getProposalStatusLabel(status) {
  const labels = {
    draft: "Draf",
    pending_review: "Menunggu Review",
    revision_required: "Perlu Revisi",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[status] || status || "-";
}

export function getMembershipStatusLabel(status) {
  const labels = {
    not_submitted: "Belum Mendaftar",
    pending_review: "Menunggu Review",
    rejected: "Ditolak",
    active: "Aktif",
    inactive: "Tidak Aktif",
    suspended: "Ditangguhkan",
  };

  return labels[status] || status || "-";
}

export function getAnnouncementCategoryLabel(category) {
  const labels = {
    internal: "Internal",
    general: "Umum",
    important: "Penting",
    competition: "Kompetisi",
  };

  return labels[category] || category || "Umum";
}

export function sortByDateDescending(items, fieldName) {
  return [...items].sort((a, b) => {
    const dateA = toDate(a?.[fieldName])?.getTime() || 0;
    const dateB = toDate(b?.[fieldName])?.getTime() || 0;

    return dateB - dateA;
  });
}
