import type { ReactNode, SVGProps } from "react";

const P: Record<string, ReactNode> = {
  lens: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 1.6v3.2M12 19.2v3.2M1.6 12h3.2M19.2 12h3.2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.6c2.3 2.4 3.5 5.2 3.5 8.4S14.3 18 12 20.4C9.7 18 8.5 15.2 8.5 12S9.7 6 12 3.6z" />
    </>
  ),
  down: (
    <>
      <path d="M12 4v12" />
      <path d="M6.5 11L12 16.5 17.5 11" />
      <path d="M5 20h14" />
    </>
  ),
  up: (
    <>
      <path d="M12 20V8" />
      <path d="M6.5 13L12 7.5 17.5 13" />
      <path d="M5 4h14" />
    </>
  ),
  pulse: <path d="M3 12h3.4l2-5.5 3.4 11 2.4-7 1.8 1.5H21" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.4" />
      <path d="M15 6.6V5.4A2.4 2.4 0 0012.6 3H5.4A2.4 2.4 0 003 5.4v7.2A2.4 2.4 0 005.4 15h1.2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  refresh: (
    <>
      <path d="M4.8 12a7.2 7.2 0 1112.6 5" />
      <path d="M20 5v5h-5" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M19.5 14.6A8 8 0 019.4 4.5a8 8 0 1010.1 10.1z" />,
  lang: (
    <>
      <path d="M4 6h9M8.5 6v-1.6" />
      <path d="M11.4 6c0 3.6-2.6 6.6-6 7.6" />
      <path d="M6 9.4c.9 2.2 2.7 3.8 5 4.6" />
      <path d="M13.4 20l4-9 4 9M15 17h4.8" />
    </>
  ),
  wifi: (
    <>
      <path d="M3.4 9.4a12.4 12.4 0 0117.2 0" />
      <path d="M6.6 12.8a8 8 0 0110.8 0" />
      <path d="M9.6 16.2a4 4 0 014.8 0" />
      <circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.4M12 7.8h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.8" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0110.7 4h2.6a1.2 1.2 0 011.2 1.2V7" />
      <path d="M6.5 7l.8 12a1.6 1.6 0 001.6 1.5h6.2A1.6 1.6 0 0016.7 19l.8-12" />
    </>
  ),
};

export function Icon({ name, ...rest }: SVGProps<SVGSVGElement> & { name: string }) {
  const node = P[name];
  if (!node) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {node}
    </svg>
  );
}
