# RP-Viewer

本地原型在线查看及评论平台。自动扫描指定文件夹中的 Axure、墨刀等工具生成的原型，提供卡片式浏览、iframe 预览和 Figma 风格的定位评论功能。

## 界面预览

**首页 — 卡片式原型浏览**

![首页](docs/images/home.png)

**原型预览 — iframe 内嵌加载**

![原型预览](docs/images/preview.png)

**评论功能 — 点击定位评论**

![评论功能](docs/images/comment.png)

## 快速开始

### 1. 下载

从 [Releases](https://github.com/chenbin3625/RP-Viewer/releases) 下载对应平台的二进制文件：

| 平台 | 文件 |
|------|------|
| macOS (Apple Silicon) | `proto-viewer-*-darwin-arm64.tar.gz` |
| macOS (Intel) | `proto-viewer-*-darwin-amd64.tar.gz` |
| Linux (amd64) | `proto-viewer-*-linux-amd64.tar.gz` |
| Linux (arm64) | `proto-viewer-*-linux-arm64.tar.gz` |
| Windows (amd64) | `proto-viewer-*-windows-amd64.zip` |
| Windows (arm64) | `proto-viewer-*-windows-arm64.zip` |

### 2. 准备原型文件

将原型文件夹放入 `prototypes/` 目录（或修改 `config.yaml` 指向你的原型目录）：

```
prototypes/
├── 项目A/                    ← 分类文件夹
│   ├── README.md             ← 可选：第一行为标题，其余为描述
│   ├── icon.png              ← 可选：自定义图标
│   ├── 首页原型/              ← 原型文件夹（包含 index.html）
│   │   ├── index.html
│   │   └── ...
│   └── 后台管理/
│       ├── index.html
│       └── ...
└── 项目B/
    └── 数据看板/
        ├── index.html
        └── ...
```

**识别规则：**
- 包含 `index.html` 的文件夹 → 原型（可预览）
- 不包含 `index.html` 的文件夹 → 分类（可嵌套）
- 以 `.` 或 `_` 开头的文件夹会被忽略

**可选元数据：**
- `README.md` / `README.txt` → 第一行作为标题，其余作为描述
- `icon.png` / `icon.jpg` / `icon.svg` → 卡片自定义图标

### 3. 修改配置

编辑 `config.yaml`：

```yaml
# 原型文件的根目录
prototype_dir: ./prototypes

# 服务端口
port: 8080
```

### 4. 启动

```bash
./proto-viewer
```

浏览器打开 http://localhost:8080 即可。

指定配置文件：

```bash
./proto-viewer -config /path/to/config.yaml
```

## 功能说明

### 浏览原型
- 首页以卡片形式展示所有原型和分类
- 支持多级文件夹嵌套，面包屑导航
- 点击分类卡片进入下一层，点击原型卡片进入预览

### 预览原型
- iframe 内嵌加载原型，支持原型内部的所有交互
- 顶部工具栏提供返回、面包屑导航

### 评论功能
- **添加评论**：点击工具栏「评论」按钮进入评论模式，在原型上点击任意位置放置评论
- **查看评论**：蓝色圆形标记显示在原型上，点击可查看详情
- **编辑评论**：点击评论弹窗中的编辑图标可修改内容
- **回复评论**：每条评论底部有回复输入框，支持多条回复
- **管理评论**：标记已解决 / 删除
- **全部评论**：点击「全部评论」打开侧边栏，查看所有页面的评论，点击可跳转
- **评论模式只影响左键单击**，滚动、拖拽等操作不受影响
- **昵称**：点击用户名可设置昵称，留空为匿名
- 评论数据以 JSON 文件存储在各原型的 `.comments/` 目录中

## Docker 部署

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

通过环境变量自定义配置：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `PROTOTYPE_DIR` | `/data/prototypes` | 原型文件根目录 |
| `PORT` | `8080` | 服务端口 |

```bash
docker run -d \
  -p 9090:9090 \
  -e PORT=9090 \
  -v /path/to/prototypes:/data/prototypes \
  chenbin3625/rp-viewer
```

> 镜像支持 `linux/amd64` 和 `linux/arm64` 平台。

## 从源码构建

需要 Go 1.21+ 和 Node.js 22+：

```bash
make build        # 构建生产版本
make dev          # 开发模式（前后端热更新）
make clean        # 清理构建产物
```

## 技术栈

- **后端**：Go（net/http, embed）
- **前端**：React + TypeScript + Ant Design
- **部署**：单二进制文件，前端资源内嵌
