import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage public URLs. Replace the wildcard with your exact
    // project host if you prefer to lock it down, e.g. "abcd.supabase.co".
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  // If you hit a cross-origin dev warning, add your LAN origin here
  // (must live INSIDE nextConfig):
  allowedDevOrigins: ["http://192.168.1.10:3000"],
};

export default nextConfig;
