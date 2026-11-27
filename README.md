# Vani Plugins

Vani 运行时插件集合目录。每个一级插件目录均包含独立的 `manifest.json`、`README.md`、展示媒体与源码／资源，可直接通过 Vani 的 **Extensions → Import** 导入，或打包为 ZIP（`manifest.json` 位于包根目录）分发。

插件契约与沙箱规范见 `vani/docs/design-docs/platform/vani-plugins.md` 与 `vani/skills/vani-write-plugin/SKILL.md`。

## 目录结构

```text
vani-plugins/
├── README.md
├── feed.config.json               # 拓展源名称、简介与仓库配置（Fork 模板时只需改这里）
├── feed.json                      # 静态拓展源索引（由 scripts/build-feed.mjs 与 CI 自动维护）
├── .github/workflows/
│   ├── validate.yml               # PR / push 预检 manifest、ZIP 边界与 feed 契约
│   └── release.yml                # 合并 main 后自动为新版本发 GitHub Release 并回写 feed.json
├── scripts/
│   ├── build-feed.mjs             # 零依赖打包脚本：校验 manifest、打确定性 ZIP、算 sha256 并生成 feed.json
│   └── prepare-pdf-reader.py      # 校验并重建 pdf-reader/vendor/ 的离线 PDF.js 依赖
├── csv-table-viewer/              # CSV 表格查看器（file.viewer）
├── excel-reader/                  # Excel / ODS 离线表格阅读器（file.viewer）
├── image-markup/                  # 图片缩放与标注查看器（file.viewer）
├── markdown-editor/               # Markdown 所见即所得 / 源码编辑器（file.viewer）
├── pdf-reader/                    # 离线 PDF 阅读器（file.viewer）
├── ppt-reader/                    # PowerPoint (.pptx) 离线演示文稿阅读器（file.viewer）
├── word-reader/                   # Word (.docx) 离线文档阅读器（file.viewer）
└── workspace-files-summary/       # 工作区文件按后缀分组摘要面板（workbench.pane）
```

## 在 Vani 中安装与更新

Vani 已内置本仓库作为官方源 **Vani Official**：

1. 打开侧栏 **Extensions → Sources → Vani Official**；
2. 点击任意插件右侧的 **Install**，核对真实包内 `manifest.json` 声明的权限与覆写槽位后确认安装；
3. 后续本仓发布新版本后，在 **Extensions** 点击刷新即可看到同源更新提示并一键升级（保留旧版备份）。

如需手动添加本源（或其他按同一模板发布的第三方源），在 **Extensions → Sources → Add source…** 中直接输入：

- GitHub 仓库简写：`Nichengjin/vani-plugins`
- GitHub 仓库链接：`https://github.com/Nichengjin/vani-plugins`
- 或直接输入 `feed.json` HTTPS 地址：`https://raw.githubusercontent.com/Nichengjin/vani-plugins/main/feed.json`

## 自动发布与模板复用（开发者指南）

### 发布新插件或新版本

1. 新增插件目录 `<plugin-id>/`（或在已有插件中递增 `manifest.json` 的 SemVer `version`）；
2. （可选）在插件根目录放 `RELEASE_NOTES.md` 写本次版本说明，客户端更新弹窗会展示；
3. 本地预检：
   ```bash
   node scripts/build-feed.mjs --check
   ```
4. 合并到 `main` 分支后，`.github/workflows/release.yml` 会自动：
   - 打包确定性 `<id>-<version>.zip` 并计算 `sha256`；
   - 为尚未发布的 `<id>-v<version>` 创建不可变 GitHub Release 并上传 `.zip`；
   - 更新根目录 `feed.json` 并自动提交回 `main`。

> 已发布过的版本号 tag 不会被覆盖；每次发版均需递增 `manifest.json` 的 SemVer `version`。

### 复用本仓库作为第三方拓展源模板

任何开发者都可以直接 Fork 本仓库发布自己的 Vani Extensions Feed：

1. Fork 本仓库并删除不需要的样例插件目录，放入你自己的插件目录；
2. 修改 `feed.config.json` 中的 `name`、`description` 和 `repository`（GitHub Actions 中会自动读取 `${{ github.repository }}`）；
3. 推送到 `main`，Actions 会自动创建 Release 与 `feed.json`；
4. 将 `你的用户名/你的仓库名` 发给用户，在 Vani 的 **Extensions → Sources → Add source…** 中即可直接订阅和更新。

## 当前插件

| ID | 名称 | 版本 | 扩展点 | 声明权限 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `csv-table-viewer` | CSV Table | `1.1.0` | `file.viewer` (`.csv`) | `file.active.read` | 将 CSV 渲染为带有筛选计数、吸顶表头、排序指示箭头与数字右对齐的表格视图。 |
| `excel-reader` | Excel Reader | `1.0.0` | `file.viewer` (`.xlsx`, `.xls`, `.ods`) | `file.active.readBytes` | 离线多工作表表格阅读器，内置 SheetJS 0.18.5，支持工作表标签切换、公式栏检查、合并单元格还原、搜索过滤与列排序。 |
| `image-markup` | Image Markup | `1.1.0` | `file.viewer` (`png`, `jpeg`, `jpg`, `webp`, `avif`, `bmp`) | `file.active.readBytes`, `file.export` | 查看、缩放并用矢量图标工具栏（画笔／箭头／方框、精选色板、三档线宽、清空与撤销／重做）标注图片，经宿主另存原分辨率 PNG 副本（不覆盖原图）。 |
| `markdown-editor` | Markdown Editor | `1.0.0` | `file.viewer` (`.md`, `.markdown`, `.mdx`) | `file.active.read`, `file.active.write` | 内置 Tiptap v3 的离线 Markdown 编辑器，支持富文本与源码双模式同步切换、快捷键格式化、`⌘S` 版本校验原子写回原文件以及外部改动冲突提示。 |
| `pdf-reader` | PDF Reader | `1.1.0` | `file.viewer` (`.pdf`) | `file.active.readBytes` | 离线多页 PDF 阅读器，内置固定版本 PDF.js 6.5.438、CMap、标准字体与纯 JS 解码器，支持按需字节分段读取、翻页／跳页、自绘缩放菜单、适合宽度／整页与文字选中；不支持输入密码打开加密 PDF。 |
| `ppt-reader` | PowerPoint Reader | `1.0.0` | `file.viewer` (`.pptx`) | `file.active.readBytes` | 离线 PowerPoint 阅读器，内置 JSZip 与 OOXML 解析器，支持缩略图导航、等比例幻灯片舞台、缩放控制、矢量形状／图片／表格渲染与可切换的演讲者备注栏。 |
| `word-reader` | Word Reader | `1.0.0` | `file.viewer` (`.docx`) | `file.active.readBytes` | 离线 Word (`.docx`) 阅读器，内置 Mammoth，支持文档大纲侧边栏、页内查找高亮（`⌘F`）、纸张视图缩放与内嵌图片渲染。 |
| `workspace-files-summary` | Workspace Files Summary | `1.1.0` | `workbench.pane` (`summary`) | `workspace.files.read`, `ui.navigate` | 在右栏 Workbench 新增 Summary 面板，带文件名筛选、后缀分布比例条与可折叠分组列表，支持点击跳转打开。 |

## 导入与打包

### 直接导入目录

在 Vani 侧栏打开 **Extensions → Import**，直接选择任意插件子目录（例如 `vani-plugins/image-markup`），预览权限、展示信息与覆写槽位并确认后即可启用。

### 打包为 ZIP 导入

确保 `manifest.json` 位于 ZIP 根目录，且不包含 `.DS_Store` 或符号链接：

```bash
(cd image-markup && zip -r ../image-markup.zip . -x "*.DS_Store")
```

### 重建 `pdf-reader` 离线依赖（维护者用）

`pdf-reader/vendor/` 已随目录一起携带，直接导入无需安装或联网。如需从固定版本重新生成（附 SHA-512 校验）：

```bash
python3 scripts/prepare-pdf-reader.py [pdfjs-dist-6.5.438.tgz]
```

## 清单展示元数据与目录约定

Vani Extensions 列表、详情页与导入预览均从单个 `manifest.json`（`schemaVersion: 1`）读取展示元数据，无需额外配置文件：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `author` | `string`（可选） | 插件作者或团队名称（如 `"Vani"`）。 |
| `homepage` | `string`（可选） | `https://` 项目主页或文档链接。 |
| `icon` | `string`（可选） | 包内相对路径的光栅图标（推荐 `256×256` PNG，如 `"media/icon.png"`）。 |
| `cover` | `string \| { light, dark }`（可选） | 详情页顶部横幅图（推荐 `1200×520`），支持按浅／深主题分别提供。 |
| `screenshots` | `Array<{ src, caption?, alt? }>`（可选） | 1–12 张真实运行截图（推荐 `960×600`），每项 `src` 同样支持单图路径或 `{ light, dark }` 主题变体。 |
| `readme` | `string`（可选） | 指向包内 Markdown 说明文件（约定为 `"README.md"`）。 |

### 媒体与文件约定

- **展示媒体统一放在 `media/`**：不要将图标、横幅或截图放入 `assets/`。`PluginCompiler` 会将 `assets/` 下的静态文件打入运行时 iframe 产物（总构建上限 8 MiB），而 `media/` 仅用于 Extensions 展示与导入预览，不占用运行时构建体积。
- **仅使用光栅图片**：`icon`、`cover` 与 `screenshots[].src` 仅接受 `.png`、`.jpg`/`.jpeg`、`.webp` 或 `.avif` 常规文件（不接受 `.svg`），建议单张控制在 180 KB 以内。
- **每个插件配备 `README.md`**：在插件根目录维护简洁清晰的 `README.md`，说明功能、支持格式、操作方式、已知限制与所需权限，并在 `manifest.json` 中声明 `"readme": "README.md"`。

## 新增插件约定

- 在根目录新建 `<plugin-id>/`，目录名与 `manifest.json` 中的 `id` 保持一致。
- 仅保留常规文件，避免在插件目录内放入 `.DS_Store`、符号链接或硬链接（Vani 导入校验会拒绝链接文件）。
- 按最小权限原则声明 `capabilities`，L1 界面插件需保持离线可用、遵循 Vani 语义 CSS 变量并在就绪后调用 `window.vaniPlugin.ready()`。
