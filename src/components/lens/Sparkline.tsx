import type { Sample } from "@/lib/speedtest";

/** 下载速率曲线：把样本压成一条平滑折线 + 渐变填充 */
export function Sparkline({ samples, max }: { samples: Sample[]; max?: number }) {
  const W = 640;
  const H = 72;
  const pts = samples.slice(-80);

  if (pts.length < 2) {
    return (
      <div className="flex h-[72px] items-center justify-center text-xs text-muted">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden="true">
          <path
            d={`M0 ${H - 1} H${W}`}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  const peak = Math.max(max ?? 0, ...pts.map((p) => p.mbps), 1) * 1.15;
  const step = W / (pts.length - 1);
  const y = (v: number) => H - 4 - (v / peak) * (H - 10);

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${y(p.mbps).toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[72px] w-full" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lensArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0 ${H - 0.5} H${W}`} stroke="var(--border)" strokeWidth="1" fill="none" />
      <path d={area} fill="url(#lensArea)" />
      <path d={line} fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
