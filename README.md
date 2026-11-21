# IP Lens

一个自建的 IP 测速小工具：打开就能看到出口 IP、归属地与运营商，点一下就能真实测量下载 / 上传 / 延迟 / 抖动。中英双语、明暗双主题、无账号、无追踪。

## 启动

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # lint + typecheck + build
```

构建产物是纯静态页面，可直接部署到任何静态托管（Vercel / Cloudflare Pages / Nginx）。

## 功能

| 模块 | 说明 |
|---|---|
| 网络信息 | 出口 IP、归属地、运营商、ASN、接入节点、时区；支持一键复制 IP |
| 测速 | 真实传输：8 次延迟采样 → 10 MB 下载 → 4 MB 上传，实时显示速率与曲线 |
| 结果 | 下载 / 上传 / 延迟 / 抖动四项；一键复制为文本 |
| 历史 | 最近 5 次记录存在浏览器本地（localStorage），可清空 |
| 双语 | 中文 / English，首次访问按浏览器语言自动选择 |
| 主题 | 浅色 / 深色，跟随系统偏好，可手动切换 |

## 数据来源（全部为公开接口，浏览器直连）

- IP 与归属地：`https://ipwho.is/`（主）、`https://speed.cloudflare.com/meta`（补充接入节点与 ASN）
- 测速：`https://speed.cloudflare.com/__down?bytes=N`（下载 / 延迟）与 `__up`（上传）

> 这两个接口都是公开的、允许跨域的服务，适合个人与小流量使用。**若要公开、长期或商用部署，请先确认其服务条款与配额，或换成自建的测速节点与 IP 库**——本项目不含任何自有后端。

## 实现要点

- 下载用 `fetch` + `ReadableStream` 流式读取，按 120ms 窗口计算瞬时速率；上传用 `XMLHttpRequest` 以拿到 `upload.onprogress`。
- 延迟取 8 次 0 字节请求的中位数（丢弃首次建连），抖动取相邻样本差的均值。
- 测速前先做一次小请求预热，避免把 TLS 握手算进结果。
- 进度条按**已传输字节比例**推进，不是假动画。
- 所有状态存 `localStorage`：`iplens.theme` / `iplens.lang` / `iplens.history`。

## 目录

```
app/
  layout.tsx      元信息 + 主题预置脚本（防闪白）
  page.tsx        入口
  globals.css     设计 token（明/暗）+ 组件样式
src/
  components/lens/
    LensApp.tsx   状态编排与页面骨架
    SpeedCard.tsx 测速面板（指标 / 进度 / 曲线 / 操作）
    NetCard.tsx   网络信息
    HistoryCard.tsx 历史记录
    Sparkline.tsx 速率曲线
    i18n.ts       中英文案（改文案只改这里）
    icons.tsx     自绘图标
  lib/speedtest.ts 延迟 / 下载 / 上传测量
```

## 部署到 Cloudflare Pages

本工程是纯前端，可直接静态导出（`out/`），无需任何服务端。

**方式一：GitHub 联动（推荐，之后 push 即自动部署）**

1. 仓库推到 GitHub 后，在 Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git，选中该仓库；
2. 构建配置：
   - Framework preset：`Next.js (Static HTML Export)`
   - Build command：`npm run build:static`
   - Build output directory：`out`
   - 环境变量：`NODE_VERSION=22`
3. 部署完成后，在项目的 Custom domains 里绑定你的域名（Cloudflare 托管域名一键接入）。

仓库里已含 `.github/workflows/deploy-cloudflare-pages.yml`：若要改用 GitHub Actions 部署，在仓库 Settings → Secrets 里加上
`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 即可，push 到 main 自动发布。

**方式二：本地命令行直传**

```bash
npx wrangler login
npm run build:static
npx wrangler pages deploy out --project-name=ip-lens
```

`wrangler.toml` 已声明 `pages_build_output_dir = "out"`，也可直接 `npx wrangler pages deploy`。

## 说明

- 界面上的测速结果是**本机到最近边缘节点的真实值**，会受 Wi-Fi、运营商、跨网路由与节点距离影响；同一网络多次测试有波动是正常的。
- 本项目的名称、文案、配色、图标与版式均为原创，未使用任何第三方品牌素材。
