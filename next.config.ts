import type { NextConfig } from "next";

/** STATIC_EXPORT=1 时输出纯静态站点（out/），供 Cloudflare Pages 等静态托管使用 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        images: {
          remotePatterns: [{ protocol: "https", hostname: "**" }],
        },
      }),
};

export default nextConfig;
