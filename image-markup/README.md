# Image Markup

Inspect, zoom, and annotate workspace images right inside Vani, then save a full-resolution PNG copy without touching the original file.

## Supported Formats

Overrides Vani's `file.viewer` slot for common raster image formats:

- `.png`, `.jpeg`, `.jpg`, `.webp`, `.avif`, `.bmp`
- Opens images up to **32 MiB** and up to **32 million pixels** (max edge **16,384 px**), read safely in `512 KiB` chunks through the host bridge.

## Features

- **Zoom & Fit Controls**: Automatically fits the image to the available viewport on open and resize. Step zoom from **5%** to **800%** with `−` / `+`, or click the percentage button to return to fit-to-window mode.
- **Markup Tools**: Draw directly on the image at full pixel resolution using **Pen** (freehand strokes), **Arrow** (directional callouts), and **Box** (rectangular highlights).
- **Color & History**: Pick any ink color with the toolbar swatch and step back or forward with **Undo** / **Redo** (`Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`).
- **Keyboard Accessible Canvas**: Focus the canvas and use arrow keys (`Shift` for 10 px steps) to position the cursor, `Space` to start drawing, `Enter` to commit, and `Escape` to cancel the active stroke.
- **Safe Non-Destructive Export**: Click Vani's **Save PNG copy…** button above the viewer to export a freshly rendered full-resolution PNG copy. The original workspace file is never overwritten, and the host re-encodes pixels cleanly before writing to disk.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`png`, `jpeg`, `jpg`, `webp`, `avif`, `bmp`) | Replaces the default preview for supported image extensions. |
| `file.active.readBytes` | Reads raw bytes of the currently opened image file in bounded chunks. |
| `file.export` | Provides the rendered canvas PNG blob to Vani's host-controlled save dialog. |
