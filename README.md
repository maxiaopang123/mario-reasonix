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
  <a href="#-quick-start">Quick Start</a>
  &nbsp;·&nbsp;
  <a href="#%EF%B8%8F-configuration">Configuration</a>
  &nbsp;·&nbsp;
  <a href="#-文档">文档</a>
</p>

<br/>

> **🍴 个人 Fork** — 基于 [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) `main-v2` 分支，
> 专注于 **Mac 桌面版** 的构建与日常使用。CLI + Wails 桌面双模式。

<br/>

## ✨ Features

- **Config-driven.** 所有配置（Provider、Agent、Tools、Plugins）声明在 `reasonix.toml`，无需硬编码
- **Multi-model.** 原生 DeepSeek 支持，兼容任何 OpenAI 格式的 API 端点
- **Plugin-driven.** 通过 stdio JSON-RPC 支持 MCP 插件扩展
- **Desktop + CLI 双模式.** 同一套 Go 内核，终端和桌面 GUI 两不误
- **Zero-friction 单二进制.** `CGO_ENABLED=0` 编译，无外部依赖

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

- ⬆ **上游：** [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix) — 原项目主仓库，所有核心开发在此进行
- 📦 **本仓库：** [`maxiaopang123/mario-reasonix`](https://github.com/maxiaopang123/mario-reasonix) — 个人 fork，桌面构建优化

<br/>

---

<p align="center">
  <sub>MIT License — see <a href="./LICENSE">LICENSE</a></sub>
  <br/>
  <sub>Forked from <a href="https://github.com/esengine/DeepSeek-Reasonix">esengine/DeepSeek-Reasonix</a></sub>
</p>
