# PDF Reader

Read multi-page PDF documents completely offline inside Vani with on-demand byte-range streaming, responsive zoom controls, and selectable text.

## Features

- **100% Offline PDF.js Engine**: Bundles pinned Mozilla PDF.js `6.5.438`, Adobe CMaps, standard Foxit/Liberation fonts, and pure-JavaScript JPEG 2000 / JBIG2 / CCITT image decoders. No network access, Wasm binaries, or embedded PDF JavaScript execution are used.
- **On-Demand Byte Streaming**: Reads files lazily via `file.active.readBytes` in `256 KiB` range chunks using a custom `PDFDataRangeTransport`, allowing large multi-page documents to open quickly without buffering the entire file up front.
- **Page Navigation**: Step through pages with toolbar chevron buttons, jump directly via the tabular page input, or use keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Home`, `End`) when the reading stage is focused.
- **Custom Zoom & Fit Controls**: Adjust scale with step buttons (`-` / `+`), a keyboard-accessible zoom menu (`Fit width`, `Fit page`, and `50%`–`300%` presets), a one-click fit toggle, or shortcuts (`Cmd/Ctrl + =`, `Cmd/Ctrl + -`, `Cmd/Ctrl + 0`). Fit modes automatically adapt when the viewer pane resizes.
- **Refined Reading Surface**: Presents each page on a crisp, elevated sheet over a matte reading desk with subtle render progress feedback, custom thin scrollbars, centered status cards, and a synchronized selectable `TextLayer`.
- **Localized Interface**: Adapts toolbar controls, zoom menu, and status messages to Vani's active locale (`en`, `zh-CN`, `zh-TW`, `fr`, `ja`) and light/dark theme tokens.

## Encrypted PDFs

Password-protected PDFs are detected and reported clearly (`This PDF is password-protected.`). Entering passwords to unlock encrypted PDF documents is not supported.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.pdf`) | Opens workspace PDF files directly in the embedded reader. |
| `file.active.readBytes` | Streams byte ranges of the currently opened PDF on demand. |

## Third-Party Notices

Upstream license notices and maintainer instructions for rebuilding the vendored PDF.js bundle are documented in `THIRD-PARTY-NOTICES.txt`.
