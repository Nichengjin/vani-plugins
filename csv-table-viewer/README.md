# CSV Table

Explore `.csv` files inside Vani as clean, interactive tables instead of raw comma-separated text.

## Features

- **Automatic numeric sorting** — Click any column header to toggle ascending or descending order. Numeric values sort naturally (`96` before `112`, not alphabetically).
- **Instant row filtering** — Type into the search field to match text case-insensitively across every column in real time.
- **Quoted CSV support** — Parses standard RFC 4180 fields, including embedded commas, escaped double quotes (`""`), and both LF and CRLF line endings.
- **Theme-native styling** — Inherits your active Vani light or dark theme tokens automatically and caps display at 250 matching rows for smooth scrolling.

## How it works

1. Open any `.csv` file in your workspace. **CSV Table** activates automatically as the file viewer for `.csv` files.
2. Enter text in **Filter rows** to narrow visible rows across all columns.
3. Click any column header to sort ascending, and click it again to sort descending.
4. To view the raw comma-separated source text at any time, use the viewer switcher in Vani's file header and choose **Built-in**.

## Privacy & Offline Scope

CSV Table runs completely locally and offline inside Vani's sandboxed UI runtime with no network access. It requests only `file.active.read` to display the currently open `.csv` file and never writes to disk or reads other files in your workspace.
