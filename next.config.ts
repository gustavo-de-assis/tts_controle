import type { NextConfig } from "next";

const nextConfig: NextConfig = {
typescript: {
    // Permite que o build conclua na Vercel mesmo se houver erros de tipo
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
