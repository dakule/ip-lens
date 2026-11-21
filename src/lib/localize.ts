/* 网络信息本地化：仅当 IP 归属中国时，把上游的英文取值转成中文。
   外国 IP 一律保持英文原文，避免出现中英混排。 */

import type { NetInfo } from "./speedtest";

/** Cloudflare 接入节点（IATA 代码）→ 中文城市名 */
const COLO_ZH: Record<string, string> = {
  // 亚太
  HKG: "香港", TPE: "台北", NRT: "东京", HND: "东京", KIX: "大阪", NGO: "名古屋",
  ICN: "首尔", SIN: "新加坡", BKK: "曼谷", KUL: "吉隆坡", CGK: "雅加达",
  MNL: "马尼拉", SGN: "胡志明市", HAN: "河内", DEL: "新德里", BOM: "孟买",
  MAA: "金奈", BLR: "班加罗尔", CMB: "科伦坡", KHI: "卡拉奇", DAC: "达卡",
  SYD: "悉尼", MEL: "墨尔本", BNE: "布里斯班", PER: "珀斯", AKL: "奥克兰",
  // 北美
  LAX: "洛杉矶", SJC: "圣何塞", SFO: "旧金山", SEA: "西雅图", PDX: "波特兰",
  SAN: "圣地亚哥", LAS: "拉斯维加斯", PHX: "凤凰城", DEN: "丹佛", SLC: "盐湖城",
  DFW: "达拉斯", IAH: "休斯顿", AUS: "奥斯汀", ORD: "芝加哥", MSP: "明尼阿波利斯",
  DTW: "底特律", ATL: "亚特兰大", MIA: "迈阿密", IAD: "华盛顿", EWR: "纽瓦克",
  JFK: "纽约", BOS: "波士顿", PHL: "费城", YYZ: "多伦多", YVR: "温哥华",
  YUL: "蒙特利尔", CAL: "卡尔加里", MEX: "墨西哥城",
  // 南美
  GRU: "圣保罗", GIG: "里约热内卢", EZE: "布宜诺斯艾利斯", SCL: "圣地亚哥",
  LIM: "利马", BOG: "波哥大",
  // 欧洲
  LHR: "伦敦", MAN: "曼彻斯特", DUB: "都柏林", AMS: "阿姆斯特丹",
  FRA: "法兰克福", MUC: "慕尼黑", BER: "柏林", DUS: "杜塞尔多夫",
  CDG: "巴黎", MRS: "马赛", MAD: "马德里", BCN: "巴塞罗那", LIS: "里斯本",
  MXP: "米兰", FCO: "罗马", ZRH: "苏黎世", VIE: "维也纳", CPH: "哥本哈根",
  ARN: "斯德哥尔摩", OSL: "奥斯陆", HEL: "赫尔辛基", WAW: "华沙",
  PRG: "布拉格", BUD: "布达佩斯", ATH: "雅典", IST: "伊斯坦布尔",
  SOF: "索非亚", BUH: "布加勒斯特", KBP: "基辅", SVO: "莫斯科", LED: "圣彼得堡",
  // 中东 / 非洲
  DXB: "迪拜", DOH: "多哈", RUH: "利雅得", TLV: "特拉维夫", CAI: "开罗",
  JNB: "约翰内斯堡", CPT: "开普敦", LOS: "拉各斯", NBO: "内罗毕",
};

/** 常见运营商品牌：命中即用中文名 */
const ISP_BRANDS: { re: RegExp; zh: string }[] = [
  { re: /china\s*telecom|chinatelecom/i, zh: "中国电信" },
  { re: /china\s*unicom|china\s*netcom|cnc\s*group|china169/i, zh: "中国联通" },
  { re: /china\s*mobile|cmnet|chinamobile/i, zh: "中国移动" },
  { re: /cernet|china\s*education\s*(and|&)?\s*research/i, zh: "中国教育和科研计算机网" },
  { re: /cstnet/i, zh: "中国科技网" },
  { re: /alibaba|aliyun/i, zh: "阿里云" },
  { re: /tencent/i, zh: "腾讯云" },
  { re: /baidu/i, zh: "百度云" },
  { re: /huawei|hwclouds/i, zh: "华为云" },
  { re: /kingsoft|jinshan/i, zh: "金山云" },
  { re: /ucloud/i, zh: "优刻得" },
  { re: /dr\.?\s*peng/i, zh: "鹏博士" },
  { re: /broadnet|china\s*broadnet/i, zh: "中国广电" },
];

const NOISE = /\b(networks?|broadband|internet|backbone|communication|communications|telecom\s*group|co\.?,?\s*ltd\.?|ltd\.?|inc\.?|corp\.?|corporation|company|group|data|services?)\b/gi;

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 从运营商字符串里认出品牌，返回中文名 */
export function detectBrand(raw: string): string {
  if (!raw) return "";
  for (const b of ISP_BRANDS) {
    if (b.re.test(raw)) return b.zh;
  }
  return "";
}

export type IspCtx = {
  cityEn?: string;
  cityZh?: string;
  regionEn?: string;
  regionZh?: string;
};

/** 运营商名中文化：先换地名、再换品牌、再清掉 noise，实在不行退化成品名 */
export function zhIsp(raw: string, ctx: IspCtx = {}): string {
  if (!raw) return "";

  let s = raw;
  if (ctx.cityEn && ctx.cityZh && ctx.cityEn !== ctx.cityZh) {
    s = s.replace(new RegExp(escRe(ctx.cityEn), "gi"), ctx.cityZh);
  }
  if (ctx.regionEn && ctx.regionZh && ctx.regionEn !== ctx.cityEn) {
    s = s.replace(new RegExp(escRe(ctx.regionEn), "gi"), ctx.regionZh);
  }
  for (const b of ISP_BRANDS) {
    if (b.re.test(s)) {
      s = s.replace(new RegExp(b.re.source, "gi"), b.zh);
      break;
    }
  }

  s = s.replace(NOISE, " ").replace(/[,\s]+/g, " ").trim();

  // 仍有成段英文（说明是没收录的企业名）→ 退化成品名，城市由「归属地」那行展示，不重复
  if (/[A-Za-z]{4,}/.test(s)) {
    const brand = detectBrand(raw);
    if (brand) return brand;
  }

  // 城市落在末尾时收成「品牌（城市）」，比"中国联通 上海"自然
  if (ctx.cityZh && s.endsWith(ctx.cityZh)) {
    const head = s.slice(0, -ctx.cityZh.length).replace(/[·,\s]+$/, "").trim();
    if (head) return `${head}（${ctx.cityZh}）`;
  }

  return s || raw;
}

/** 接入节点：LAX → 洛杉矶（LAX）；没收录就原样返回 */
export function zhColo(colo: string): string {
  if (!colo) return "";
  const code = colo.toUpperCase();
  const zh = COLO_ZH[code];
  return zh ? `${zh}（${code}）` : colo;
}

/** 时区 ID → 中文名，交给 Intl 处理，Asia/Shanghai → 中国标准时间 */
export function zhTimeZone(tzId: string): string {
  if (!tzId) return "";
  try {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone: tzId,
      timeZoneName: "long",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) return name;
  } catch {
    /* 时区不合法就退回原始 ID */
  }
  return tzId;
}

/** 统一把 NetInfo 转成「该显示什么」，中国 IP 走中文，其余走原文 */
export function presentNet(info: NetInfo) {
  const isCN = (info.countryCode ?? "").toUpperCase() === "CN";

  const city = isCN ? info.cityZh || info.city : info.city;
  const country = isCN ? info.countryZh || info.country : info.country;
  const isp = isCN
    ? zhIsp(info.isp, {
        cityEn: info.city,
        cityZh: info.cityZh,
        regionEn: info.region,
        regionZh: info.regionZh,
      })
    : info.isp;
  const brand = isCN ? detectBrand(info.isp) : "";

  return {
    isCN,
    location: [city, country].filter(Boolean).join(" · "),
    isp,
    asn: info.asn ? `AS${info.asn}${brand ? ` · ${brand}` : ""}` : "",
    colo: isCN ? zhColo(info.colo) : info.colo,
    timezone: isCN ? zhTimeZone(info.timezone) : info.timezone,
    /** 顶部 chip 用的一行摘要：城市 + 品牌（没有品牌才用完整服务商名） */
    short: [city, brand || isp].filter(Boolean).join(" · "),
  };
}
