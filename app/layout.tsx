import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IP Lens — 看清你的网络 / See your network clearly",
  description:
    "查看您的 IP、归属地与运营商，并真实测量下载、上传、延迟与抖动。无账号、无追踪，全部在浏览器内完成。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('iplens.theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
