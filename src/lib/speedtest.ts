/* 真实测速与网络信息读取：只依赖公开的边缘节点接口，全部在浏览器端完成 */

const BASE = "https://speed.cloudflare.com";

export type NetInfo = {
  ip: string;
  city: string;
  country: string;
  region: string;
  isp: string;
  asn: number | null;
  colo: string;
  timezone: string;
};

export type Sample = { mbps: number; at: number };

/** 把接口返回值统一收敛成字符串（接口字段可能是对象或缺省） */
function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["city", "name", "region", "cca2", "code"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return "";
}

/** 网络信息：ipwho.is 为主（字段稳定、CORS 开放），Cloudflare meta 仅用于补充接入节点与 ASN */
export async function fetchNetInfo(signal?: AbortSignal): Promise<NetInfo> {
  const [whoRes, metaRes] = await Promise.allSettled([
    fetch("https://ipwho.is/", { cache: "no-store", signal }).then((r) => r.json()),
    fetch(`${BASE}/meta`, { cache: "no-store", signal }).then((r) => r.json()),
  ]);

  const who = whoRes.status === "fulfilled" ? (whoRes.value as Record<string, unknown>) : null;
  const meta = metaRes.status === "fulfilled" ? (metaRes.value as Record<string, unknown>) : null;

  if (!who || who.success === false || !asText(who.ip)) {
    if (!meta || !asText(meta.clientIp ?? meta.ip)) throw new Error("no network info");
    return {
      ip: asText(meta.clientIp ?? meta.ip),
      city: asText(meta.city),
      country: asText(meta.country),
      region: asText(meta.region),
      isp: asText(meta.asOrganization),
      asn: typeof meta.asn === "number" ? meta.asn : null,
      colo: asText(meta.colo),
      timezone: asText(meta.timezone),
    };
  }

  const conn = (who.connection ?? {}) as Record<string, unknown>;
  const tz = (who.timezone ?? {}) as Record<string, unknown>;

  return {
    ip: asText(who.ip),
    city: asText(who.city),
    country: asText(who.country),
    region: asText(who.region),
    isp: asText(conn.isp) || asText(conn.org),
    asn: conn.asn ? Number(conn.asn) || null : null,
    colo: meta ? asText(meta.colo) : "",
    timezone: asText(tz.id),
  };
}

/** 延迟：向 0 字节资源发若干次请求，取中位数；抖动 = 相邻差值均值 */
export async function measureLatency(
  count = 8,
  signal?: AbortSignal,
): Promise<{ ping: number; jitter: number }> {
  const samples: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const t0 = performance.now();
    await fetch(`${BASE}/__down?bytes=0`, { cache: "no-store", signal });
    const dt = performance.now() - t0;
    if (i > 0) samples.push(dt); // 首个请求含建连，丢弃
  }
  samples.sort((a, b) => a - b);
  const ping = samples[Math.floor(samples.length / 2)] ?? 0;
  const diffs = samples.slice(1).map((v, i) => Math.abs(v - samples[i]));
  const jitter = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
  return { ping: Math.round(ping), jitter: Math.round(jitter * 10) / 10 };
}

/** 下载：流式读取固定字节数，边读边算瞬时速率 */
export async function measureDownload(
  bytes: number,
  onSample: (s: Sample, ratio: number) => void,
  signal?: AbortSignal,
): Promise<number> {
  const res = await fetch(`${BASE}/__down?bytes=${bytes}`, { cache: "no-store", signal });
  if (!res.body) throw new Error("stream unavailable");

  const reader = res.body.getReader();
  const t0 = performance.now();
  let received = 0;
  let lastAt = t0;
  let lastBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    const now = performance.now();
    if (now - lastAt > 120) {
      const mbps = ((received - lastBytes) * 8) / ((now - lastAt) / 1000) / 1e6;
      onSample({ mbps, at: now - t0 }, Math.min(1, received / bytes));
      lastAt = now;
      lastBytes = received;
    }
  }

  const seconds = (performance.now() - t0) / 1000;
  return (received * 8) / seconds / 1e6;
}

/** 上传：用 XHR 以便拿到上传进度 */
export function measureUpload(
  bytes: number,
  onProgress: (ratio: number, mbps: number) => void,
  signal?: AbortSignal,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const payload = new Uint8Array(bytes);
    const t0 = performance.now();

    xhr.open("POST", `${BASE}/__up`, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const seconds = (performance.now() - t0) / 1000;
      const mbps = seconds > 0 ? (e.loaded * 8) / seconds / 1e6 : 0;
      onProgress(e.loaded / e.total, mbps);
    };

    xhr.onload = () => {
      const seconds = (performance.now() - t0) / 1000;
      if (xhr.status >= 200 && xhr.status < 300) resolve((bytes * 8) / seconds / 1e6);
      else reject(new Error(`upload ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.onabort = () => reject(new Error("aborted"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(payload);
  });
}

/** 预连接：先发一个小请求，避免把 TLS 握手算进测速 */
export async function warmup(signal?: AbortSignal) {
  try {
    await fetch(`${BASE}/__down?bytes=1000`, { cache: "no-store", signal });
  } catch {
    /* 失败也继续，测量阶段会再报错 */
  }
}
