"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dict, type Lang } from "./i18n";
import { Icon } from "./icons";
import { NetCard } from "./NetCard";
import { SpeedCard, type Phase } from "./SpeedCard";
import { HistoryCard, type RunResult } from "./HistoryCard";
import {
  fetchNetInfo,
  measureDownload,
  measureLatency,
  measureUpload,
  warmup,
  type NetInfo,
  type Sample,
} from "@/lib/speedtest";

const DOWN_BYTES = 10_000_000;
const UP_BYTES = 4_000_000;

export function LensApp() {
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [info, setInfo] = useState<NetInfo | null>(null);
  const [netLoading, setNetLoading] = useState(true);
  const [netError, setNetError] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [live, setLive] = useState({ down: 0, up: 0, ping: 0, jitter: 0 });
  const [samples, setSamples] = useState<Sample[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [bytesUsed, setBytesUsed] = useState(0);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const t = dict[lang];

  /* ---------- 初始化：语言 / 主题 / 历史 ---------- */
  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem("iplens.lang");
      if (savedLang === "zh" || savedLang === "en") setLang(savedLang);
      else if (!navigator.language.toLowerCase().startsWith("zh")) setLang("en");

      const savedTheme = window.localStorage.getItem("iplens.theme");
      setTheme(
        savedTheme === "dark" || savedTheme === "light"
          ? savedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light",
      );

      const raw = window.localStorage.getItem("iplens.history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 5));
      }
    } catch {
      /* 存储不可用时用默认值 */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    try {
      window.localStorage.setItem("iplens.theme", theme);
      window.localStorage.setItem("iplens.lang", lang);
    } catch {
      /* 忽略 */
    }
  }, [theme, lang]);

  /* ---------- 网络信息 ---------- */
  const loadNet = useCallback(async () => {
    setNetLoading(true);
    setNetError(false);
    try {
      setInfo(await fetchNetInfo());
    } catch {
      setNetError(true);
    } finally {
      setNetLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNet();
  }, [loadNet]);

  /* ---------- 测速 ---------- */
  const runTest = useCallback(async () => {
    if (phase === "latency" || phase === "download" || phase === "upload") {
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPhase("latency");
    setProgress(4);
    setSamples([]);
    setLive({ down: 0, up: 0, ping: 0, jitter: 0 });
    setResult(null);
    setBytesUsed(0);
    setCopied(false);

    try {
      await warmup(ac.signal);

      const { ping, jitter } = await measureLatency(8, ac.signal);
      setLive((p) => ({ ...p, ping, jitter }));
      setBytesUsed((b) => b + 20_000);
      setProgress(18);

      setPhase("download");
      const down = await measureDownload(
        DOWN_BYTES,
        (s, ratio) => {
          setSamples((prev) => [...prev, s]);
          setLive((p) => ({ ...p, down: s.mbps }));
          setProgress(18 + ratio * 54);
          setBytesUsed(20_000 + ratio * DOWN_BYTES);
        },
        ac.signal,
      );
      setBytesUsed(20_000 + DOWN_BYTES);
      setLive((p) => ({ ...p, down }));
      setProgress(72);

      setPhase("upload");
      const up = await measureUpload(
        UP_BYTES,
        (ratio, mbps) => {
          setLive((p) => ({ ...p, up: mbps }));
          setProgress(72 + ratio * 26);
          setBytesUsed(20_000 + DOWN_BYTES + ratio * UP_BYTES);
        },
        ac.signal,
      );
      setBytesUsed(20_000 + DOWN_BYTES + UP_BYTES);
      setLive((p) => ({ ...p, up }));
      setProgress(100);
      setPhase("done");

      const run: RunResult = { at: Date.now(), down, up, ping, jitter };
      setResult(run);
      setHistory((prev) => {
        const next = [run, ...prev].slice(0, 5);
        try {
          window.localStorage.setItem("iplens.history", JSON.stringify(next));
        } catch {
          /* 忽略 */
        }
        return next;
      });
    } catch {
      if (ac.signal.aborted) {
        setPhase("idle");
        setProgress(0);
      } else {
        setPhase("error");
      }
    }
  }, [phase]);

  const copyResult = async () => {
    if (!result) return;
    const text = `${t.download} ${result.down.toFixed(1)} ${t.mbps} · ${t.upload} ${result.up.toFixed(
      1,
    )} ${t.mbps} · ${t.ping} ${Math.round(result.ping)} ${t.ms} · ${t.jitter} ${result.jitter.toFixed(
      1,
    )} ${t.ms}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 忽略 */
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon name="lens" className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight">{t.brand}</span>
              <span className="hidden text-[11px] text-muted sm:block">{t.tagline}</span>
            </span>
          </a>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLang((l) => (l === "zh" ? "en" : "zh"))}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink-2 transition-colors hover:border-accent hover:text-accent"
              aria-label="Switch language"
            >
              <Icon name="lang" className="size-4" />
              {t.langLabel}
            </button>
            <button
              type="button"
              onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
              className="grid size-9 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:border-accent hover:text-accent"
              aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* 标题区 */}
        <div className="animate-fade">
          <div className="chip">
            <span className="inline-flex size-1.5 rounded-full bg-good" />
            <span className="max-w-[70vw] truncate">
              {info ? `${info.city} · ${info.isp}` : netError ? t.netError : t.loadingNet}
            </span>
          </div>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.15] tracking-tight sm:text-[42px]">
            {t.heroTitle}
            <span className="grad-text">{t.heroTitleAccent}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">
            {t.heroDesc}
          </p>
        </div>

        {/* 主体 */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="grid gap-4">
            <SpeedCard
              t={t}
              phase={phase}
              live={live}
              result={result}
              progress={progress}
              samples={samples}
              bytesUsed={bytesUsed}
              onStart={runTest}
              onStop={runTest}
              onCopy={copyResult}
              copied={copied}
            />
            <div className="lg:hidden">
              <NetCard t={t} info={info} loading={netLoading} error={netError} onRetry={loadNet} />
            </div>
          </div>

          <div className="hidden gap-4 lg:grid">
            <NetCard t={t} info={info} loading={netLoading} error={netError} onRetry={loadNet} />
            <HistoryCard t={t} items={history} onClear={() => { setHistory([]); try { window.localStorage.removeItem("iplens.history"); } catch {} }} />
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <HistoryCard t={t} items={history} onClear={() => { setHistory([]); try { window.localStorage.removeItem("iplens.history"); } catch {} }} />
        </div>

        {/* 说明 */}
        <section className="mt-8 rounded-2xl border border-line bg-bg-soft p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <Icon name="info" className="size-4 text-accent" />
            {t.aboutTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2">
            {t.about.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent/60" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="text-center text-[12px] text-muted">{t.footer}</p>
      </footer>
    </div>
  );
}
