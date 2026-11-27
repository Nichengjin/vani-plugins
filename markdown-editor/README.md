# Markdown Editor

Edit `.md`, `.markdown`, and `.mdx` files inline inside Vani with a clean WYSIWYG rich-text editor, synchronized Markdown source view, and conflict-checked saving.

## Modes

- **Rich mode**: Distraction-free prose editing powered by an offline Tiptap v3 engine with headings, bold/italic/strikethrough, inline code, links, bullet/ordered/task lists, blockquotes, fenced code blocks, horizontal rules, and 3×3 GFM tables.
- **Source mode**: Synchronized monospace Markdown view with a line-number gutter. Switching between **Rich** and **Source** preserves edits cleanly in either direction without touching disk until you save.

## Keyboard Shortcuts

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Save changes | `⌘S` | `Ctrl+S` |
| Bold / Italic / Strikethrough | `⌘B` / `⌘I` / `⌘⇧S` | `Ctrl+B` / `Ctrl+I` / `Ctrl+Shift+S` |
| Inline code | `⌘E` | `Ctrl+E` |
| Undo / Redo | `⌘Z` / `⇧⌘Z` | `Ctrl+Z` / `Ctrl+Shift+Z` |

Standard Markdown input rules also work inline in Rich mode (for example `# ` for headings, `- ` or `1. ` for lists, `- [ ] ` for task items, `> ` for blockquotes, and ```` ``` ```` for code blocks).

## Conflict Protection & Read-Only Fallback

- **Conflict-checked saving**: Every save verifies the file version opened in the editor (`expectedVersion`). If the file changes on disk while you have unsaved edits, saving pauses and shows a banner offering **Reload** (discard local edits and load disk version) or **Overwrite** (write your edits on top of the newer disk version).
- **Read-only fallback**: Files exceeding the `768 KiB` preview limit (truncated) or opened on legacy/read-only hosts open safely in **Read-only** mode with editing and saving disabled.
- **Built-in viewer fallback**: Use Vani's viewer switcher in the file header at any time to switch back to **Built-in**.

## Permissions & Offline Scope

Markdown Editor runs locally inside Vani's sandboxed UI runtime with zero network access:

| Declaration | Purpose |
| --- | --- |
| `file.viewer` (`.md`, `.markdown`, `.mdx`) | Replaces the default preview for Markdown files. |
| `file.active.read` | Reads the currently open file content, metadata, and version token. |
| `file.active.write` | Saves your edited Markdown back to the active workspace file with version conflict checks. |
