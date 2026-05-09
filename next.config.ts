import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MODAL_URL: "https://shaguoer--code-scanner-fastapi-app.modal.run",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com https://github.com https://*.github.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
