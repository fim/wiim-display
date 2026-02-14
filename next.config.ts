import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-ssdp", "upnp-device-client"],
  logging: false,
};

export default nextConfig;
