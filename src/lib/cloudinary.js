import "server-only";

import { v2 as cloudinary } from "cloudinary";

// Cloudinary otomatis membaca CLOUDINARY_URL dari environment:
// CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
cloudinary.config({
  secure: true,
});

export default cloudinary;
