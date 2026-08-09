const MAX_PROPOSAL_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_PROPOSAL_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const ALLOWED_PROPOSAL_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getProposalFileExtension(fileName = "") {
  const parts = String(fileName).trim().split(".");
  if (parts.length < 2) return "";
  return String(parts.pop() || "").toLowerCase();
}

export function validasiFileProposal(file) {
  if (!file) {
    return "Pilih file proposal terlebih dahulu.";
  }

  const extension = getProposalFileExtension(file.name);

  if (!ALLOWED_PROPOSAL_EXTENSIONS.has(extension)) {
    return "Proposal hanya boleh berupa PDF, DOC, atau DOCX.";
  }

  // MIME dari browser kadang kosong. Jika browser memberikannya, tetap validasi.
  if (file.type && !ALLOWED_PROPOSAL_MIME_TYPES.has(file.type)) {
    return "Tipe file proposal tidak dikenali. Gunakan PDF, DOC, atau DOCX.";
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "File proposal kosong atau tidak valid.";
  }

  if (file.size > MAX_PROPOSAL_SIZE) {
    return "Ukuran proposal maksimal 10 MB.";
  }

  return "";
}

export async function uploadProposalCloudinary(file) {
  const validationError = validasiFileProposal(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    cache: "no-store",
  });

  const signatureData = await signatureResponse.json().catch(() => null);

  if (!signatureResponse.ok) {
    throw new Error(
      signatureData?.message || "Tidak dapat menyiapkan upload proposal."
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
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudName
    )}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await uploadResponse.json().catch(() => null);

  if (!uploadResponse.ok) {
    console.error("CLOUDINARY PROPOSAL UPLOAD ERROR:", result);

    throw new Error(
      result?.error?.message || "Proposal gagal diupload ke Cloudinary."
    );
  }

  const extension = getProposalFileExtension(file.name);

  return {
    namaFile: file.name,
    ukuranFileByte: Number(result?.bytes || file.size || 0),
    tipeFile: file.type || null,

    urlFile: result?.secure_url || null,
    publicIdFile: result?.public_id || null,
    assetIdFile: result?.asset_id || null,
    resourceTypeFile: result?.resource_type || null,
    formatFile: result?.format || extension || null,
    versionCloudinary: result?.version ?? null,
  };
}
