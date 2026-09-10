# RP-Viewer

A self-hosted prototype review platform. It automatically scans prototype folders exported from tools like Axure and Mockplus, then serves them with card-based browsing, iframe preview, and Figma-style pinned comments. It is built for design and product teams who need to share clickable prototypes internally and collect feedback in one place, without sending files around.

![Home - card-based browsing of prototypes](https://raw.githubusercontent.com/chenbin3625/RP-Viewer/main/docs/images/home.png)

![Preview - iframe embedded rendering](https://raw.githubusercontent.com/chenbin3625/RP-Viewer/main/docs/images/preview.png)

## Quick Start

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

Then open http://localhost:8080.

To serve on a different port, override `PORT` and publish the matching port:

```bash
docker run -d \
  -p 9090:9090 \
  -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

## Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Most recent tagged release. |
| `X.Y.Z` | Exact release version, for pinning a specific build. |
| `X.Y` | Latest patch release of a minor line. |
| `X` | Latest release of a major line. |

All tags are published as multi-arch images for `linux/amd64` and `linux/arm64`, so the same tag works on both x86-64 servers and ARM hosts. The image runs as a non-root user and ships with a built-in `HEALTHCHECK` that probes `/healthz`.

## Key Features

- Scans the prototype directory automatically; categories and prototypes are shown as cards.
- Multi-level folder nesting with breadcrumb navigation.
- A folder containing `index.html` is detected as a **prototype** (previewable); otherwise it is treated as a **category** (nestable).
- Folders starting with `.` or `_` are hidden.
- Optional per-folder metadata: `README.md` / `README.txt` (first line as title, rest as description) and `icon.png` / `icon.jpg` / `icon.svg` (custom card icon).
- Prototypes load in an embedded iframe with full interactivity, and SPA-style hash navigation inside the iframe is tracked automatically.
- Figma-style pinned comments: drop a pin by clicking anywhere on the prototype, reply in threads, edit, resolve or delete, and browse everything from an all-comments sidebar.
- Comment mode only captures left-clicks, so scrolling and dragging still pass through to the prototype.
- Comments persist as JSON files under each prototype's `.comments/` directory.
- Path-traversal protection on all file access, `.comments` blocked from HTTP access, 1 MB request-body cap, gzip compression and cache headers for static assets.

## Configuration

RP-Viewer reads `config.yaml` by default. **Environment variables override the config file, which overrides the defaults.**

```yaml
# Root directory for prototype files
prototype_dir: ./prototypes

# Server port
port: 8080
```

| Source | `prototype_dir` | `port` |
|--------|-----------------|--------|
| Default | `./prototypes` | `8080` |
| Config file | `prototype_dir` | `port` |
| Environment variable | `PROTOTYPE_DIR` | `PORT` |

The published image already sets `PROTOTYPE_DIR=/data/prototypes` and `PORT=8080`, so overriding the port is simply:

```bash
docker run -d -p 9090:9090 -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

## Mounting Prototypes

Mount your local prototype folder onto `/data/prototypes`, which is the image's default `prototype_dir`:

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

The mounted directory is scanned recursively, so you can nest categories and prototypes as deeply as you like:

```
prototypes/
├── ProjectA/                  ← Category folder
│   ├── README.md              ← Optional: title + description
│   ├── icon.png               ← Optional: custom icon
│   ├── Homepage/              ← Prototype folder (contains index.html)
│   │   ├── index.html
│   │   └── ...
│   └── Admin/
│       ├── index.html
│       └── ...
└── ProjectB/
    └── Dashboard/
        ├── index.html
        └── ...
```

Comments are written back into the mount as JSON files under each prototype's `.comments/` directory, so mount a directory the container user can write to if you want comments to persist across container restarts.

## Links

- GitHub: https://github.com/chenbin3625/RP-Viewer
- Releases: https://github.com/chenbin3625/RP-Viewer/releases

---

# 中文

一个自托管原型评审平台。可自动扫描 Axure、墨刀等工具导出的原型目录，提供卡片式浏览、iframe 预览和类 Figma 的定点评论能力。适合需要在内部共享可点击原型并集中收集反馈的设计与产品团队，无需来回传输文件。

![首页 - 卡片式浏览原型](https://raw.githubusercontent.com/chenbin3625/RP-Viewer/main/docs/images/home.png)

![原型预览 - iframe 内嵌加载](https://raw.githubusercontent.com/chenbin3625/RP-Viewer/main/docs/images/preview.png)

## 快速开始

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

浏览器打开 http://localhost:8080 即可。

如需更换端口，覆盖 `PORT` 并映射对应端口：

```bash
docker run -d \
  -p 9090:9090 \
  -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

## 镜像标签

| 标签 | 说明 |
|-----|-------------|
| `latest` | 最新的正式发布版本。 |
| `X.Y.Z` | 精确的发布版本，用于固定某个构建。 |
| `X.Y` | 某个次版本线的最新补丁版本。 |
| `X` | 某个主版本线的最新版本。 |

所有标签均为多架构镜像，同时支持 `linux/amd64` 与 `linux/arm64`，同一个标签在 x86-64 服务器与 ARM 主机上都能直接使用。镜像以非 root 用户运行，并内置探测 `/healthz` 的 `HEALTHCHECK`。

## 核心功能

- 自动扫描原型目录，分类与原型以卡片形式展示。
- 支持多级文件夹嵌套，面包屑导航。
- 包含 `index.html` 的文件夹识别为**原型**（可预览），否则为**分类**（可嵌套）。
- 以 `.` 或 `_` 开头的文件夹会被隐藏。
- 可选的文件夹元数据：`README.md` / `README.txt`（第一行作为标题，其余作为描述）、`icon.png` / `icon.jpg` / `icon.svg`（自定义卡片图标）。
- 原型以 iframe 内嵌加载，保留全部交互能力，并自动跟踪 iframe 内部的 SPA 哈希导航。
- 类 Figma 的定点评论：进入评论模式后点击原型任意位置即可放置标记，支持回复线程、编辑、标记已解决、删除，并可通过全部评论侧边栏浏览。
- 评论模式仅捕获左键单击，滚动、拖拽等操作仍透传给原型。
- 评论以 JSON 文件持久化在每个原型的 `.comments/` 目录中。
- 所有文件访问均防路径穿越，`.comments` 目录禁止通过 HTTP 访问，请求体上限 1 MB，静态资源启用 gzip 压缩与缓存头。

## 配置

RP-Viewer 默认读取 `config.yaml`。**环境变量优先于配置文件，配置文件优先于默认值。**

```yaml
# 原型文件根目录
prototype_dir: ./prototypes

# 服务端口
port: 8080
```

| 来源 | `prototype_dir` | `port` |
|--------|-----------------|--------|
| 默认 | `./prototypes` | `8080` |
| 配置文件 | `prototype_dir` | `port` |
| 环境变量 | `PROTOTYPE_DIR` | `PORT` |

已发布的镜像已预设 `PROTOTYPE_DIR=/data/prototypes` 与 `PORT=8080`，因此修改端口只需：

```bash
docker run -d -p 9090:9090 -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

## 挂载原型

将本机的原型目录挂载到 `/data/prototypes`，也就是镜像默认的 `prototype_dir`：

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

挂载目录会被递归扫描，因此分类与原型可以任意层级嵌套：

```
prototypes/
├── ProjectA/                  ← 分类文件夹
│   ├── README.md              ← 可选：标题与描述
│   ├── icon.png               ← 可选：自定义图标
│   ├── Homepage/              ← 原型文件夹（含 index.html）
│   │   ├── index.html
│   │   └── ...
│   └── Admin/
│       ├── index.html
│       └── ...
└── ProjectB/
    └── Dashboard/
        ├── index.html
        └── ...
```

评论会以 JSON 文件写回挂载目录中每个原型的 `.comments/` 目录，因此若希望评论在容器重启后依然保留，请挂载容器用户可以写入的目录。

## 链接

- GitHub: https://github.com/chenbin3625/RP-Viewer
- Releases: https://github.com/chenbin3625/RP-Viewer/releases
