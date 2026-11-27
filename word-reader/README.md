# Word Reader

Read Word (`.docx`) documents completely offline inside Vani with an automatic heading outline, live in-document search, embedded images, and crisp editorial typography.

## Features

- **100% Offline `.docx` Rendering**: Bundles Mammoth (`1.11.0`) locally with zero network requests. Embedded images are converted to CSP-safe `data:` URIs and rendered HTML passes through a strict `DOMParser` allowlist sanitizer.
- **Document Outline Sidebar**: Automatically extracts `H1`–`H3` headings into a collapsible left navigation rail (`220px`) with click-to-jump and scroll-synced active heading tracking. Collapses automatically on narrow viewports (`< 640px`) and can be toggled from the toolbar at any time.
- **In-Document Search (`⌘F` / `Ctrl+F`)**: Highlights matches across headings, paragraphs, lists, and tables with a live `n of m` counter, `Enter` / `Shift+Enter` or chevron match navigation, and instant DOM restoration when cleared.
- **Responsive Zoom Stepper**: Scale reading typography cleanly from `70%` to `180%` with `−`, `100%` reset, `+`, or keyboard shortcuts (`⌘=` / `⌘-` / `⌘0`) without horizontal page overflow.
- **Document Metrics Footer**: Shows the active filename alongside live word, heading, and table counts.
- **Localized Interface**: Adapts all controls, empty states, errors, and metrics to Vani's active locale (`en`, `zh-CN`, `zh-TW`, `ja`, `fr`) and light/dark theme tokens.

## Supported Formats

- **Supported**: Office Open XML Word documents (`.docx`) up to `32 MiB`.
- **Unsupported**: Legacy binary Word documents (`.doc`) are not supported.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.docx`) | Opens workspace `.docx` files directly in the embedded reader. |
| `file.active.readBytes` | Reads the active `.docx` file read-only in `512 KiB` chunks. |

## Third-Party Notices

Upstream license notices for the vendored Mammoth build are documented in `THIRD-PARTY-NOTICES.txt`.
