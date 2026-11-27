# PPT Reader

View PowerPoint (`.pptx`) presentations completely offline inside Vani with a collapsible slide thumbnail strip, proportional stage rendering, speaker notes, and zoom controls.

## Features

- **100% Offline `.pptx` Engine**: Parses OpenXML slide archives directly in the plugin sandbox using vendored `JSZip` (`3.10.1`) and the browser `DOMParser`. No network access or external services are used.
- **Proportional Slide Stage**: Preserves exact presentation aspect ratio (`sldSz`), theme color schemes and color modifiers, slide/layout/master backgrounds, shapes, connectors, rich text formatting, embedded images, and tables.
- **Slide Thumbnail Strip**: Collapsible left sidebar displaying live proportional mini-slides with quick jump navigation. Automatically collapses on narrow panes (`< 620px`) and can be toggled on demand.
- **Speaker Notes Drawer**: Inspect per-slide speaker notes in a collapsible bottom drawer without leaving the presentation stage.
- **Keyboard Navigation**: Move between slides with `ArrowLeft` / `ArrowRight`, `ArrowUp` / `ArrowDown`, `PageUp` / `PageDown`, `Space`, `Home`, and `End`. Adjust zoom with `Cmd/Ctrl + =`, `Cmd/Ctrl + -`, and `Cmd/Ctrl + 0` (or `+` / `-` / `0` when the stage is focused).
- **Zoom Controls**: Switch between `Fit slide` (auto-resizing to the stage) and `50%`–`200%` presets via the custom zoom popover or step buttons.
- **Localized Interface**: Adapts toolbar controls, zoom options, and status messages to Vani's active locale (`en`, `zh-CN`, `zh-TW`, `ja`, `fr`) and light/dark theme tokens.

## Format Support & Graceful Fallbacks

- Supports OpenXML `.pptx` decks up to `48 MiB` read via chunked `file.active.readBytes`.
- Legacy binary `.ppt` files, complex slide animations/transitions, and embedded SmartArt/3D effects fall back gracefully without crashing or blocking text and image inspection.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.pptx`) | Opens workspace `.pptx` files directly in the embedded viewer. |
| `file.active.readBytes` | Reads byte chunks of the currently opened `.pptx` presentation (read-only). |

## Third-Party Notices

Upstream license notices for the vendored `JSZip` library are documented in `THIRD-PARTY-NOTICES.txt`.
