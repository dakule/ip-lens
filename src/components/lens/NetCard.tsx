"use client";

import { useState } from "react";
import type { NetInfo } from "@/lib/speedtest";
import type { Copy } from "./i18n";
import { Icon } from "./icons";

export function NetCard({
  t,
  info,
  loading,
  error,
  onRetry,
}: {
  t: Copy;
  info: NetInfo | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyIp = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  const rows: { icon: string; label: string; value: string; note?: string }[] = info
    ? [
        { icon: "globe", label: t.location, value: [info.city, info.country].filter(Boolean).join(" · ") },
        { icon: "wifi", label: t.isp, value: info.isp },
        { icon: "pulse", label: t.asn, value: info.asn ? `AS${info.asn}` : "—" },
        { icon: "lens", label: t.edge, value: info.colo },
        { icon: "clock", label: t.timezone, value: info.timezone },
      ]
    : [];

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Icon name="globe" className="size-[18px] text-accent" />
          {t.network}
        </h2>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label={t.refresh}
        >
          <Icon name="refresh" className={`size-3.5 ${loading ? "[animation:lens-spin_1s_linear_infinite]" : ""}`} />
          {t.refresh}
        </button>
      </div>

      {/* IP 主行 */}
      <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{t.ip}</p>
        {error ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 cursor-pointer text-left text-sm text-bad underline underline-offset-4"
          >
            {t.netError}
          </button>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className={`font-mono text-[19px] font-semibold tracking-tight text-ink ${loading ? "opacity-50" : ""}`}>
              {info?.ip ?? "—"}
            </span>
            <button
              type="button"
              onClick={copyIp}
              disabled={!info}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <Icon name={copied ? "check" : "copy"} className="size-3.5" />
              {copied ? t.copied : t.copy}
            </button>
          </div>
        )}
        {loading && !info && <p className="mt-1 text-xs text-muted">{t.loadingNet}</p>}
      </div>

      {/* 明细 */}
      <dl className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <dt className="flex shrink-0 items-center gap-2 text-[13px] text-muted">
              <Icon name={r.icon} className="size-[15px]" />
              {r.label}
            </dt>
            <dd className="min-w-0 text-right text-[13px] font-medium text-ink-2 [overflow-wrap:anywhere]">
              {r.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
