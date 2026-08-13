// Utility laporan sederhana tanpa library PDF tambahan.
// Browser membuka halaman print khusus; pengguna dapat memilih "Save as PDF".
// Cara ini cukup untuk demo skripsi dan tidak menambah dependency project.

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTanggal(value) {
  if (!value) return "-";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function cetakLaporanAbsensi({ activity, session, rows }) {
  if (typeof window === "undefined") return;

  const counts = rows.reduce(
    (acc, row) => {
      const status = row.statusKehadiran || "-";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  const hadir = Number(counts.hadir || 0) + Number(counts.terlambat || 0);
  const total = rows.length;
  const persentase = total ? Math.round((hadir / total) * 100) : 0;

  const tableRows = rows
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.member?.namaLengkap || row.member?.nama || "-")}</td>
          <td>${escapeHtml(row.member?.nis || "-")}</td>
          <td>${escapeHtml(row.divisionLabel || "-")}</td>
          <td>${escapeHtml(row.statusLabel || row.statusKehadiran || "-")}</td>
          <td>${escapeHtml(row.alasan || "-")}</td>
        </tr>`
    )
    .join("");

  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!reportWindow) return;

  reportWindow.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Absensi - ${escapeHtml(activity?.namaKegiatan || "Kegiatan OSIS")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .muted { color: #6b7280; font-size: 12px; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin: 24px 0; }
    .meta div { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 20px 0 28px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
    .stat strong { display: block; font-size: 20px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .footer { margin-top: 24px; font-size: 11px; color: #6b7280; }
    @media print {
      body { margin: 14mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="float:right;padding:10px 14px;">Cetak / Simpan PDF</button>
  <p class="muted">LAPORAN ABSENSI KEGIATAN OSIS</p>
  <h1>${escapeHtml(activity?.namaKegiatan || "Kegiatan OSIS")}</h1>
  <p class="muted">${escapeHtml(activity?.idReferensi || "-")}</p>

  <section class="meta">
    <div><span class="muted">Tanggal</span><br><strong>${escapeHtml(formatTanggal(session?.tanggal || session?.waktuMulai))}</strong></div>
    <div><span class="muted">Lokasi</span><br><strong>${escapeHtml(activity?.lokasi || "-")}</strong></div>
    <div><span class="muted">Status Sesi</span><br><strong>${escapeHtml(session?.status || "-")}</strong></div>
    <div><span class="muted">Total Peserta</span><br><strong>${total}</strong></div>
  </section>

  <section class="stats">
    <div class="stat"><span class="muted">Hadir</span><strong>${counts.hadir || 0}</strong></div>
    <div class="stat"><span class="muted">Izin</span><strong>${counts.izin || 0}</strong></div>
    <div class="stat"><span class="muted">Sakit</span><strong>${counts.sakit || 0}</strong></div>
    <div class="stat"><span class="muted">Alpa</span><strong>${counts.alpa || 0}</strong></div>
    <div class="stat"><span class="muted">Kehadiran</span><strong>${persentase}%</strong></div>
  </section>

  <table>
    <thead>
      <tr><th>No</th><th>Nama</th><th>NIS</th><th>Divisi</th><th>Status</th><th>Keterangan</th></tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <p class="footer">Laporan ini dihasilkan setelah seluruh data absensi pada sesi dikonfirmasi Pembina.</p>
</body>
</html>`);
  reportWindow.document.close();
}
