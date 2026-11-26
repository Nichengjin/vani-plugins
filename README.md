# Vani Plugins

Vani 运行时插件集合目录。每个一级插件目录均包含独立的 `manifest.json` 与源码／资源，可直接通过 Vani 的 **Extensions → Import** 导入，或打包为 ZIP（`manifest.json` 位于包根目录）分发。

插件契约与沙箱规范见 `vani/docs/design-docs/platform/vani-plugins.md` 与 `vani/skills/vani-write-plugin/SKILL.md`。

## 目录结构

```text
vani-plugins/
├── README.md
├── scripts/
│   └── prepare-pdf-reader.py      # 校验并重建 pdf-reader/vendor/ 的离线 PDF.js 依赖
├── csv-table-viewer/              # CSV 表格查看器（file.viewer）
├── image-markup/                  # 图片缩放与标注查看器（file.viewer）
├── pdf-reader/                    # 离线 PDF 阅读器（file.viewer）
└── workspace-files-summary/       # 工作区文件按后缀分组摘要面板（workbench.pane）
```

## 当前插件

| ID | 名称 | 版本 | 扩展点 | 声明权限 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `csv-table-viewer` | CSV Table | `1.0.0` | `file.viewer` (`.csv`) | `file.active.read` | 将 CSV 渲染为可筛选、可按列升降序排序（含数字排序）的表格视图。 |
| `image-markup` | Image Markup | `1.0.0` | `file.viewer` (`png`, `jpeg`, `jpg`, `webp`, `avif`, `bmp`) | `file.active.readBytes`, `file.export` | 图片适应窗口／缩放、画笔／箭头／方框标注、选色、撤销／重做，支持经宿主按钮另存原分辨率 PNG 副本（不覆盖原图）。 |
| `pdf-reader` | PDF Reader | `1.0.0` | `file.viewer` (`.pdf`) | `file.active.readBytes` | 离线多页 PDF 阅读器，内置固定版本 PDF.js 6.5.438、CMap、标准字体与纯 JS 解码器，支持按需字节分段读取、翻页／跳页、缩放、适合宽度／整页与文字选中；不支持输入密码打开加密 PDF。 |
| `workspace-files-summary` | Workspace Files Summary | `1.0.0` | `workbench.pane` (`summary`) | `workspace.files.read`, `ui.navigate` | 在右栏 Workbench 新增 Summary 面板，按扩展名分组列出工作区文件并支持点击跳转打开。 |

## 导入与打包

### 直接导入目录

在 Vani 侧栏打开 **Extensions → Import**，直接选择任意插件子目录（例如 `vani-plugins/image-markup`），预览权限与覆写槽位并确认后即可启用。

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

## 新增插件约定

- 在根目录新建 `<plugin-id>/`，目录名与 `manifest.json` 中的 `id` 保持一致。
- 仅保留常规文件，避免在插件目录内放入 `.DS_Store`、符号链接或硬链接（Vani 导入校验会拒绝链接文件）。
- 按最小权限原则声明 `capabilities`，L1 界面插件需保持离线可用、遵循 Vani 语义 CSS 变量并在就绪后调用 `window.vaniPlugin.ready()`。
