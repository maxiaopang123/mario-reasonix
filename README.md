<p align="center">
  <img src="docs/logo.svg" alt="Mario-Reasonix" width="560"/>
</p>

<p align="center">
  <strong>Reasonix</strong> — 个人定制版 · Desktop-first
</p>

<p align="center">
  <a href="#-features">Features</a>
  &nbsp;·&nbsp;
  <a href="#-mac-构建">Mac 构建</a>
  &nbsp;·&nbsp;
  <a href="#-downloads">Downloads</a>
  &nbsp;·&nbsp;
  <a href="#-quick-start">Quick Start</a>
  &nbsp;·&nbsp;
  <a href="#%EF%B8%8F-configuration">Configuration</a>
  &nbsp;·&nbsp;
  <a href="#-文档">文档</a>
</p>

<br/>

> [!IMPORTANT]
> **🙏 本仓库是 [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 的个人 Fork**
>
> 本项目在 **Reasonix 原版** 基础上修改而来，仅做**个人学习和使用**用途。
> 所有核心代码、架构设计、功能逻辑均归属于 **Reasonix 原项目团队**。
>
> 原版项目：**[esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix)**
>
> 如果你喜欢这个项目，请给原仓库 ⭐ Star → 他们值得！

<br/>

## ✨ Features

- **Config-driven.** 所有配置（Provider、Agent、Tools、Plugins）声明在 `reasonix.toml`，无需硬编码
- **Multi-model.** 原生 DeepSeek 支持，兼容任何 OpenAI 格式的 API 端点
- **Plugin-driven.** 通过 stdio JSON-RPC 支持 MCP 插件扩展
- **Desktop + CLI 双模式.** 同一套 Go 内核，终端和桌面 GUI 两不误
- **Zero-friction 单二进制.** `CGO_ENABLED=0` 编译，无外部依赖

<br/>

## 📥 Downloads

预编译的安装包可在 Releases 页面下载：

| 文件 | 平台 | 说明 |
|------|------|------|
| `Reasonix-Mario-1.0.0-arm64.dmg` | macOS (Apple Silicon) | DMG 安装映像 — 双击安装 |
| `reasonix-mario-v1.0.0-amd64-installer.exe` | Windows x64 | NSIS 安装包（含 WebView2 运行时） |

> 🔗 前往 **[Releases →](https://github.com/maxiaopang123/mario-reasonix/releases)** 下载最新版本

<br/>

## 🍎 Mac 构建

### 前置条件

```bash
# 安装 Go
brew install go

# 安装 Node.js & pnpm
brew install node
npm install -g pnpm

# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 安装 Xcode Command Line Tools
xcode-select --install
```

### 构建桌面应用

```bash
cd desktop
pnpm install

# 构建 .app（Apple Silicon）
wails build -platform darwin/arm64

# 或构建 .dmg 安装包
wails build -platform darwin/arm64 -dmg
```

构建产物在 `desktop/build/bin/Reasonix-Mario.app`

### 仅 CLI（无需 GUI）

```bash
go build -o reasonix .
```

### 版本管理

版本号在 `desktop/VERSION` 中定义，构建脚本会自动注入：

```bash
cd desktop
./build-installer.sh 1.0.1   # 指定版本构建
```

<br/>

## 🚀 Quick Start

```bash
# 初始化配置
./reasonix setup

# 设置 API Key
export DEEPSEEK_API_KEY=sk-...

# 交互模式
./reasonix

# 单次运行
./reasonix run "解释这段代码的功能"
echo "explain this code" | ./reasonix run
```

<br/>

## ⚙️ Configuration

最小配置 `reasonix.toml`：

```toml
default_model = "deepseek-flash"

[[providers]]
name        = "deepseek-flash"
kind        = "openai"
base_url    = "https://api.deepseek.com"
model       = "deepseek-v4-flash"
api_key_env = "DEEPSEEK_API_KEY"
```

配置优先级：**命令行参数 > `./reasonix.toml` > `~/.reasonix/config.toml` > 内置默认值**

<br/>

## 📖 文档

| 文档 | 说明 |
|------|------|
| [完整指南](./docs/GUIDE.md) | 配置、权限、插件(MCP)、斜杠命令等 |
| [技术规格](./docs/SPEC.md) | 架构、注册表、数据类型与路线图 |
| [原版仓库](https://github.com/esengine/DeepSeek-Reasonix) | 上游项目，获取最新更新 |

<br/>

## 🔗 相关仓库

| 仓库 | 说明 |
|------|------|
| ⬆️ **上游原版** [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix) | 🏆 Reasonix 核心项目 — 所有 AI 引擎、插件系统、架构设计均源于此 |
| 📦 **本 Fork** [`maxiaopang123/mario-reasonix`](https://github.com/maxiaopang123/mario-reasonix) | 个人桌面构建优化版，仅做配置与打包调整 |

> 💡 **本仓库不包含任何原创 AI 功能**，所有智能体逻辑、Token 优化、MCP 插件系统均为原版 Reasonix 团队的成果。

<br/>

---

<p align="center">
  <sub>MIT License — see <a href="./LICENSE">LICENSE</a></sub>
  <br/>
  <sub><strong>Forked from</strong> <a href="https://github.com/esengine/DeepSeek-Reasonix">esengine/DeepSeek-Reasonix</a></sub>
  <br/>
  <sub>🏅 原创项目 · 值得 Star → <a href="https://github.com/esengine/DeepSeek-Reasonix">github.com/esengine/DeepSeek-Reasonix</a></sub>
</p>
