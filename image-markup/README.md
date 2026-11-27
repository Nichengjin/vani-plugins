# Image Markup

Inspect, zoom, and annotate workspace images right inside Vani, then save a full-resolution PNG copy without touching the original file.

## Supported Formats

Overrides Vani's `file.viewer` slot for common raster image formats:

- `.png`, `.jpeg`, `.jpg`, `.webp`, `.avif`, `.bmp`
- Opens images up to **32 MiB** and up to **32 million pixels** (max edge **16,384 px**), read safely in `512 KiB` chunks through the host bridge.

## Features

- **Refined Studio Toolbar & Canvas**: Single-row toolbar aligned with Vani's Light and Dark themes, paired with a micro-dot canvas stage, theme-aware transparency checkerboard, and compact bottom status bar showing filename, markup count, and pixel dimensions.
- **Markup Tools**: Draw directly on the image at full pixel resolution using **Pen** (`1` / `P`) with smooth curves, **Arrow** (`2` / `A`) for directional callouts, and **Box** (`3` / `B`) for rectangular highlights.
- **Curated Ink Palette & Custom Picker**: Switch instantly between five high-contrast annotation inks (Vermilion, Amber, Emerald, Cobalt, and Ink Charcoal) or choose any custom color from the synced spectrum picker.
- **Stroke Weights**: Choose between **Thin**, **Medium**, and **Bold** stroke weights, automatically scaled to remain crisp at any zoom level.
- **History & Reversible Clear**: Step backward or forward with **Undo** (`Cmd/Ctrl+Z`) and **Redo** (`Cmd/Ctrl+Shift+Z`), or **Clear** all markups in a single undoable step.
- **Zoom & Fit Controls**: Fits the image automatically on open and resize. Step zoom from **5%** to **800%** with `−` / `+` (`-` / `=`), trackpad pinch / `Cmd/Ctrl` + scroll, or click the percentage button (`0`) to return to fit-to-window mode.
- **Keyboard Accessible Canvas**: Focus the canvas and use arrow keys (`Shift` for 10 px steps) to position the cursor, `Space` to start drawing, `Enter` to commit, and `Escape` to cancel the active stroke.
- **Safe Non-Destructive Export**: Click Vani's **Save PNG copy…** button above the viewer to export a freshly rendered full-resolution PNG copy. The original workspace file is never overwritten, and the host re-encodes pixels cleanly before writing to disk.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`png`, `jpeg`, `jpg`, `webp`, `avif`, `bmp`) | Replaces the default preview for supported image extensions. |
| `file.active.readBytes` | Reads raw bytes of the currently opened image file in bounded chunks. |
| `file.export` | Provides the rendered canvas PNG blob to Vani's host-controlled save dialog. |
