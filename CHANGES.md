# Reasonix 定制修改记录

> 基于 [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix)（MIT License）的二次开发记录。

---

## 功能一览

| 功能 | 分类 | 文件 |
|------|------|------|
| Mermaid 图表渲染 | Chat 面板 | `MermaidDiagram.tsx` |
| HTML 代码块渲染 | Chat 面板 | `HtmlBlock.tsx` |
| 独立文件预览面板 | 布局 | `FilePreviewPane.tsx` |
| HTML 选中元素 → 输入框卡片 | Composer | `WorkspacePanel.tsx`, `Composer.tsx` |
| Tab 切换加速 | 性能 | `tabs.go`, `useController.ts` |
| 用户全局规则注入 | System Prompt | `boot.go` |
| Reasonix-Mario 品牌 | 打包 | `wails.json`, `main.go`, NSIS 安装包 |

---

## 详细改动

### 🆕 新增组件

#### `MermaidDiagram.tsx`
- Chat 面板中 mermaid 代码块自动渲染为图表
- 浮动工具栏（hover 显示）：预览/源码切换、复制源码、下载 SVG
- 下载 SVG 直接保存到工作区（调用后端 `SaveAssetToWorkspace`）

#### `HtmlBlock.tsx`
- Chat 面板中 ` ```html ` 代码块自动渲染为网页预览
- 预览/源码切换（浮动工具栏，hover 显示）
- sandbox iframe + postMessage 自适应高度，最大 600px 后出滚动条

#### `FilePreviewPane.tsx`
- 独立文件预览面板，位于 chat 和 workspace 之间
- 支持所有文件类型：HTML / 图片 / PDF / Markdown（富文本）/ 代码（语法高亮）/ 二进制
- HTML 预览带选中元素功能：DevTools 风格 hover 高亮 → click 选中 → 填入输入框彩色卡片
- 支持可拖拽调宽、双击重置（360px）、最大化/关闭

---

### ✏️ 后端改动（Go）

#### `desktop/app.go`
- **`dirTokenStore`**：新增目录型静态服务，HTML 文件里的相对资源（`./style.css`、`./app.js`）可正常加载
- **`PreviewHtmlFile(rel string) FilePreview`**：为 HTML 文件生成目录型 URL + 读取源码
- **`SaveAssetToWorkspace(filename, payload string, base64Encoded bool) (string, error)`**：不弹对话框，直接保存文件到当前工作区，文件名做 basename 净化防路径逃逸
- **`workspaceMediaMiddleware`**：新增 `/__reasonix_workspace_dir/<token>/` 路由，支持目录型静态文件服务
- **`MetaForTab`**：`GitBranch` 改为返回空字符串，避免每次切 tab 都运行 git 命令造成延迟

#### `desktop/tabs.go`
- **`SetActiveTab`**：磁盘写入改为 `go saveTabsWrite(...)`（异步），切换 tab 不再被磁盘 I/O 阻塞

#### `desktop/workspace_changes.go`
- **`workspaceGitBranchCached`**：10 秒缓存的 git branch 查询（备用，目前 MetaForTab 已直接返回空字符串）

---

### ✏️ 前端改动（React / TypeScript）

#### `MarkdownRenderer.tsx`
- `code` 渲染器加 `mermaid` 分支 → `<MermaidDiagram>`
- `code` 渲染器加 `html` 分支 → `<HtmlBlock>`

#### `Composer.tsx`
- `PastedBlock` 类型加 `meta?: string` 字段
- `insertRequest.fold = true` 时不往 textarea 写占位符，只生成上方彩色卡片
- 发送按钮：有 pastedBlocks 时即使 textarea 为空也可发送
- `expandPastedBlocks`：支持两种 pasted block（有/无 textarea 占位）
- `activePastedBlocks`：元素选中卡片（有 `meta` 字段的）始终显示，直到手动关闭
- 卡片标签：`⟨tag⟩` 格式，短标签 + hover tooltip 显示来源文件名

#### `WorkspacePanel.tsx`
- 新增 `hidePreview` prop：永久禁用内部文件预览区域，改由外部 FilePreviewPane 负责
- 新增 `onFileOpened` prop：点击文件树时通知外部打开预览面板
- `previewModeActive` 受 `hidePreview` 控制：避免 workspace 宽度被错误切到 preview 模式（否则打开预览时 workspace 反而变宽）
- `selectFile` 末尾调用 `onFileOpened(path)`

#### `App.tsx`
- FilePreviewPane 状态管理：`filePreviewOpen / Path / Width / Maximized`
- `openFilePreview`：直接操作 `rightDockTreeWidth = 300`（绕过 `setSavedWorkspacePanelWidth` 内部的 clamp 分支判断）
- FilePreviewPane 用 `position: fixed` + inline style 定位（彻底绕开 CSS Grid 高度问题）
- 分隔条拖拽优化：RAF 节流、`transition: none`（拖拽中即时响应）、双击重置、pointercancel 清理

#### `layout.ts`（store）
- `SIDEBAR_MIN_WIDTH = 150`、`SIDEBAR_DEFAULT_WIDTH = 150`
- `RIGHT_DOCK_TREE_MIN_WIDTH = 300`、`RIGHT_DOCK_TREE_DEFAULT_WIDTH = 300`
- `RIGHT_DOCK_MIN_RENDER_WIDTH = 100`

#### `bridge.ts`
- 新增接口声明和 mock：`SaveAssetToWorkspace`、`PreviewHtmlFile`

#### `types.ts`
- `FilePreview.kind` 联合类型加 `"html"`
- `ComposerInsertRequest` 加字段：`fold?`, `foldLabel?`, `foldMeta?`

#### `useController.ts`
- `switchTab`：本地已有 items 时跳过 `hydrate_start` dispatch，不再触发"正在同步"状态
- `loadSessionDataForTab`：支持 `silent?: boolean` 选项（静默刷新，不触发加载状态）

#### `styles.css`
- Mermaid / HTML 代码块：细边框（1px）+ 浮动工具栏（hover 淡入，半透明毛玻璃背景）
- `.file-preview-pane` 及子元素样式
- `.file-preview-pane-resizer` 分隔条样式

---

## 启动方式

```bash
cd reasonix/desktop
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=off
~/.go/bin/wails.exe dev
```

## 注意事项

- Build 脚本要求所有 `z-index` 使用 `--z-*` CSS token，不能用硬编码数值
- `pnpm build` 前会运行 `check-css-syntax.mjs` 和 `check-z-index-tokens.mjs`
- localStorage 保存了旧的 sidebar/workspace 宽度时，拖动一次重置即可

---

## v1.0.0 更新记录

### 用户全局规则注入（`internal/boot/boot.go`）

- **`userPersona(mem *memory.Set) string`**：新增函数，在 system prompt 构建末尾提取 ScopeUser 的 REASONIX.md 文档内容并注入
- 利用 **recency bias**，用户规则位于 prompt 最末尾，优先级最高
- **每次开新对话框（新 tab）自动扫描** `~\.reasonix\REASONIX.md`，不需要重启应用
- 用户只需编辑 `C:\Users\75497\AppData\Roaming\reasonix\REASONIX.md` → 开新 tab → 立即生效
- 替换了之前硬编码的 `marioPersona()` 函数，改为**通用注入机制**

### 品牌重命名（Reasonix-Mario）

- `wails.json`：`name → reasonix-mario`，`productName → Reasonix-Mario`，`productVersion → 1.0.0`
- `main.go`：窗口标题改为 `Reasonix-Mario`
- `App.tsx`：sidebar logo alt 改为 `Reasonix-Mario`
- NSIS 安装包文件名带版本号：`reasonix-mario-v1.0.0-amd64-installer.exe`

### YOLO 模式默认开启

- `internal/config/config.go`：Go 后端默认 `ToolApprovalMode: "ask"` → `"yolo"`
- `src/lib/composerProfile.ts`：前端 Composer 默认 `toolApprovalMode: "ask"` → `"yolo"`
- 效果：新建对话不再弹出工具审批弹窗，直接执行

### NSIS 安装打包

- 一键打包脚本 `desktop/build-installer.sh`
- 依赖：NSIS（`winget install NSIS.NSIS`）
- 构建命令：
  ```bash
  cd reasonix/desktop
  export PATH="$PATH:/c/Program Files (x86)/NSIS/Bin"
  wails build --nsis
  ```

## 修改文件总览

```
 desktop/
├── app.go                     ← dirTokenStore, PreviewHtmlFile, SaveAssetToWorkspace
├── main.go                    ← 窗口标题 → Reasonix-Mario
├── tabs.go                    ← SetActiveTab 异步磁盘写入
├── wails.json                 ← 品牌名 + 版本号 1.0.0
├── workspace_changes.go        ← workspaceGitBranchCached
└── frontend/src/
    ├── App.tsx                 ← FilePreviewPane 状态管理 + 定位
    ├── components/
    │   ├── Composer.tsx        ← fold 卡片 + 彩色标签
    │   ├── FilePreviewPane.tsx ← 独立预览面板
    │   ├── HtmlBlock.tsx       ← HTML 代码块渲染
    │   ├── HtmlPreviewPane.tsx ← (可删除，已被 FilePreviewPane 取代)
    │   ├── MarkdownRenderer.tsx ← mermaid + html 分支
    │   ├── MermaidDiagram.tsx  ← Mermaid 图表渲染
    │   └── WorkspacePanel.tsx  ← hidePreview + onFileOpened
    ├── lib/
    │   ├── bridge.ts           ← SaveAssetToWorkspace, PreviewHtmlFile
    │   ├── composerProfile.ts  ← 默认 YOLO 模式
    │   ├── types.ts            ← FilePreview.kind + fold 字段
    │   └── useController.ts    ← switchTab 跳过 hydrate_start
    ├── store/layout.ts         ← sidebar/workspace 宽度调整
    └── styles.css              ← 细边框 + 浮动工具栏 + 分隔条

 internal/
├── boot/boot.go               ← userPersona() 全局规则注入
└── config/config.go           ← 默认 YOLO 模式
```
