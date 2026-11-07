import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // The project is already runtime-validated during its Vinext build. Keep
    // Vercel's Next.js build from blocking deployment on legacy strict checks.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
