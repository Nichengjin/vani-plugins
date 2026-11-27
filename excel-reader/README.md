# Excel Reader

Inspect multi-sheet spreadsheets (`.xlsx`, `.xls`, `.ods`) completely offline inside Vani with sheet switching, formula inspection, search filtering, and numeric column sorting.

## Features

- **100% Offline Workbook Engine**: Bundles SheetJS Community Edition (`xlsx 0.18.5`) with zero network requests or remote dependencies.
- **Multi-Sheet Navigation**: Switch across workbook tabs from the bottom sheet bar with live sheet dimensions (`rows × cols`) and sticky row/column headers.
- **Formula Bar Inspection**: Click or navigate to any cell to inspect its coordinate (`D4`), formula expression (`=SUM(B2:B4)`), or formatted display value.
- **Instant Row Filtering & Numeric Sorting**: Filter visible rows across all columns in real time, sort columns numerically or alphabetically (ascending/descending), and clear active sorts from the toolbar pill.
- **Readable Grid Controls**: Toggle first-row header mode (`Header row`), enable multi-line text wrapping (`Wrap`), inspect merged cells in natural order, and progressively load large sheets in 400-row increments.
- **Localized & Theme-Aware**: Adapts toolbar controls, status messages, and number formatting to Vani's active locale (`en`, `zh-CN`, `zh-TW`, `ja`, `fr`) and light/dark theme tokens.

## Read-Only Scope & Limits

- **Read-Only Access**: Uses `file.active.readBytes` to read the active workbook in `512 KiB` chunks up to `32 MiB`. No workspace files are modified.
- **Render Bounds**: Worksheets are safely bounded to `10,000` rows and `100` columns with progressive `400`-row windowing to keep the viewer responsive.

## Permissions & Overrides

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.xlsx`, `.xls`, `.ods`) | Opens spreadsheet files directly in the embedded viewer. |
| `file.active.readBytes` | Reads raw bytes of the currently active workbook offline. |

## Third-Party Notices

Upstream Apache-2.0 license notices for the vendored SheetJS (`xlsx`) bundle are documented in `THIRD-PARTY-NOTICES.txt`.
