import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Declared explicitly: no trailing slashes (matches current URL scheme).
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.example.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
  },
};

export default nextConfig;
