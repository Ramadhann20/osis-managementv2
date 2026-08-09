export function rowsOf(result) {
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export function isLoading(...results) {
  return results.some((result) => Boolean(result?.loading));
}

export function firstError(...results) {
  return results.find((result) => result?.error)?.error || null;
}

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
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
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
  if (!toDate(value)) return "-";
  return `${formatDate(value)}, ${formatTime(value)}`;
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

export function sortDateDesc(items, field) {
  return [...items].sort((a, b) => {
    const aTime = toDate(a?.[field])?.getTime() || 0;
    const bTime = toDate(b?.[field])?.getTime() || 0;
    return bTime - aTime;
  });
}

export function percentage(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}
