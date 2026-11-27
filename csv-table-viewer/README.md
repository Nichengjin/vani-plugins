# CSV Table

Explore `.csv` files inside Vani as clean, interactive tables instead of raw comma-separated text.

## Features

- **Sticky headers & directional sorting** — Column headers stay pinned while scrolling. Click any column header to sort ascending or descending with warm active-column highlighting, or clear the active sort from the toolbar pill.
- **Automatic numeric detection & alignment** — Numeric, currency, and percentage columns are detected automatically, right-aligned with tabular numerals, and sorted naturally (`96` before `112`, `$49.93` before `$195.68`).
- **Instant row filtering & live counts** — Filter case-insensitively across every column with an inline clear control and live row and column counts. Large tables render up to 500 matching rows smoothly with a clear notice when capped.
- **Quoted CSV support** — Parses standard RFC 4180 fields, including UTF-8 BOM, embedded commas, escaped double quotes (`""`), and both LF and CRLF line endings.
- **Theme-native & localized** — Adapts live to Vani light, dark, and custom color themes, and follows Vani's interface language across English, Simplified Chinese, Traditional Chinese, Japanese, and French.

## How it works

1. Open any `.csv` file in your workspace. **CSV Table** activates automatically as the file viewer for `.csv` files.
2. Type into the search field to narrow visible rows across all columns, or press `Esc` / click the clear button to reset.
3. Click any column header to sort ascending, click again to sort descending, or click the sort pill in the toolbar to restore the original row order.
4. To view the raw comma-separated source text at any time, use the viewer switcher in Vani's file header and choose **Built-in**.

## Privacy & Offline Scope

CSV Table runs completely locally and offline inside Vani's sandboxed UI runtime with no network access. It requests only `file.active.read` to display the currently open `.csv` file and never writes to disk or reads other files in your workspace.
