import './style.css'
import {
  Editor,
  Markdown,
  Placeholder,
  StarterKit,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TaskItem,
  TaskList
} from '../vendor/tiptap.mjs'
import { LABELS, resolveLocale } from './labels.js'

const api = window.vaniPlugin
const isMac = /mac|iphone|ipad|ipod/iu.test(navigator.platform || navigator.userAgent)
const modKey = isMac ? '⌘' : 'Ctrl+'
const saveShortcut = isMac ? '⌘S' : 'Ctrl+S'

const ICONS = {
  chevronDown: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 6.25 3.5 3.5 3.5-3.5"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-6.5"/></svg>',
  bold: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3h4.25a2.5 2.5 0 0 1 0 5H4.5V3Z"/><path d="M4.5 8h4.75a2.5 2.5 0 0 1 0 5H4.5V8Z"/></svg>',
  italic: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.75 3h5.5M3.75 13h5.5M9.5 3l-3 10"/></svg>',
  strike: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11"/><path d="M10.75 4.75C10.75 3.7 9.6 3 8 3c-1.55 0-2.65.65-2.65 1.7 0 .85.6 1.35 1.7 1.75"/><path d="M5.1 11.15C5.25 12.25 6.4 13 8.1 13c1.65 0 2.75-.75 2.75-1.85 0-.8-.45-1.3-1.25-1.7"/></svg>',
  code: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/></svg>',
  link: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.75 9.25a3 3 0 0 0 4.24 0l1.76-1.76a3 3 0 0 0-4.24-4.24l-1 1"/><path d="M9.25 6.75a3 3 0 0 0-4.24 0L3.25 8.51a3 3 0 0 0 4.24 4.24l1-1"/></svg>',
  bulletList: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.25" cy="4.25" r=".9" fill="currentColor" stroke="none"/><circle cx="3.25" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="3.25" cy="11.75" r=".9" fill="currentColor" stroke="none"/><path d="M6 4.25h7.5M6 8h7.5M6 11.75h7.5"/></svg>',
  orderedList: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h1v2.25M2.25 5.75h1.5M2.35 8.2a.85.85 0 0 1 1.4.65c0 .7-1.4 1.15-1.4 1.9h1.5M2.3 12.25h1.2a.7.7 0 0 1 0 1.4H2.3"/><path d="M6 4.25h7.5M6 8h7.5M6 11.75h7.5"/></svg>',
  taskList: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.25" y="2.75" width="4" height="4" rx=".9"/><path d="m3.1 4.8.75.75 1.55-1.6"/><path d="M8.25 4.75h5.5"/><rect x="2.25" y="9.25" width="4" height="4" rx=".9"/><path d="M8.25 11.25h5.5"/></svg>',
  blockquote: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.5v9"/><path d="M6.25 5.25h7.25M6.25 8h5.75M6.25 10.75h4.25"/></svg>',
  codeBlock: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2.75" width="12" height="10.5" rx="1.75"/><path d="M6.25 6.25 4.5 8l1.75 1.75M9.75 6.25 11.5 8l-1.75 1.75"/></svg>',
  table: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5"/><path d="M2.25 6.5h11.5M2.25 10h11.5M6.25 6.5v6.75M10 6.5v6.75"/></svg>',
  hr: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11"/></svg>',
  undo: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.25 3 2.5 5.75 5.25 8.5"/><path d="M2.75 5.75H9.25a3.75 3.75 0 1 1 0 7.5H6.5"/></svg>',
  redo: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.75 3 13.5 5.75 10.75 8.5"/><path d="M13.25 5.75H6.75a3.75 3.75 0 1 0 0 7.5H9.5"/></svg>',
  alert: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.75"/><path d="M8 5.25v3.25"/><circle cx="8" cy="10.85" r=".75" fill="currentColor" stroke="none"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.5H7.5A2.5 2.5 0 0 0 5 6v12a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 18V8.5L14 3.5Z"/><path d="M14 3.5V8.5H19"/><path d="M9 13h6M9 16.5h4"/></svg>'
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value))
  }
  return node
}

function fileNameFromPath(filePath) {
  if (!filePath) return ''
  const parts = filePath.split(/[\\/]/u)
  return parts[parts.length - 1] || filePath
}

function computeStats(text) {
  const normalized = text || ''
  const lines = normalized.length === 0 ? 1 : normalized.split(/\r\n|\r|\n/u).length
  const cjkMatches = normalized.match(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/gu)
  const cjkCount = cjkMatches ? cjkMatches.length : 0
  const latinStripped = normalized.replace(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/gu, ' ').trim()
  const latinWords = latinStripped ? latinStripped.split(/\s+/u).filter(Boolean).length : 0
  const words = cjkCount + latinWords
  const minutes = Math.max(1, Math.ceil(words / 220))
  return { words, lines, minutes }
}

function computeWritable(file) {
  return Boolean(file && file.writable && !file.truncated)
}

function buildLineNumbers(text) {
  const count = !text ? 1 : text.split(/\r\n|\r|\n/u).length
  let out = ''
  for (let i = 1; i <= count; i++) {
    out += i === count ? String(i) : `${i}\n`
  }
  return out
}

const initPayload = await api.init
let localeKey = resolveLocale(initPayload.theme?.locale)
let t = LABELS[localeKey]

let activeFile = initPayload.context?.activeFile ?? null
let baselineText = activeFile?.text ?? ''
let currentText = baselineText
let currentVersion = activeFile?.version ?? null
let writable = computeWritable(activeFile)
let dirty = false
let saving = false
let conflict = false
let saveError = false
let diskFileSnapshot = null
let mode = 'rich'
let suppressEditorUpdate = false
let activePopover = null
let editor = null

// ── Build DOM Structure ──────────────────────────────────────────────────────
document.body.innerHTML = ''

const toolbar = el('header', 'toolbar', { role: 'toolbar' })
const toolbarLeft = el('div', 'toolbar-left')
const toolbarRight = el('div', 'toolbar-right')
toolbar.append(toolbarLeft, toolbarRight)

// Heading Trigger
const headingGroup = el('div', 'tool-group')
const headingBtn = el('button', 'tool-btn heading-trigger', {
  type: 'button',
  'aria-haspopup': 'menu',
  'aria-expanded': 'false'
})
const headingBtnText = el('span')
const headingBtnIcon = el('span')
headingBtnIcon.innerHTML = ICONS.chevronDown
headingBtn.append(headingBtnText, headingBtnIcon)
headingGroup.append(headingBtn)

const divider1 = el('span', 'tool-divider', { 'aria-hidden': 'true' })

// Inline Marks Group
const textGroup = el('div', 'tool-group', { role: 'group' })
function makeToolBtn(key, iconHtml, onClick) {
  const btn = el('button', 'tool-btn', { type: 'button', 'data-tool': key })
  btn.innerHTML = iconHtml
  btn.addEventListener('click', onClick)
  return btn
}

const boldBtn = makeToolBtn('bold', ICONS.bold, () => editor?.chain().focus().toggleBold().run())
const italicBtn = makeToolBtn('italic', ICONS.italic, () => editor?.chain().focus().toggleItalic().run())
const strikeBtn = makeToolBtn('strike', ICONS.strike, () => editor?.chain().focus().toggleStrike().run())
const codeBtn = makeToolBtn('code', ICONS.code, () => editor?.chain().focus().toggleCode().run())
const linkBtn = makeToolBtn('link', ICONS.link, () => toggleLinkPopover())
linkBtn.setAttribute('aria-expanded', 'false')
textGroup.append(boldBtn, italicBtn, strikeBtn, codeBtn, linkBtn)

const divider2 = el('span', 'tool-divider', { 'aria-hidden': 'true' })

// Lists Group
const listGroup = el('div', 'tool-group', { role: 'group' })
const bulletListBtn = makeToolBtn('bulletList', ICONS.bulletList, () => editor?.chain().focus().toggleBulletList().run())
const orderedListBtn = makeToolBtn('orderedList', ICONS.orderedList, () => editor?.chain().focus().toggleOrderedList().run())
const taskListBtn = makeToolBtn('taskList', ICONS.taskList, () => editor?.chain().focus().toggleTaskList().run())
listGroup.append(bulletListBtn, orderedListBtn, taskListBtn)

const divider3 = el('span', 'tool-divider', { 'aria-hidden': 'true' })

// Blocks Group
const blockGroup = el('div', 'tool-group', { role: 'group' })
const blockquoteBtn = makeToolBtn('blockquote', ICONS.blockquote, () => editor?.chain().focus().toggleBlockquote().run())
const codeBlockBtn = makeToolBtn('codeBlock', ICONS.codeBlock, () => editor?.chain().focus().toggleCodeBlock().run())
const tableBtn = makeToolBtn('table', ICONS.table, () =>
  editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
)
const hrBtn = makeToolBtn('hr', ICONS.hr, () => editor?.chain().focus().setHorizontalRule().run())
blockGroup.append(blockquoteBtn, codeBlockBtn, tableBtn, hrBtn)

const divider4 = el('span', 'tool-divider', { 'aria-hidden': 'true' })

// History Group
const historyGroup = el('div', 'tool-group', { role: 'group' })
const undoBtn = makeToolBtn('undo', ICONS.undo, () => editor?.chain().focus().undo().run())
const redoBtn = makeToolBtn('redo', ICONS.redo, () => editor?.chain().focus().redo().run())
historyGroup.append(undoBtn, redoBtn)

toolbarLeft.append(
  headingGroup,
  divider1,
  textGroup,
  divider2,
  listGroup,
  divider3,
  blockGroup,
  divider4,
  historyGroup
)

// Right Toolbar Controls: Segmented Mode Switch, Status Pill, Save Button
const modeSwitch = el('div', 'vp-segmented', { role: 'tablist' })
const richModeBtn = el('button', 'vp-segmented-btn', { type: 'button', role: 'tab', 'aria-selected': 'true' })
const sourceModeBtn = el('button', 'vp-segmented-btn', { type: 'button', role: 'tab', 'aria-selected': 'false' })
modeSwitch.append(richModeBtn, sourceModeBtn)

const statusPill = el('span', 'status-pill', { 'data-status': 'saved' })
const saveBtn = el('button', 'save-btn', { type: 'button' })

toolbarRight.append(modeSwitch, statusPill, saveBtn)

// Heading Popover Menu
const headingMenu = el('div', 'popover heading-menu', { role: 'menu', hidden: '' })
const HEADING_OPTIONS = [
  { level: 0, labelKey: 'paragraph', tag: 'P' },
  { level: 1, labelKey: 'heading1', tag: 'H1' },
  { level: 2, labelKey: 'heading2', tag: 'H2' },
  { level: 3, labelKey: 'heading3', tag: 'H3' }
]
const headingOptionButtons = HEADING_OPTIONS.map(opt => {
  const btn = el('button', 'heading-option', {
    type: 'button',
    role: 'menuitemradio',
    'aria-checked': 'false',
    'data-level': String(opt.level)
  })
  const left = el('span', 'heading-option-label')
  const tag = el('span', 'heading-option-tag')
  tag.textContent = opt.tag
  const text = el('span', 'heading-option-text')
  left.append(tag, text)
  const checkWrap = el('span')
  checkWrap.innerHTML = ICONS.check
  checkWrap.firstElementChild.classList.add('heading-option-check')
  btn.append(left, checkWrap.firstElementChild)
  btn.addEventListener('click', () => {
    closePopovers()
    if (!editor || !writable) return
    if (opt.level === 0) editor.chain().focus().setParagraph().run()
    else editor.chain().focus().toggleHeading({ level: opt.level }).run()
  })
  headingMenu.append(btn)
  return { opt, btn, text }
})

// Link Popover
const linkPopover = el('div', 'popover link-popover', { role: 'dialog', hidden: '' })
const linkField = el('label', 'link-popover-field')
const linkLabelEl = el('span', 'link-popover-label')
const linkInput = el('input', 'link-popover-input', { type: 'url', spellcheck: 'false' })
linkField.append(linkLabelEl, linkInput)

const linkActions = el('div', 'link-popover-actions')
const linkRemoveBtn = el('button', 'popover-btn', { type: 'button' })
const linkApplyBtn = el('button', 'popover-btn popover-btn--primary', { type: 'button' })
linkActions.append(linkRemoveBtn, linkApplyBtn)
linkPopover.append(linkField, linkActions)

// Notice Banner (Conflict / Read-only / Save Error)
const noticeBanner = el('div', 'notice-banner', { role: 'status', hidden: '' })
const noticeMain = el('div', 'notice-main')
const noticeIcon = el('span')
noticeIcon.innerHTML = ICONS.alert
const noticeText = el('span', 'notice-text')
noticeMain.append(noticeIcon, noticeText)
const noticeActions = el('div', 'notice-actions')
const reloadBtn = el('button', 'banner-btn', { type: 'button', hidden: '' })
const overwriteBtn = el('button', 'banner-btn banner-btn--strong', { type: 'button', hidden: '' })
noticeActions.append(reloadBtn, overwriteBtn)
noticeBanner.append(noticeMain, noticeActions)

// Main Stage
const stage = el('main', 'stage')
const richScroll = el('div', 'rich-scroll')
const richContainer = el('div', 'rich-container')
richScroll.append(richContainer)

const sourceWrap = el('div', 'source-wrap', { hidden: '' })
const sourceCard = el('div', 'source-card')
const sourceGutter = el('div', 'source-gutter', { 'aria-hidden': 'true' })
const sourceTextarea = el('textarea', 'source-textarea', {
  spellcheck: 'false',
  autocapitalize: 'off',
  autocomplete: 'off'
})
sourceCard.append(sourceGutter, sourceTextarea)
sourceWrap.append(sourceCard)

const emptyState = el('div', 'empty-state', { hidden: '' })
const emptyIcon = el('span')
emptyIcon.innerHTML = ICONS.file
const emptyTitle = el('h2', 'empty-state-title')
const emptyBody = el('p', 'empty-state-body')
emptyState.append(emptyIcon, emptyTitle, emptyBody)

stage.append(richScroll, sourceWrap, emptyState)

// Compact Footer (28px)
const footer = el('footer', 'footer')
const footerFile = el('span', 'footer-file')
const footerMetrics = el('span', 'footer-metrics')
footer.append(footerFile, footerMetrics)

document.body.append(toolbar, noticeBanner, stage, footer, headingMenu, linkPopover)

// ── Popover Positioning & Management ─────────────────────────────────────────
function positionPopover(popoverEl, anchorEl) {
  const rect = anchorEl.getBoundingClientRect()
  popoverEl.hidden = false
  const popRect = popoverEl.getBoundingClientRect()
  const margin = 8
  let left = Math.max(margin, Math.min(rect.left, window.innerWidth - popRect.width - margin))
  const top = Math.min(rect.bottom + 6, window.innerHeight - popRect.height - margin)
  popoverEl.style.left = `${Math.round(left)}px`
  popoverEl.style.top = `${Math.round(top)}px`
}

function closePopovers() {
  if (activePopover === 'heading') {
    headingMenu.hidden = true
    headingBtn.setAttribute('aria-expanded', 'false')
  } else if (activePopover === 'link') {
    linkPopover.hidden = true
    linkBtn.setAttribute('aria-expanded', 'false')
  }
  activePopover = null
}

function toggleHeadingMenu() {
  if (!writable || mode !== 'rich' || !activeFile) return
  if (activePopover === 'heading') {
    closePopovers()
    return
  }
  closePopovers()
  activePopover = 'heading'
  headingBtn.setAttribute('aria-expanded', 'true')
  updateHeadingMenuChecks()
  positionPopover(headingMenu, headingBtn)
}

function toggleLinkPopover() {
  if (!writable || mode !== 'rich' || !activeFile || !editor) return
  if (activePopover === 'link') {
    closePopovers()
    return
  }
  closePopovers()
  activePopover = 'link'
  linkBtn.setAttribute('aria-expanded', 'true')
  const existingHref = editor.getAttributes('link')?.href || ''
  linkInput.value = existingHref
  linkRemoveBtn.hidden = !existingHref
  positionPopover(linkPopover, linkBtn)
  linkInput.focus()
  linkInput.select()
}

function applyLinkFromPopover() {
  if (!editor || !writable) return
  const raw = linkInput.value.trim()
  closePopovers()
  if (!raw) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const href = /^(https?:\/\/|mailto:|#|\/)/iu.test(raw) ? raw : `https://${raw}`
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

headingBtn.addEventListener('click', e => {
  e.stopPropagation()
  toggleHeadingMenu()
})

linkApplyBtn.addEventListener('click', applyLinkFromPopover)
linkRemoveBtn.addEventListener('click', () => {
  closePopovers()
  editor?.chain().focus().extendMarkRange('link').unsetLink().run()
})
linkInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    applyLinkFromPopover()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePopovers()
    editor?.chain().focus().run()
  }
})

document.addEventListener('pointerdown', e => {
  if (!activePopover) return
  const target = e.target
  if (
    headingMenu.contains(target) ||
    headingBtn.contains(target) ||
    linkPopover.contains(target) ||
    linkBtn.contains(target)
  ) {
    return
  }
  closePopovers()
})

// ── Tiptap Initialization ────────────────────────────────────────────────────
function initEditor() {
  editor = new Editor({
    element: richContainer,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true }
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: () => t.editorPlaceholder
      }),
      Markdown
    ],
    content: baselineText,
    contentType: 'markdown',
    editable: writable,
    onUpdate: ({ editor: ed }) => {
      if (suppressEditorUpdate || mode !== 'rich') return
      currentText = ed.getMarkdown()
      dirty = currentText !== baselineText
      saveError = false
      renderStatusAndMetrics()
    },
    onSelectionUpdate: () => updateToolbarState(),
    onTransaction: () => updateToolbarState()
  })
}

function syncEditorContent(text, canEdit) {
  if (!editor) return
  suppressEditorUpdate = true
  try {
    editor.setEditable(canEdit && mode === 'rich', false)
    editor.commands.setContent(text, { contentType: 'markdown', emitUpdate: false })
  } finally {
    suppressEditorUpdate = false
  }
}

function syncSourceContent(text, canEdit) {
  sourceTextarea.value = text
  sourceTextarea.readOnly = !canEdit
  sourceGutter.textContent = buildLineNumbers(text)
}

function syncViewsFromText(text, canEdit) {
  syncEditorContent(text, canEdit)
  syncSourceContent(text, canEdit)
}

// ── Mode Switching (Rich <-> Source) ─────────────────────────────────────────
function setMode(nextMode) {
  if (mode === nextMode || !activeFile) return
  closePopovers()

  if (nextMode === 'source') {
    if (dirty && editor) {
      currentText = editor.getMarkdown()
    } else if (!dirty) {
      currentText = baselineText
    }
    mode = 'source'
    syncSourceContent(currentText, writable)
    editor?.setEditable(false, false)
    richScroll.hidden = true
    sourceWrap.hidden = false
    sourceTextarea.focus()
  } else {
    currentText = sourceTextarea.value
    dirty = currentText !== baselineText
    mode = 'rich'
    syncEditorContent(currentText, writable)
    sourceWrap.hidden = true
    richScroll.hidden = false
    editor?.commands.focus()
  }

  renderAll()
}

richModeBtn.addEventListener('click', () => setMode('rich'))
sourceModeBtn.addEventListener('click', () => setMode('source'))

sourceTextarea.addEventListener('input', () => {
  if (mode !== 'source' || !writable) return
  currentText = sourceTextarea.value
  dirty = currentText !== baselineText
  saveError = false
  sourceGutter.textContent = buildLineNumbers(currentText)
  renderStatusAndMetrics()
})

sourceTextarea.addEventListener('scroll', () => {
  sourceGutter.scrollTop = sourceTextarea.scrollTop
})

// ── Save & Conflict Resolution ───────────────────────────────────────────────
async function saveDocument({ force = false, expectedVersion = null } = {}) {
  if (!activeFile || !writable || saving) return
  const targetVersion = expectedVersion ?? currentVersion
  if (!targetVersion) return

  const textToSave = mode === 'rich' && editor ? (dirty ? editor.getMarkdown() : currentText) : sourceTextarea.value
  currentText = textToSave
  saving = true
  saveError = false
  renderStatusAndMetrics()

  try {
    const res = await api.writeActiveText(textToSave, targetVersion, force ? { force: true } : undefined)
    currentVersion = res.version
    baselineText = textToSave
    currentText = textToSave
    dirty = false
    conflict = false
    saveError = false
    diskFileSnapshot = null
  } catch (err) {
    if (err instanceof Error && err.message === 'conflict') {
      conflict = true
      saveError = false
      try {
        const latest = await api.request({ method: 'file.active.read' })
        if (latest) diskFileSnapshot = latest
      } catch {
        // Ignore fallback read errors; conflict banner still allows Reload or Overwrite
      }
    } else {
      saveError = true
    }
  } finally {
    saving = false
    renderAll()
  }
}

async function reloadFromDisk() {
  if (saving) return
  closePopovers()
  let latest = diskFileSnapshot
  if (!latest || typeof latest.text !== 'string') {
    try {
      latest = await api.request({ method: 'file.active.read' })
    } catch {
      latest = activeFile
    }
  }
  if (!latest) return
  activeFile = latest
  baselineText = latest.text ?? ''
  currentText = baselineText
  currentVersion = latest.version ?? currentVersion
  writable = computeWritable(latest)
  dirty = false
  conflict = false
  saveError = false
  diskFileSnapshot = null
  syncViewsFromText(baselineText, writable)
  renderAll()
}

saveBtn.addEventListener('click', () => saveDocument())
reloadBtn.addEventListener('click', () => reloadFromDisk())
overwriteBtn.addEventListener('click', () => {
  const versionForForce = diskFileSnapshot?.version ?? activeFile?.version ?? currentVersion
  saveDocument({ force: true, expectedVersion: versionForForce })
})

// ── UI Rendering ─────────────────────────────────────────────────────────────
function getCurrentHeadingLevel() {
  if (!editor) return 0
  for (const level of [1, 2, 3]) {
    if (editor.isActive('heading', { level })) return level
  }
  return 0
}

function updateHeadingMenuChecks() {
  const level = getCurrentHeadingLevel()
  for (const { opt, btn } of headingOptionButtons) {
    btn.setAttribute('aria-checked', String(opt.level === level))
  }
}

function updateToolbarState() {
  const hasFile = Boolean(activeFile)
  const richEditable = hasFile && writable && mode === 'rich' && Boolean(editor)

  headingBtn.disabled = !richEditable
  boldBtn.disabled = !richEditable
  italicBtn.disabled = !richEditable
  strikeBtn.disabled = !richEditable
  codeBtn.disabled = !richEditable
  linkBtn.disabled = !richEditable
  bulletListBtn.disabled = !richEditable
  orderedListBtn.disabled = !richEditable
  taskListBtn.disabled = !richEditable
  blockquoteBtn.disabled = !richEditable
  codeBlockBtn.disabled = !richEditable
  tableBtn.disabled = !richEditable
  hrBtn.disabled = !richEditable

  const level = getCurrentHeadingLevel()
  headingBtnText.textContent = t[`headingShort${level}`]

  if (richEditable && editor) {
    boldBtn.setAttribute('aria-pressed', String(editor.isActive('bold')))
    italicBtn.setAttribute('aria-pressed', String(editor.isActive('italic')))
    strikeBtn.setAttribute('aria-pressed', String(editor.isActive('strike')))
    codeBtn.setAttribute('aria-pressed', String(editor.isActive('code')))
    linkBtn.setAttribute('aria-pressed', String(editor.isActive('link')))
    bulletListBtn.setAttribute('aria-pressed', String(editor.isActive('bulletList')))
    orderedListBtn.setAttribute('aria-pressed', String(editor.isActive('orderedList')))
    taskListBtn.setAttribute('aria-pressed', String(editor.isActive('taskList')))
    blockquoteBtn.setAttribute('aria-pressed', String(editor.isActive('blockquote')))
    codeBlockBtn.setAttribute('aria-pressed', String(editor.isActive('codeBlock')))
    tableBtn.setAttribute('aria-pressed', String(editor.isActive('table')))
    undoBtn.disabled = !editor.can().undo()
    redoBtn.disabled = !editor.can().redo()
  } else {
    for (const btn of [
      boldBtn,
      italicBtn,
      strikeBtn,
      codeBtn,
      linkBtn,
      bulletListBtn,
      orderedListBtn,
      taskListBtn,
      blockquoteBtn,
      codeBlockBtn,
      tableBtn
    ]) {
      btn.setAttribute('aria-pressed', 'false')
    }
    undoBtn.disabled = true
    redoBtn.disabled = true
  }

  if (activePopover === 'heading') updateHeadingMenuChecks()
}

function renderStatusAndMetrics() {
  const hasFile = Boolean(activeFile)

  if (!hasFile) {
    statusPill.hidden = true
    saveBtn.hidden = true
    footerFile.textContent = ''
    footerMetrics.textContent = ''
    return
  }

  statusPill.hidden = false
  saveBtn.hidden = !writable

  if (!writable) {
    statusPill.dataset.status = 'readonly'
    statusPill.textContent = t.statusReadOnly
  } else if (saving) {
    statusPill.dataset.status = 'saving'
    statusPill.textContent = t.statusSaving
  } else if (dirty) {
    statusPill.dataset.status = 'unsaved'
    statusPill.textContent = t.statusUnsaved
  } else {
    statusPill.dataset.status = 'saved'
    statusPill.textContent = t.statusSaved
  }

  saveBtn.textContent = t.save
  saveBtn.title = t.saveTitle(saveShortcut)
  saveBtn.disabled = !writable || saving || !dirty || !currentVersion

  const name = fileNameFromPath(activeFile.path)
  footerFile.textContent = name
  footerFile.title = activeFile.path || name

  const textForMetrics = mode === 'source' ? sourceTextarea.value : currentText
  const { words, lines, minutes } = computeStats(textForMetrics)
  footerMetrics.textContent = `${t.words(words)} · ${t.lines(lines)} · ${t.minRead(minutes)}`
}

function renderBanner() {
  if (!activeFile) {
    noticeBanner.hidden = true
    return
  }

  if (conflict) {
    noticeBanner.hidden = false
    noticeBanner.dataset.tone = 'warning'
    noticeText.textContent = t.conflictMessage
    reloadBtn.hidden = false
    overwriteBtn.hidden = false
    reloadBtn.textContent = t.conflictReload
    overwriteBtn.textContent = t.conflictOverwrite
    reloadBtn.disabled = saving
    overwriteBtn.disabled = saving
    return
  }

  reloadBtn.hidden = true
  overwriteBtn.hidden = true

  if (saveError) {
    noticeBanner.hidden = false
    noticeBanner.dataset.tone = 'danger'
    noticeText.textContent = t.saveError
    return
  }

  if (activeFile.truncated) {
    noticeBanner.hidden = false
    noticeBanner.dataset.tone = 'warning'
    noticeText.textContent = t.truncatedNotice
    return
  }

  if (!writable) {
    noticeBanner.hidden = false
    noticeBanner.dataset.tone = 'info'
    noticeText.textContent = t.readOnlyNotice
    return
  }

  noticeBanner.hidden = true
}

function renderLabels() {
  toolbar.setAttribute('aria-label', t.toolbarAria)
  textGroup.setAttribute('aria-label', t.textFormatAria)
  listGroup.setAttribute('aria-label', t.listFormatAria)
  blockGroup.setAttribute('aria-label', t.blockFormatAria)
  historyGroup.setAttribute('aria-label', t.historyAria)
  modeSwitch.setAttribute('aria-label', t.modeAria)
  headingMenu.setAttribute('aria-label', t.headingMenuAria)
  linkPopover.setAttribute('aria-label', t.linkPopoverAria)

  headingBtn.title = t.headingTrigger
  headingBtn.setAttribute('aria-label', t.headingTrigger)
  for (const { opt, text } of headingOptionButtons) {
    text.textContent = t[opt.labelKey]
  }

  const tip = (btn, label, shortcut) => {
    const title = shortcut ? `${label} (${shortcut})` : label
    btn.title = title
    btn.setAttribute('aria-label', label)
  }

  tip(boldBtn, t.bold, `${modKey}B`)
  tip(italicBtn, t.italic, `${modKey}I`)
  tip(strikeBtn, t.strike, isMac ? '⇧⌘S' : 'Ctrl+Shift+S')
  tip(codeBtn, t.code, `${modKey}E`)
  tip(linkBtn, t.link)
  tip(bulletListBtn, t.bulletList)
  tip(orderedListBtn, t.orderedList)
  tip(taskListBtn, t.taskList)
  tip(blockquoteBtn, t.blockquote)
  tip(codeBlockBtn, t.codeBlock)
  tip(tableBtn, t.insertTable)
  tip(hrBtn, t.horizontalRule)
  tip(undoBtn, t.undo, `${modKey}Z`)
  tip(redoBtn, t.redo, isMac ? '⇧⌘Z' : 'Ctrl+Shift+Z')

  richModeBtn.textContent = t.rich
  sourceModeBtn.textContent = t.source
  linkLabelEl.textContent = t.linkUrlLabel
  linkInput.placeholder = t.linkUrlPlaceholder
  linkApplyBtn.textContent = t.linkApply
  linkRemoveBtn.textContent = t.linkRemove
  sourceTextarea.placeholder = t.sourcePlaceholder
  emptyTitle.textContent = t.noFileTitle
  emptyBody.textContent = t.noFileBody
}

function renderAll() {
  const hasFile = Boolean(activeFile)
  richModeBtn.disabled = !hasFile
  sourceModeBtn.disabled = !hasFile
  richModeBtn.setAttribute('aria-selected', String(mode === 'rich'))
  sourceModeBtn.setAttribute('aria-selected', String(mode === 'source'))

  emptyState.hidden = hasFile
  richScroll.hidden = !hasFile || mode !== 'rich'
  sourceWrap.hidden = !hasFile || mode !== 'source'

  renderLabels()
  renderBanner()
  updateToolbarState()
  renderStatusAndMetrics()
}

// ── Global Shortcuts ─────────────────────────────────────────────────────────
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase()
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === 's') {
    event.preventDefault()
    saveDocument()
    return
  }
  if (event.key === 'Escape' && activePopover) {
    event.preventDefault()
    const anchor = activePopover === 'heading' ? headingBtn : linkBtn
    closePopovers()
    anchor.focus()
  }
})

// ── Host Bridge Subscriptions ────────────────────────────────────────────────
api.onTheme(nextTheme => {
  const nextLocale = resolveLocale(nextTheme?.locale)
  if (nextLocale !== localeKey) {
    localeKey = nextLocale
    t = LABELS[localeKey]
    renderAll()
    if (editor?.view) {
      editor.view.dispatch(editor.state.tr)
    }
  }
})

api.onContext(ctx => {
  const nextFile = ctx?.activeFile ?? null
  if (!nextFile) {
    if (!dirty && !saving) {
      activeFile = null
      baselineText = ''
      currentText = ''
      currentVersion = null
      writable = false
      conflict = false
      saveError = false
      diskFileSnapshot = null
      syncViewsFromText('', false)
      renderAll()
    }
    return
  }

  const nextWritable = computeWritable(nextFile)
  const pathChanged = !activeFile || nextFile.path !== activeFile.path
  const versionChanged = nextFile.version !== currentVersion

  if (pathChanged) {
    activeFile = nextFile
    baselineText = nextFile.text ?? ''
    currentText = baselineText
    currentVersion = nextFile.version ?? null
    writable = nextWritable
    dirty = false
    conflict = false
    saveError = false
    diskFileSnapshot = null
    closePopovers()
    syncViewsFromText(baselineText, writable)
    renderAll()
    return
  }

  activeFile = nextFile
  writable = nextWritable
  editor?.setEditable(writable && mode === 'rich', false)
  sourceTextarea.readOnly = !writable

  if (!dirty && !saving) {
    const nextText = nextFile.text ?? ''
    const textChanged = nextText !== baselineText
    baselineText = nextText
    currentText = nextText
    currentVersion = nextFile.version ?? null
    conflict = false
    saveError = false
    diskFileSnapshot = null
    if (textChanged) {
      syncViewsFromText(nextText, writable)
    }
    renderAll()
    return
  }

  if (dirty && versionChanged) {
    diskFileSnapshot = nextFile
    conflict = true
    renderAll()
  }
})

// ── Boot ─────────────────────────────────────────────────────────────────────
initEditor()
syncSourceContent(baselineText, writable)
renderAll()
api.ready()
