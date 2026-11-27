# Workspace Files Summary

Organize every file in the active workspace by file extension in a compact **Summary** panel inside Vani's Workbench.

## Features

- **Instant filter** — Filter files in real time by name, path, or extension with one-click clearing (`Esc` clears the filter).
- **File-type distribution bar** — A proportional breakdown bar at the top shows the workspace's dominant file types at a glance, with tooltips and click-to-jump navigation to any top extension group.
- **Collapsible extension groups** — Browse files grouped by extension with color-coded dots, live count badges, vertical indent guides, and subtle parent-folder hints for nested files.
- **Flexible sorting & folding** — Sort groups by file count (largest first) or alphabetically (`A–Z`), and collapse or expand every group in one click.
- **One-click navigation** — Click any file row to jump straight to that file in Vani.
- **Theme & locale aware** — Follows Vani's active light or dark color theme, compact Workbench density, and interface language (`en`, `zh-CN`, `zh-TW`, `ja`, `fr`).

## How to use

1. Enable **Workspace Files Summary** in Vani's **Extensions** view.
2. Open Vani's right-hand **Workbench** and switch to the **Summary** tab.
3. Type in the filter box to narrow by file name, folder path, or extension, flip between **Count** and **A–Z** sorting, or use **Collapse all** / **Expand all** to scan groups quickly.
4. Click any file to open it directly in Vani.

## Privacy & Read-Only Scope

Workspace Files Summary is strictly read-only and runs entirely offline with no network access. It requests only `workspace.files.read` to list file names and paths in the active workspace and `ui.navigate` to open the file you select. It never reads file contents or modifies files on disk.
