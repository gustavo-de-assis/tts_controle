import type { NextConfig } from "next";

const nextConfig: NextConfig = {
typescript: {
    // Permite que o build conclua na Vercel mesmo se houver erros de tipo
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignores avisos de linter durante o build
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
