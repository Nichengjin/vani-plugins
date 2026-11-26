# PDF Reader

Read multi-page PDF documents completely offline inside Vani with on-demand byte-range streaming, responsive zoom modes, and selectable text.

## Features

- **100% Offline PDF.js Engine**: Bundles pinned Mozilla PDF.js `6.5.438`, Adobe CMaps, standard Foxit/Liberation fonts, and pure-JavaScript JPEG 2000 / JBIG2 / CCITT image decoders. No network access, Wasm binaries, or embedded PDF JavaScript execution are used.
- **On-Demand Byte Streaming**: Reads files lazily via `file.active.readBytes` in `256 KiB` range chunks using a custom `PDFDataRangeTransport`, allowing large multi-page documents to open quickly without buffering the entire file up front.
- **Page Navigation**: Step through pages with the previous/next toolbar buttons, jump directly by entering a page number, or use keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Home`, `End`) when the document stage is focused.
- **Zoom & Fit Modes**: Switch between **Fit width**, **Fit page**, and fixed scale presets (`50%`, `75%`, `100%`, `125%`, `150%`, `200%`, `300%`). Fit modes automatically adapt when the viewer pane resizes.
- **Selectable Text Layer**: Renders a synchronized PDF.js `TextLayer` over each page canvas so you can select and copy document text directly.
- **Localized Interface**: Adapts toolbar labels and status messages to Vani's active locale (`en`, `zh-CN`, `zh-TW`, `fr`, `ja`) and theme tokens.

## Encrypted PDFs

Password-protected PDFs are detected and reported clearly (`This PDF is password-protected.`). Entering passwords to unlock encrypted PDF documents is not supported.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.pdf`) | Opens workspace PDF files directly in the embedded reader. |
| `file.active.readBytes` | Streams byte ranges of the currently opened PDF on demand. |

## Third-Party Notices

Upstream license notices and maintainer instructions for rebuilding the vendored PDF.js bundle are documented in `THIRD-PARTY-NOTICES.txt`.
