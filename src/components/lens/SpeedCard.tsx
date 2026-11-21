"use client";

import type { Sample } from "@/lib/speedtest";
import type { Copy } from "./i18n";
import { Icon } from "./icons";
import { Sparkline } from "./Sparkline";

export type Phase = "idle" | "latency" | "download" | "upload" | "done" | "error";

const SEGMENTS = 36;
const fmt = (v: number, digits = 1) => (v > 0 ? v.toFixed(digits) : "—");

export function SpeedCard({
  t,
  phase,
  live,
  result,
  progress,
  samples,
  bytesUsed,
  onStart,
  onStop,
  onCopy,
  copied,
}: {
  t: Copy;
  phase: Phase;
  live: { down: number; up: number; ping: number; jitter: number };
  result: { down: number; up: number; ping: number; jitter: number } | null;
  progress: number;
  samples: Sample[];
  bytesUsed: number;
  onStart: () => void;
  onStop: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const running = phase === "latency" || phase === "download" || phase === "upload";

  const phaseText =
    phase === "latency"
      ? t.phaseLatency
      : phase === "download"
        ? t.phaseDownload
        : phase === "upload"
          ? t.phaseUpload
          : phase === "done"
            ? t.phaseDone
            : phase === "error"
              ? t.phaseError
              : t.phaseIdle;

  const shown = result ?? { down: live.down, up: live.up, ping: live.ping, jitter: live.jitter };

  const tile = (
    key: "down" | "up" | "ping",
    label: string,
    icon: string,
    unit: string,
    digits = 1,
  ) => {
    const active =
      (key === "down" && phase === "download") ||
      (key === "up" && phase === "upload") ||
      (key === "ping" && phase === "latency");
    return (
      <div
        className={`rounded-2xl border p-4 transition-colors ${
          active
            ? "border-accent/60 bg-accent/5"
            : "border-line bg-surface-2"
        }`}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          <Icon name={icon} className="size-3.5" />
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="tnum text-[26px] font-semibold leading-none text-ink sm:text-[30px]">
            {key === "ping" ? (shown.ping ? Math.round(shown.ping) : "—") : fmt(shown[key], digits)}
          </span>
          <span className="text-[11px] text-muted">{unit}</span>
        </div>
        {key === "ping" && (
          <p className="mt-1 text-[11px] text-muted">
            {t.jitter} {shown.jitter ? `${shown.jitter.toFixed(1)} ${t.ms}` : "—"}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Icon name="pulse" className="size-[18px] text-accent" />
            {t.speedTest}
          </h2>
          <p className="mt-1 text-[13px] text-muted">{t.speedDesc}</p>
        </div>
        <span className="chip">
          <Icon name="down" className="size-3.5" />
          {t.usageNote} {(bytesUsed / 1e6).toFixed(1)} MB
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {tile("down", t.download, "down", t.mbps)}
        {tile("up", t.upload, "up", t.mbps)}
        {tile("ping", t.ping, "pulse", t.ms, 0)}
      </div>

      {/* 进度 */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-2 text-ink-2">
            <span
              className={`inline-flex size-1.5 rounded-full ${
                running
                  ? "animate-pulse-dot bg-accent-2"
                  : phase === "done"
                    ? "bg-good"
                    : phase === "error"
                      ? "bg-bad"
                      : "bg-muted/50"
              }`}
            />
            {phaseText}
          </span>
          <span className="tnum text-muted">{Math.round(progress)}%</span>
        </div>

        <div className="flex gap-[3px]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const filled = (i + 1) / SEGMENTS <= progress / 100 + 0.001;
            return (
              <span
                key={i}
                className={`h-2 flex-1 rounded-[2px] transition-colors duration-200 ${
                  filled ? "bg-accent" : "bg-surface-2"
                }`}
              />
            );
          })}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface-2 px-2 py-1">
          <Sparkline samples={samples} max={Math.max(shown.down, 1)} />
        </div>
      </div>

      {/* 操作 */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={running ? onStop : onStart}
          className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.99] ${
            running
              ? "border border-line bg-surface text-ink hover:bg-surface-2"
              : "grad-btn text-on-accent shadow-[0_10px_24px_-12px_var(--accent)] hover:brightness-105"
          }`}
        >
          <Icon name={running ? "stop" : "pulse"} className="size-4" />
          {running ? t.stop : result ? t.retest : t.start}
        </button>

        {result && !running && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Icon name={copied ? "check" : "copy"} className="size-4" />
            {copied ? t.resultCopied : t.copyResult}
          </button>
        )}

        {phase === "error" && <span className="text-[13px] text-bad">{t.errorHint}</span>}
      </div>
    </section>
  );
}
