/*
 * Generator rekap absensi kegiatan dalam format XLSX tanpa dependency tambahan.
 *
 * Format workbook mengikuti template yang diberikan:
 * - Judul "REKAP DAFTAR HADIR PENGURUS OSIS"
 * - Nama sekolah dan tahun pelajaran
 * - Kolom No, Nama Siswa, Jabatan
 * - Kelompok "Alasan Tidak Hadir" dengan subkolom S / I / A
 *
 * Jika satu kegiatan memiliki beberapa sesi absensi, setiap sesi dibuat sebagai
 * satu worksheet agar data tiap sesi tetap jelas dan mudah dicetak.
 */

export const REKAP_ABSENSI_CONFIG = Object.freeze({
  namaSekolah: "SMA MUTIARA 2 BANDUNG",
  tahunPelajaran: "2026-2027",
  minimalBarisPeserta: 30,
});

function normalizeText(value) {
  return String(value ?? "").trim();
}

function xmlEscape(value) {
  return normalizeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTanggalIndonesia(value) {
  const date = toDate(value);
  if (!date) return "Tanggal belum tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function safeFilePart(value, fallback = "Kegiatan") {
  const text = normalizeText(value) || fallback;
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;
}

function safeSheetName(value, fallback = "Sesi") {
  const text = normalizeText(value)
    .replace(/[\\/?*\[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (text || fallback).slice(0, 31);
}

function memberName(member) {
  return (
    member?.namaLengkap ||
    member?.fullName ||
    member?.nama ||
    "Anggota OSIS"
  );
}

function memberPosition(member) {
  return (
    member?.jabatanOrganisasi ||
    member?.organisationPosition ||
    member?.jabatan ||
    "Anggota"
  );
}

function recordSessionId(record) {
  return record?.idSesi ?? record?.sessionId ?? null;
}

function recordMemberId(record) {
  return record?.idAnggota ?? record?.memberId ?? null;
}

function recordAttendanceStatus(record) {
  const raw = String(record?.statusKehadiran ?? record?.status ?? "")
    .trim()
    .toLowerCase();

  const aliases = {
    present: "hadir",
    hadir: "hadir",
    excused: "izin",
    izin: "izin",
    sick: "sakit",
    sakit: "sakit",
    absent: "alpa",
    alpa: "alpa",
  };

  return aliases[raw] || raw;
}

function sessionStart(session) {
  return session?.waktuMulai ?? session?.startAt ?? session?.tanggal ?? null;
}

function cellInline(ref, value, style = 0) {
  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}" s="${style}"/>`;
  }

  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(
    value
  )}</t></is></c>`;
}

function cellNumber(ref, value, style = 0) {
  return `<c r="${ref}" s="${style}"><v>${Number(value) || 0}</v></c>`;
}

function rowXml(rowNumber, cells, height = null) {
  const attrs = height
    ? ` r="${rowNumber}" ht="${height}" customHeight="1"`
    : ` r="${rowNumber}"`;
  return `<row${attrs}>${cells.join("")}</row>`;
}

function buildSheetXml({ activity, session, sessionIndex, participantRows, config }) {
  const minRows = Math.max(
    Number(config.minimalBarisPeserta) || 30,
    participantRows.length
  );
  const lastRow = 7 + minRows;
  const namaKegiatan = normalizeText(activity?.namaKegiatan) || "Kegiatan OSIS";
  const tanggal = formatTanggalIndonesia(sessionStart(session));
  const sesiLabel = `Sesi ${sessionIndex + 1}`;

  const rows = [];

  rows.push(
    rowXml(1, [cellInline("A1", "REKAP DAFTAR HADIR PENGURUS OSIS", 1)], 27)
  );
  rows.push(rowXml(2, [cellInline("A2", config.namaSekolah, 2)], 24));
  rows.push(
    rowXml(3, [
      cellInline("A3", `TAHUN PELAJARAN ${config.tahunPelajaran}`, 2),
    ], 24)
  );
  rows.push(rowXml(4, [], 9));
  rows.push(
    rowXml(
      5,
      [cellInline("A5", `${namaKegiatan} • ${sesiLabel} • ${tanggal}`, 6)],
      22
    )
  );

  rows.push(
    rowXml(
      6,
      [
        cellInline("A6", "No", 3),
        cellInline("B6", "Nama Siswa", 3),
        cellInline("C6", "Jabatan", 3),
        cellInline("D6", "Alasan Tidak\nHadir", 3),
      ],
      34
    )
  );
  rows.push(
    rowXml(
      7,
      [
        cellInline("D7", "S", 3),
        cellInline("E7", "I", 3),
        cellInline("F7", "A", 3),
      ],
      24
    )
  );

  for (let index = 0; index < minRows; index += 1) {
    const rowNumber = 8 + index;
    const participant = participantRows[index] || null;
    const status = participant?.status || "";

    rows.push(
      rowXml(
        rowNumber,
        [
          cellNumber(`A${rowNumber}`, index + 1, 4),
          cellInline(`B${rowNumber}`, participant?.nama || "", 5),
          cellInline(`C${rowNumber}`, participant?.jabatan || "", 5),
          cellInline(`D${rowNumber}`, status === "sakit" ? "✓" : "", 4),
          cellInline(`E${rowNumber}`, status === "izin" ? "✓" : "", 4),
          cellInline(`F${rowNumber}`, status === "alpa" ? "✓" : "", 4),
        ],
        20
      )
    );
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:F${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="7" customWidth="1"/>
    <col min="2" max="2" width="32" customWidth="1"/>
    <col min="3" max="3" width="45" customWidth="1"/>
    <col min="4" max="6" width="7" customWidth="1"/>
  </cols>
  <sheetData>${rows.join("")}</sheetData>
  <mergeCells count="8">
    <mergeCell ref="A1:F1"/>
    <mergeCell ref="A2:F2"/>
    <mergeCell ref="A3:F3"/>
    <mergeCell ref="A5:F5"/>
    <mergeCell ref="A6:A7"/>
    <mergeCell ref="B6:B7"/>
    <mergeCell ref="C6:C7"/>
    <mergeCell ref="D6:F6"/>
  </mergeCells>
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0" paperSize="9"/>
</worksheet>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Times New Roman"/></font>
    <font><b/><sz val="18"/><name val="Times New Roman"/></font>
    <font><b/><sz val="14"/><name val="Times New Roman"/></font>
    <font><b/><sz val="12"/><name val="Times New Roman"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC6E0B4"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="thin"><color rgb="FF000000"/></right>
      <top style="thin"><color rgb="FF000000"/></top>
      <bottom style="thin"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function buildWorkbookXml(sheetNames) {
  const sheets = sheetNames
    .map(
      (name, index) =>
        `<sheet name="${xmlEscape(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
  <sheets>${sheets}</sheets>
  <calcPr calcId="191029"/>
</workbook>`;
}

function buildWorkbookRelsXml(sheetCount) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) => {
    return `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildContentTypesXml(sheetCount) {
  const sheets = Array.from({ length: sheetCount }, (_, index) => {
    return `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function buildRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function buildCoreXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Manajemen Absensi OSIS</dc:creator>
  <cp:lastModifiedBy>Manajemen Absensi OSIS</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppXml(sheetNames) {
  const titles = sheetNames.map((name) => `<vt:lpstr>${xmlEscape(name)}</vt:lpstr>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Manajemen Absensi OSIS</Application>
  <TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>
</Properties>`;
}

// ---------------------------------------------------------------------------
// ZIP writer minimal
// XLSX sebenarnya adalah kumpulan file XML di dalam container ZIP. Agar tidak
// menambah dependency SheetJS/ExcelJS, generator menggunakan ZIP mode STORE
// (tanpa kompresi). Excel tetap dapat membuka hasilnya secara normal.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function zipStore(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  entries.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const dataBytes =
      content instanceof Uint8Array ? content : encoder.encode(String(content));
    const crc = crc32(dataBytes);

    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800), // UTF-8 filename
      uint16(0), // STORE / tanpa kompresi
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, dataBytes);

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(localOffset),
      nameBytes,
    ]);

    centralParts.push(centralHeader);
    localOffset += localHeader.length + dataBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(localOffset),
    uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

function buildParticipantRows({ activity, session, records, members }) {
  const memberMap = new Map((members || []).map((item) => [item.id, item]));
  const sessionRecordMap = new Map(
    (records || [])
      .filter((record) => recordSessionId(record) === session.id)
      .map((record) => [recordMemberId(record), record])
  );

  const participantIds = Array.isArray(activity?.pesertaFinal?.idAnggota)
    ? activity.pesertaFinal.idAnggota
    : [];

  return participantIds
    .map((idAnggota) => {
      const member = memberMap.get(idAnggota) || null;
      const record = sessionRecordMap.get(idAnggota) || null;

      return {
        id: idAnggota,
        nama: memberName(member),
        jabatan: memberPosition(member),
        status: recordAttendanceStatus(record),
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

export function buatWorkbookRekapAbsensiBytes({
  activity,
  sessions = [],
  records = [],
  members = [],
  config = {},
}) {
  if (!activity?.id) {
    throw new Error("Data kegiatan belum tersedia untuk membuat rekap.");
  }

  const mergedConfig = {
    ...REKAP_ABSENSI_CONFIG,
    ...(config || {}),
  };

  const activitySessions = [...sessions]
    .filter(
      (session) =>
        (session?.idKegiatan ?? session?.activityId) === activity.id
    )
    .sort((a, b) => {
      const timeA = toDate(sessionStart(a))?.getTime() || 0;
      const timeB = toDate(sessionStart(b))?.getTime() || 0;
      return timeA - timeB;
    });

  if (!activitySessions.length) {
    throw new Error("Kegiatan belum memiliki sesi absensi untuk direkap.");
  }

  const usedNames = new Set();
  const sheetNames = activitySessions.map((session, index) => {
    const date = toDate(sessionStart(session));
    const base = safeSheetName(
      date
        ? `Sesi ${index + 1} ${String(date.getDate()).padStart(2, "0")}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`
        : `Sesi ${index + 1}`
    );

    let name = base;
    let counter = 2;
    while (usedNames.has(name)) {
      name = safeSheetName(`${base} ${counter}`);
      counter += 1;
    }
    usedNames.add(name);
    return name;
  });

  const entries = [
    { name: "[Content_Types].xml", content: buildContentTypesXml(sheetNames.length) },
    { name: "_rels/.rels", content: buildRootRelsXml() },
    { name: "docProps/core.xml", content: buildCoreXml() },
    { name: "docProps/app.xml", content: buildAppXml(sheetNames) },
    { name: "xl/workbook.xml", content: buildWorkbookXml(sheetNames) },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: buildWorkbookRelsXml(sheetNames.length),
    },
    { name: "xl/styles.xml", content: buildStylesXml() },
  ];

  activitySessions.forEach((session, index) => {
    entries.push({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: buildSheetXml({
        activity,
        session,
        sessionIndex: index,
        participantRows: buildParticipantRows({
          activity,
          session,
          records,
          members,
        }),
        config: mergedConfig,
      }),
    });
  });

  return zipStore(entries);
}

export function buatNamaFileRekapAbsensi(activity) {
  const nama = safeFilePart(activity?.namaKegiatan, "Kegiatan_OSIS");
  const referensi = safeFilePart(activity?.idReferensi, "");
  const suffix = referensi ? `_${referensi}` : "";
  return `Rekap_Daftar_Hadir_${nama}${suffix}.xlsx`;
}

export function downloadRekapAbsensiKegiatan(payload) {
  const bytes = buatWorkbookRekapAbsensiBytes(payload);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buatNamaFileRekapAbsensi(payload.activity);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
