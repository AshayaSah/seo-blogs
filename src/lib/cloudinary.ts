import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
};

let checked = false;

function ensureConfigured() {
  if (checked) return;
  if (!process.env.CLOUDINARY_URL) {
    throw new Error(
      "CLOUDINARY_URL is not set. Add it to .env.local in the format: " +
        "CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>",
    );
  }
  checked = true;
}

const proxy = new Proxy(cloudinary, {
  get(target, prop, receiver) {
    ensureConfigured();
    return Reflect.get(target, prop, receiver);
  },
});

export { proxy as cloudinary };
