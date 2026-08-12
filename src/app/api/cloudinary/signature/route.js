import { NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const config = cloudinary.config();

    const cloudName = String(config.cloud_name || "").trim();
    const apiKey = String(config.api_key || "").trim();
    const apiSecret = String(config.api_secret || "").trim();
    const uploadPreset = String(
      process.env.CLOUDINARY_UPLOAD_PRESET_PROPOSAL || ""
    ).trim();

    if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
      return NextResponse.json(
        {
          message:
            "Konfigurasi Cloudinary belum lengkap. Periksa CLOUDINARY_URL dan CLOUDINARY_UPLOAD_PRESET_PROPOSAL.",
        },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        upload_preset: uploadPreset,
      },
      apiSecret
    );

    return NextResponse.json(
      {
        cloudName,
        apiKey,
        uploadPreset,
        timestamp,
        signature,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("CLOUDINARY SIGNATURE ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal membuat signature upload Cloudinary.",
      },
      { status: 500 }
    );
  }
}
