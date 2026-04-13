# RP-Viewer

本地原型在线查看及评论平台。自动扫描 Axure、墨刀等工具生成的原型，提供卡片式浏览、iframe 预览和定位评论功能。

## 快速开始

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

浏览器打开 http://localhost:8080 即可。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PROTOTYPE_DIR` | `/data/prototypes` | 原型文件根目录 |
| `PORT` | `8080` | 服务端口 |

```bash
docker run -d \
  -p 9090:9090 \
  -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

## Docker Compose

```yaml
services:
  rp-viewer:
    image: chenbin3625/rp-viewer:latest
    ports:
      - "8080:8080"
    volumes:
      - ./prototypes:/data/prototypes
```

## 原型目录结构

将原型文件夹挂载到容器的 `/data/prototypes`：

```
prototypes/
├── 项目A/
│   ├── README.md          # 可选：第一行为标题
│   ├── icon.png           # 可选：自定义图标
│   └── 首页原型/
│       ├── index.html     # 包含 index.html → 识别为原型
│       └── ...
└── 项目B/
    └── 数据看板/
        ├── index.html
        └── ...
```

## 支持平台

- `linux/amd64`
- `linux/arm64`

## 源码

[GitHub - chenbin3625/RP-Viewer](https://github.com/chenbin3625/RP-Viewer)
