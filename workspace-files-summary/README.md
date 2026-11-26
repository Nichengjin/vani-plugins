# Workspace Files Summary

Organize every file in the active workspace by file extension in a lightweight **Summary** panel inside Vani's Workbench.

## Features

- **Grouped by extension** — Automatically sorts workspace files alphabetically by extension (such as `.css`, `.json`, `.md`, `.sql`, `.ts`, and `.tsx`) with live file counts per group.
- **Collapsible sections** — Expand or fold individual extension groups to focus on the file types you need.
- **One-click navigation** — Click any file name in the list to jump straight to that file in Vani.
- **Theme-aware & compact** — Follows your active Vani light or dark theme and fits comfortably in narrow Workbench columns.

## How to use

1. Enable **Workspace Files Summary** in Vani's **Extensions** view.
2. Open Vani's right-hand **Workbench** and switch to the **Summary** tab.
3. Click an extension header (for example, `.ts · 5`) to collapse or expand that section, or click any file name to open it directly.

## Privacy & Read-Only Scope

Workspace Files Summary is strictly read-only and runs entirely offline with no network access. It requests only `workspace.files.read` to list file names and paths in the active workspace and `ui.navigate` to open the file you select. It never reads file contents or modifies files on disk.
