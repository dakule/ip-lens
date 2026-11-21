"use client";

import type { Copy } from "./i18n";
import { Icon } from "./icons";

export type RunResult = {
  at: number;
  down: number;
  up: number;
  ping: number;
  jitter: number;
};

export function HistoryCard({
  t,
  items,
  onClear,
}: {
  t: Copy;
  items: RunResult[];
  onClear: () => void;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Icon name="clock" className="size-[18px] text-accent" />
          {t.history}
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-bad"
          >
            <Icon name="trash" className="size-3.5" />
            {t.clear}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[13px] text-muted">
          {t.historyEmpty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((r) => {
            const d = new Date(r.at);
            const time = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
              d.getHours(),
            ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            return (
              <li
                key={r.at}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-[12px]"
              >
                <span className="tnum shrink-0 text-muted">{time}</span>
                <span className="flex items-center gap-3 tnum">
                  <span className="flex items-center gap-1 text-ink-2" title={`${t.download} (${t.mbps})`}>
                    <Icon name="down" className="size-3 text-accent" />
                    {r.down.toFixed(0)}
                    <span className="text-[10px] text-muted">M</span>
                  </span>
                  <span className="flex items-center gap-1 text-ink-2" title={`${t.upload} (${t.mbps})`}>
                    <Icon name="up" className="size-3 text-accent-2" />
                    {r.up.toFixed(0)}
                    <span className="text-[10px] text-muted">M</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted" title={`${t.ping} (${t.ms})`}>
                    <Icon name="pulse" className="size-3" />
                    {Math.round(r.ping)}
                    <span className="text-[10px]">ms</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
