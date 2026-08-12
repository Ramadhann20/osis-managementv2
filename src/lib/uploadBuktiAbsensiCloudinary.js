const MAX_BUKTI_ABSENSI_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function extensionOf(fileName = "") {
  const parts = String(fileName).trim().split(".");
  return parts.length > 1 ? String(parts.pop() || "").toLowerCase() : "";
}

export function validasiBuktiAbsensi(file) {
  if (!file) return "Dokumen pendukung wajib dipilih.";

  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Dokumen pendukung hanya boleh berupa PDF, JPG, JPEG, atau PNG.";
  }

  // Beberapa browser tidak mengirim MIME type. Jika tersedia, MIME tetap dicek.
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Tipe dokumen pendukung tidak dikenali.";
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "Dokumen pendukung kosong atau tidak valid.";
  }

  if (file.size > MAX_BUKTI_ABSENSI_SIZE) {
    return "Ukuran dokumen pendukung maksimal 5 MB.";
  }

  return "";
}

export async function uploadBuktiAbsensiCloudinary(file) {
  const validationError = validasiBuktiAbsensi(file);
  if (validationError) throw new Error(validationError);

  // Endpoint signature yang sama dengan proposal tetap digunakan supaya
  // konfigurasi Cloudinary tidak tersebar ke banyak file client.
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    cache: "no-store",
  });

  const signatureData = await signatureResponse.json().catch(() => null);
  if (!signatureResponse.ok) {
    throw new Error(
      signatureData?.message || "Tidak dapat menyiapkan upload dokumen pendukung."
    );
  }

  const { cloudName, apiKey, uploadPreset, timestamp, signature } =
    signatureData || {};

  if (!cloudName || !apiKey || !uploadPreset || !timestamp || !signature) {
    throw new Error("Respons signature Cloudinary tidak lengkap.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("upload_preset", uploadPreset);
  formData.append("signature", signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
    { method: "POST", body: formData }
  );

  const result = await uploadResponse.json().catch(() => null);
  if (!uploadResponse.ok) {
    console.error("CLOUDINARY BUKTI ABSENSI UPLOAD ERROR:", result);
    throw new Error(
      result?.error?.message || "Dokumen pendukung gagal diupload ke Cloudinary."
    );
  }

  return {
    namaFile: file.name,
    ukuranFileByte: Number(result?.bytes || file.size || 0),
    tipeFile: file.type || null,
    urlFile: result?.secure_url || null,
    publicIdFile: result?.public_id || null,
    assetIdFile: result?.asset_id || null,
    resourceTypeFile: result?.resource_type || null,
    formatFile: result?.format || extensionOf(file.name) || null,
    versionCloudinary: result?.version ?? null,
  };
}
