import './style.css'
import * as XLSX from '../vendor/xlsx.mjs'
import { excelLabels, resolveLocale } from './labels.js'

const MAX_BYTES = 32 * 1024 * 1024
const CHUNK_SIZE = 524288
const MIN_READ_INTERVAL_MS = 18
const ROW_BATCH_SIZE = 400
const MAX_RENDER_ROWS = 10000
const MAX_RENDER_COLS = 100

const SVG_NS = 'http://www.w3.org/2000/svg'
const CURRENCY_PERCENT_RE =
  /^(?:[+-]?\s*[$€£¥₹₩]\s*[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*%)$/u
const NUMERIC_TEXT_RE = /^([+-])?\s*([$€£¥₹₩])?\s*([+-])?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(%)?$/u

function createSvg(viewBox, width, height, paths, strokeWidth = 1.7) {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', String(strokeWidth))
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  for (const spec of paths) {
    const el = document.createElementNS(SVG_NS, spec.tag || 'path')
    for (const [k, v] of Object.entries(spec)) {
      if (k !== 'tag') el.setAttribute(k, String(v))
    }
    svg.append(el)
  }
  return svg
}

const iconSearch = () =>
  createSvg('0 0 16 16', 13, 13, [
    { d: 'M7.25 12.5a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Z' },
    { d: 'M13.5 13.5l-2.6-2.6' }
  ])
const iconClear = (size = 12) =>
  createSvg('0 0 12 12', size, size, [{ d: 'M3 3l6 6' }, { d: 'M9 3l-6 6' }], 1.7)
const iconSortIdle = () =>
  createSvg(
    '0 0 12 12',
    12,
    12,
    [{ d: 'M3.5 4.75L6 2.25L8.5 4.75' }, { d: 'M3.5 7.25L6 9.75L8.5 7.25' }],
    1.5
  )
const iconSortAsc = (size = 12) =>
  createSvg('0 0 12 12', size, size, [{ d: 'M6 9.5V2.5' }, { d: 'M3.25 5.25L6 2.5L8.75 5.25' }], 1.65)
const iconSortDesc = (size = 12) =>
  createSvg('0 0 12 12', size, size, [{ d: 'M6 2.5V9.5' }, { d: 'M3.25 6.75L6 9.5L8.75 6.75' }], 1.65)
const iconFx = () =>
  createSvg(
    '0 0 16 16',
    14,
    14,
    [
      { d: 'M7.25 3.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5' },
      { d: 'M3.75 7.25h3.5' },
      { d: 'M9.5 7.25l3.5 5' },
      { d: 'M13 7.25l-3.5 5' }
    ],
    1.45
  )
const iconSpinner = () =>
  createSvg(
    '0 0 20 20',
    18,
    18,
    [
      { tag: 'circle', cx: 10, cy: 10, r: 6.5, opacity: 0.22 },
      { d: 'M10 3.5a6.5 6.5 0 0 1 6.5 6.5' }
    ],
    1.6
  )
const iconError = () =>
  createSvg(
    '0 0 20 20',
    18,
    18,
    [
      { tag: 'circle', cx: 10, cy: 10, r: 7 },
      { d: 'M10 6.75v3.75' },
      { tag: 'circle', cx: 10, cy: 13.5, r: 0.65, fill: 'currentColor', stroke: 'none' }
    ],
    1.6
  )
const iconEmptySheet = () =>
  createSvg(
    '0 0 24 24',
    22,
    22,
    [
      { d: 'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z' },
      { d: 'M4 9.5h16' },
      { d: 'M4 14.5h16' },
      { d: 'M9.5 9.5V20' }
    ],
    1.5
  )
const iconEmptySearch = () =>
  createSvg(
    '0 0 24 24',
    22,
    22,
    [
      { d: 'M10.75 18a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5Z' },
      { d: 'M20 20l-4.1-4.1' },
      { d: 'M8.5 10.75h4.5' }
    ],
    1.5
  )

function parseNumericText(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = NUMERIC_TEXT_RE.exec(trimmed)
  if (!match) return null
  const [, leadingSign, currency, innerSign, digits, percent] = match
  if (leadingSign && innerSign) return null
  if (currency && percent) return null
  if (!digits || /^0\d/u.test(digits)) return null
  const sign = (leadingSign ?? innerSign) === '-' ? -1 : 1
  const numeric = Number(digits.replaceAll(',', ''))
  return Number.isFinite(numeric) ? sign * numeric : null
}

function getWorksheetCell(ws, r, c) {
  if (Array.isArray(ws)) return ws[r]?.[c] ?? null
  return ws[XLSX.utils.encode_cell({ r, c })] ?? null
}

function extractCellData(cell, absRow, absCol) {
  const ref = XLSX.utils.encode_cell({ r: absRow, c: absCol })
  if (!cell) {
    return { ref, w: '', numValue: null, t: 'z', f: '', isNumericAlign: false }
  }
  let formatted = ''
  try {
    formatted = XLSX.utils.format_cell(cell)
  } catch {
    formatted = cell.w ?? (cell.v != null ? String(cell.v) : '')
  }
  const t = cell.t || 's'
  const f = typeof cell.f === 'string' && cell.f ? `=${cell.f}` : ''
  let numValue = null
  if (t === 'n' && typeof cell.v === 'number' && Number.isFinite(cell.v)) {
    numValue = cell.v
  } else if (t === 'd' && cell.v instanceof Date && Number.isFinite(cell.v.getTime())) {
    numValue = cell.v.getTime()
  } else if (t === 's' && formatted) {
    numValue = parseNumericText(formatted)
  }
  const isNumericAlign =
    t === 'n' || t === 'd' || (t === 's' && Boolean(formatted) && CURRENCY_PERCENT_RE.test(formatted.trim()))

  return {
    ref,
    w: formatted ?? '',
    numValue,
    t,
    f,
    isNumericAlign
  }
}

function buildSheetModel(ws) {
  const rawRef = ws?.['!ref']
  if (!rawRef) {
    return {
      empty: true,
      startRow: 0,
      startCol: 0,
      rowCount: 0,
      colCount: 0,
      rawRowCount: 0,
      rawColCount: 0,
      bounded: false,
      rows: [],
      merges: []
    }
  }
  const range = XLSX.utils.decode_range(rawRef)
  const startRow = Math.max(0, range.s.r)
  const startCol = Math.max(0, range.s.c)
  const rawRowCount = Math.max(0, range.e.r - startRow + 1)
  const rawColCount = Math.max(0, range.e.c - startCol + 1)
  const rowCount = Math.min(rawRowCount, MAX_RENDER_ROWS)
  const colCount = Math.min(rawColCount, MAX_RENDER_COLS)
  const bounded = rawRowCount > MAX_RENDER_ROWS || rawColCount > MAX_RENDER_COLS

  const rows = new Array(rowCount)
  for (let rIdx = 0; rIdx < rowCount; rIdx++) {
    const absRow = startRow + rIdx
    const cells = new Array(colCount)
    for (let cIdx = 0; cIdx < colCount; cIdx++) {
      const absCol = startCol + cIdx
      cells[cIdx] = extractCellData(getWorksheetCell(ws, absRow, absCol), absRow, absCol)
    }
    rows[rIdx] = { absRow, cells }
  }

  const endRowIdx = rowCount - 1
  const endColIdx = colCount - 1
  const merges = []
  if (Array.isArray(ws['!merges'])) {
    for (const m of ws['!merges']) {
      if (!m?.s || !m?.e) continue
      const sr = m.s.r - startRow
      const sc = m.s.c - startCol
      const er = Math.min(m.e.r - startRow, endRowIdx)
      const ec = Math.min(m.e.c - startCol, endColIdx)
      if (sr < 0 || sc < 0 || sr > endRowIdx || sc > endColIdx) continue
      if (er < sr || ec < sc) continue
      if (er === sr && ec === sc) continue
      merges.push({ sr, sc, er, ec })
    }
  }

  return {
    empty: rowCount === 0 || colCount === 0,
    startRow,
    startCol,
    rowCount,
    colCount,
    rawRowCount,
    rawColCount,
    bounded,
    rows,
    merges
  }
}

function compareCells(a, b, dir, locale) {
  const emptyA = a.w.trim().length === 0 && a.numValue === null
  const emptyB = b.w.trim().length === 0 && b.numValue === null
  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  if (a.numValue !== null && b.numValue !== null && a.numValue !== b.numValue) {
    return dir * (a.numValue - b.numValue)
  }

  const cmp = a.w.localeCompare(b.w, locale || undefined, { numeric: true, sensitivity: 'base' })
  if (cmp !== 0) return dir * cmp
  return dir * a.w.localeCompare(b.w, locale || undefined, { numeric: true })
}

// ── Persistent DOM Shell ──
const toolbar = document.createElement('header')
toolbar.className = 'toolbar'

const toolbarLeft = document.createElement('div')
toolbarLeft.className = 'toolbar-left'

const searchWrap = document.createElement('div')
searchWrap.className = 'search-wrap'

const searchIcon = document.createElement('span')
searchIcon.className = 'search-icon'
searchIcon.append(iconSearch())

const filterInput = document.createElement('input')
filterInput.type = 'search'
filterInput.className = 'search-input'
filterInput.autocomplete = 'off'
filterInput.spellcheck = false

const clearFilterBtn = document.createElement('button')
clearFilterBtn.type = 'button'
clearFilterBtn.className = 'search-clear'
clearFilterBtn.hidden = true
clearFilterBtn.append(iconClear(11))

searchWrap.append(searchIcon, filterInput, clearFilterBtn)

const sortPill = document.createElement('button')
sortPill.type = 'button'
sortPill.className = 'sort-pill'
sortPill.hidden = true

const sortPillLabel = document.createElement('span')
sortPillLabel.className = 'sort-pill-label'
const sortPillDir = document.createElement('span')
sortPillDir.className = 'sort-pill-dir'
const sortPillDismiss = document.createElement('span')
sortPillDismiss.className = 'sort-pill-dismiss'
sortPillDismiss.append(iconClear(10))
sortPill.append(sortPillLabel, sortPillDir, sortPillDismiss)

const toggleGroup = document.createElement('div')
toggleGroup.className = 'toggle-group'

const headerBtn = document.createElement('button')
headerBtn.type = 'button'
headerBtn.className = 'toggle-btn'
headerBtn.setAttribute('aria-pressed', 'true')

const wrapBtn = document.createElement('button')
wrapBtn.type = 'button'
wrapBtn.className = 'toggle-btn'
wrapBtn.setAttribute('aria-pressed', 'false')

toggleGroup.append(headerBtn, wrapBtn)
toolbarLeft.append(searchWrap, sortPill, toggleGroup)

const toolbarRight = document.createElement('div')
toolbarRight.className = 'toolbar-right'

const boundedBadge = document.createElement('span')
boundedBadge.className = 'bounded-badge'
boundedBadge.hidden = true

const metaSummary = document.createElement('span')
metaSummary.className = 'meta-summary'

toolbarRight.append(boundedBadge, metaSummary)
toolbar.append(toolbarLeft, toolbarRight)

// Formula Bar
const formulaBar = document.createElement('div')
formulaBar.className = 'formula-bar'

const cellRefBadge = document.createElement('span')
cellRefBadge.className = 'cell-ref'
cellRefBadge.textContent = '—'

const fxIcon = document.createElement('span')
fxIcon.className = 'fx-icon'
fxIcon.append(iconFx())

const formulaKind = document.createElement('span')
formulaKind.className = 'formula-kind'
formulaKind.hidden = true

const formulaValue = document.createElement('span')
formulaValue.className = 'formula-value is-placeholder'

formulaBar.append(cellRefBadge, fxIcon, formulaKind, formulaValue)

// Grid Viewport
const gridWrap = document.createElement('main')
gridWrap.className = 'grid-wrap'

const table = document.createElement('table')
table.className = 'excel-table'
table.hidden = true
const thead = table.createTHead()
const headerRow = thead.insertRow()
const tbody = table.createTBody()

const loadMoreBar = document.createElement('div')
loadMoreBar.className = 'load-more-bar'
loadMoreBar.hidden = true

const loadMoreBtn = document.createElement('button')
loadMoreBtn.type = 'button'
loadMoreBtn.className = 'load-more-btn'
loadMoreBar.append(loadMoreBtn)

const statusOverlay = document.createElement('div')
statusOverlay.className = 'status-overlay'
statusOverlay.setAttribute('role', 'status')

const statusCard = document.createElement('div')
statusCard.className = 'status-card'
const statusIcon = document.createElement('span')
statusIcon.className = 'status-icon'
const statusText = document.createElement('p')
statusText.className = 'status-text'
const statusAction = document.createElement('button')
statusAction.type = 'button'
statusAction.className = 'status-action'
statusAction.hidden = true

statusCard.append(statusIcon, statusText, statusAction)
statusOverlay.append(statusCard)
gridWrap.append(table, loadMoreBar, statusOverlay)

// Bottom Sheet Bar
const sheetBar = document.createElement('footer')
sheetBar.className = 'sheet-bar'

const sheetTabs = document.createElement('div')
sheetTabs.className = 'sheet-tabs'
sheetTabs.setAttribute('role', 'tablist')

const sheetDims = document.createElement('span')
sheetDims.className = 'sheet-dims'

sheetBar.append(sheetTabs, sheetDims)

document.body.replaceChildren(toolbar, formulaBar, gridWrap, sheetBar)

// ── Viewer State ──
const state = {
  locale: 'en',
  localeKey: 'en',
  fileKey: null,
  workbook: null,
  sheetNames: [],
  sheetCache: new Map(),
  activeSheetIndex: 0,
  headerMode: true,
  wrapMode: false,
  filterQuery: '',
  sortCol: -1,
  sortDir: 1,
  visibleLimit: ROW_BATCH_SIZE,
  selectedPos: null, // { dataRowIdx, colIdx }
  statusKind: 'opening', // 'opening' | 'tooLargeBytes' | 'openFailed' | 'emptyWorkbook' | null
  closed: false,
  loadGen: 0
}

const getLabels = () => excelLabels(state.locale)
const fmtNum = n => new Intl.NumberFormat(state.locale || 'en').format(n)

function getActiveModel() {
  const name = state.sheetNames[state.activeSheetIndex]
  if (!name) return null
  if (!state.sheetCache.has(name)) {
    state.sheetCache.set(name, buildSheetModel(state.workbook?.Sheets?.[name]))
  }
  return state.sheetCache.get(name)
}

function getColumnTitle(model, colIdx) {
  const letter = XLSX.utils.encode_col(model.startCol + colIdx)
  if (!state.headerMode || !model.rows.length) return letter
  const headerText = model.rows[0]?.cells[colIdx]?.w?.trim()
  return headerText || letter
}

function getDataRows(model) {
  if (!model || model.empty) return []
  return state.headerMode ? model.rows.slice(1) : model.rows
}

function updateFormulaBar(model) {
  const l = getLabels()
  const dataRows = model ? getDataRows(model) : []
  const pos = state.selectedPos
  const cell = pos ? dataRows[pos.dataRowIdx]?.cells[pos.colIdx] : null

  if (!cell) {
    cellRefBadge.textContent = '—'
    formulaKind.hidden = true
    formulaKind.className = 'formula-kind'
    formulaValue.textContent = l.selectCell
    formulaValue.title = ''
    formulaValue.className = 'formula-value is-placeholder'
    return
  }

  cellRefBadge.textContent = cell.ref
  if (cell.f) {
    formulaKind.hidden = false
    formulaKind.textContent = l.formula
    formulaKind.className = 'formula-kind is-formula'
    const display = cell.w ? `${cell.f}  →  ${cell.w}` : cell.f
    formulaValue.textContent = display
    formulaValue.title = display
    formulaValue.className = 'formula-value is-formula'
  } else {
    formulaKind.hidden = false
    formulaKind.textContent = l.value
    formulaKind.className = 'formula-kind'
    formulaValue.textContent = cell.w || '—'
    formulaValue.title = cell.w || ''
    formulaValue.className = cell.w ? 'formula-value' : 'formula-value is-placeholder'
  }
}

function syncToolbarLabels(model) {
  const l = getLabels()
  filterInput.placeholder = l.filterPlaceholder
  filterInput.setAttribute('aria-label', l.filterAriaLabel)
  clearFilterBtn.setAttribute('aria-label', l.clearFilter)
  clearFilterBtn.title = l.clearFilter
  clearFilterBtn.hidden = !state.filterQuery

  headerBtn.textContent = l.headerRow
  headerBtn.title = l.headerRowTitle
  headerBtn.setAttribute('aria-pressed', String(state.headerMode))
  headerBtn.disabled = !model || model.empty

  wrapBtn.textContent = l.wrap
  wrapBtn.title = l.wrapTitle
  wrapBtn.setAttribute('aria-pressed', String(state.wrapMode))
  wrapBtn.disabled = !model || model.empty

  sheetTabs.setAttribute('aria-label', l.sheets)
  statusAction.textContent = l.clearFilter

  if (model && !model.empty && state.sortCol >= 0 && state.sortCol < model.colCount) {
    const colTitle = getColumnTitle(model, state.sortCol)
    sortPillLabel.textContent = colTitle
    sortPillDir.replaceChildren(state.sortDir === 1 ? iconSortAsc(11) : iconSortDesc(11))
    const tip = l.clearSortColumn(colTitle)
    sortPill.setAttribute('aria-label', tip)
    sortPill.title = tip
    sortPill.hidden = false
  } else {
    sortPill.hidden = true
  }

  if (model?.bounded) {
    boundedBadge.hidden = false
    boundedBadge.textContent = `${fmtNum(MAX_RENDER_ROWS)}×${fmtNum(MAX_RENDER_COLS)}`
    boundedBadge.title = l.boundedNotice(fmtNum(MAX_RENDER_ROWS), fmtNum(MAX_RENDER_COLS))
  } else {
    boundedBadge.hidden = true
  }
}

function showOverlay(kind, message, { tone = 'neutral', showClearFilter = false } = {}) {
  statusOverlay.hidden = false
  statusOverlay.dataset.tone = tone
  statusText.textContent = message
  statusAction.hidden = !showClearFilter
  if (kind === 'opening') {
    statusIcon.replaceChildren(iconSpinner())
  } else if (kind === 'error') {
    statusIcon.replaceChildren(iconError())
  } else if (kind === 'search') {
    statusIcon.replaceChildren(iconEmptySearch())
  } else {
    statusIcon.replaceChildren(iconEmptySheet())
  }
}

function hideOverlay() {
  statusOverlay.hidden = true
  delete statusOverlay.dataset.tone
}

function buildMergeLookup(model, rowOffset, visibleCount) {
  const originMap = new Map()
  const covered = new Set()
  const lastRowIdx = rowOffset + visibleCount - 1
  for (const m of model.merges) {
    if (m.sr < rowOffset || m.sr > lastRowIdx) continue
    const er = Math.min(m.er, lastRowIdx)
    const rowSpan = er - m.sr + 1
    const colSpan = m.ec - m.sc + 1
    if (rowSpan <= 1 && colSpan <= 1) continue
    originMap.set(`${m.sr}:${m.sc}`, { rowSpan, colSpan })
    for (let r = m.sr; r <= er; r++) {
      for (let c = m.sc; c <= m.ec; c++) {
        if (r !== m.sr || c !== m.sc) covered.add(`${r}:${c}`)
      }
    }
  }
  return { originMap, covered }
}

function renderSheetTabs() {
  sheetTabs.replaceChildren()
  for (let i = 0; i < state.sheetNames.length; i++) {
    const name = state.sheetNames[i]
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'sheet-tab'
    btn.setAttribute('role', 'tab')
    const active = i === state.activeSheetIndex
    btn.setAttribute('aria-selected', String(active))
    btn.tabIndex = active ? 0 : -1
    btn.title = name

    const span = document.createElement('span')
    span.className = 'sheet-tab-label'
    span.textContent = name
    btn.append(span)

    btn.onclick = () => switchSheet(i)
    btn.onkeydown = event => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        switchSheet((i + 1) % state.sheetNames.length, true)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        switchSheet((i - 1 + state.sheetNames.length) % state.sheetNames.length, true)
      }
    }
    sheetTabs.append(btn)
  }
}

function renderGrid() {
  const l = getLabels()
  const model = state.workbook ? getActiveModel() : null
  syncToolbarLabels(model)
  gridWrap.classList.toggle('is-wrap', state.wrapMode)

  if (state.statusKind) {
    table.hidden = true
    loadMoreBar.hidden = true
    metaSummary.textContent = ''
    sheetDims.textContent = ''
    updateFormulaBar(null)
    const isErr = state.statusKind === 'tooLargeBytes' || state.statusKind === 'openFailed'
    showOverlay(isErr ? 'error' : state.statusKind, l[state.statusKind], {
      tone: isErr ? 'error' : 'neutral'
    })
    return
  }

  if (!model || model.empty) {
    table.hidden = true
    tbody.replaceChildren()
    headerRow.replaceChildren()
    loadMoreBar.hidden = true
    metaSummary.textContent = `0 ${l.rows} · 0 ${l.cols}`
    sheetDims.textContent = '0 × 0'
    updateFormulaBar(null)
    showOverlay('empty', l.emptySheet)
    return
  }

  const dataRows = getDataRows(model)
  const totalDataRows = dataRows.length
  const colCount = model.colCount
  const query = state.filterQuery.trim().toLocaleLowerCase()
  const hasFilter = query.length > 0
  const hasSort = state.sortCol >= 0 && state.sortCol < colCount

  let indexedRows = dataRows.map((row, idx) => ({ row, dataRowIdx: idx }))
  if (hasFilter) {
    indexedRows = indexedRows.filter(({ row }) =>
      row.cells.some(cell => cell.w.toLocaleLowerCase().includes(query) || cell.f.toLocaleLowerCase().includes(query))
    )
  }
  if (hasSort) {
    const col = state.sortCol
    const dir = state.sortDir
    const loc = state.locale
    indexedRows = [...indexedRows].sort((a, b) => compareCells(a.row.cells[col], b.row.cells[col], dir, loc))
  }

  const matchedCount = indexedRows.length
  const shownCount = Math.min(matchedCount, state.visibleLimit)

  // Summary counters
  const rowWord = totalDataRows === 1 ? l.rowSingular : l.rows
  const colWord = colCount === 1 ? l.colSingular : l.cols
  if (hasFilter) {
    metaSummary.textContent =
      l.of === '/'
        ? `${fmtNum(matchedCount)} / ${fmtNum(totalDataRows)} ${rowWord} · ${fmtNum(colCount)} ${colWord}`
        : `${fmtNum(matchedCount)} ${l.of} ${fmtNum(totalDataRows)} ${rowWord} · ${fmtNum(colCount)} ${colWord}`
  } else {
    metaSummary.textContent = `${fmtNum(totalDataRows)} ${rowWord} · ${fmtNum(colCount)} ${colWord}`
  }
  sheetDims.textContent = `${fmtNum(model.rawRowCount)} × ${fmtNum(model.rawColCount)}`

  // Rebuild column headers
  headerRow.replaceChildren()
  const cornerTh = document.createElement('th')
  cornerTh.scope = 'col'
  cornerTh.className = 'row-gutter-head'
  cornerTh.textContent = '#'
  headerRow.append(cornerTh)

  for (let c = 0; c < colCount; c++) {
    const th = document.createElement('th')
    th.scope = 'col'
    th.className = 'col-head'
    if (!state.headerMode) th.classList.add('is-letter-mode')
    if (state.selectedPos?.colIdx === c) th.classList.add('is-selected-col')
    const sorted = c === state.sortCol
    if (sorted) {
      th.classList.add('is-sorted')
      th.setAttribute('aria-sort', state.sortDir === 1 ? 'ascending' : 'descending')
    }

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'col-head-btn'

    const labelText = getColumnTitle(model, c)
    const labelSpan = document.createElement('span')
    labelSpan.className = 'col-head-label'
    labelSpan.textContent = labelText
    if (labelText.length > 20) labelSpan.title = labelText

    const sortIconSlot = document.createElement('span')
    sortIconSlot.className = 'col-sort-icon'
    sortIconSlot.append(
      sorted ? (state.sortDir === 1 ? iconSortAsc() : iconSortDesc()) : iconSortIdle()
    )

    btn.append(labelSpan, sortIconSlot)
    btn.onclick = () => {
      if (state.sortCol === c) {
        if (state.sortDir === 1) state.sortDir = -1
        else {
          state.sortCol = -1
          state.sortDir = 1
        }
      } else {
        state.sortCol = c
        state.sortDir = 1
      }
      renderGrid()
    }
    th.append(btn)
    headerRow.append(th)
  }

  // Empty search / zero data rows state
  if (matchedCount === 0) {
    table.hidden = !hasFilter && !state.headerMode
    tbody.replaceChildren()
    loadMoreBar.hidden = true
    updateFormulaBar(model)
    if (hasFilter) {
      showOverlay('search', l.noMatchingRows, { showClearFilter: true })
    } else {
      showOverlay('empty', l.emptySheet)
    }
    return
  }

  hideOverlay()
  table.hidden = false

  // Merge geometry only applies in natural unsorted/unfiltered order
  const canMerge = !hasFilter && !hasSort && model.merges.length > 0
  const rowOffset = state.headerMode ? 1 : 0
  const mergeInfo = canMerge ? buildMergeLookup(model, rowOffset, shownCount) : null

  const fragment = document.createDocumentFragment()
  for (let i = 0; i < shownCount; i++) {
    const { row, dataRowIdx } = indexedRows[i]
    const tr = document.createElement('tr')
    tr.dataset.dataRowIdx = String(dataRowIdx)
    const isRowSelected = state.selectedPos?.dataRowIdx === dataRowIdx
    if (isRowSelected) tr.classList.add('is-selected-row')

    const rowTh = document.createElement('th')
    rowTh.scope = 'row'
    rowTh.className = 'row-num'
    rowTh.textContent = String(row.absRow + 1)
    tr.append(rowTh)

    const sheetRowIdx = rowOffset + dataRowIdx
    for (let c = 0; c < colCount; c++) {
      if (mergeInfo?.covered.has(`${sheetRowIdx}:${c}`)) continue
      const cell = row.cells[c]
      const td = document.createElement('td')
      td.className = 'cell'
      td.tabIndex = -1
      td.dataset.dataRowIdx = String(dataRowIdx)
      td.dataset.colIdx = String(c)

      const span = mergeInfo?.originMap.get(`${sheetRowIdx}:${c}`)
      if (span) {
        if (span.colSpan > 1) td.colSpan = span.colSpan
        if (span.rowSpan > 1) td.rowSpan = span.rowSpan
        td.classList.add('is-merged')
      }

      if (cell.isNumericAlign) td.classList.add('is-numeric')
      if (cell.t === 'b') td.classList.add('is-bool')
      if (cell.t === 'e') td.classList.add('is-error')
      if (cell.f) td.classList.add('is-formula')
      if (c === state.sortCol) td.classList.add('is-sorted')
      if (isRowSelected && state.selectedPos?.colIdx === c) td.classList.add('is-selected')

      td.textContent = cell.w
      if (cell.w.length > 28 || cell.f) {
        td.title = cell.f ? `${cell.f}\n${cell.w}` : cell.w
      }
      tr.append(td)
    }
    fragment.append(tr)
  }
  tbody.replaceChildren(fragment)

  if (matchedCount > shownCount) {
    const remaining = matchedCount - shownCount
    loadMoreBtn.textContent = l.loadMoreRows(
      fmtNum(remaining),
      fmtNum(ROW_BATCH_SIZE),
      remaining,
      ROW_BATCH_SIZE
    )
    loadMoreBar.hidden = false
  } else {
    loadMoreBar.hidden = true
  }

  updateFormulaBar(model)
}

function selectCell(dataRowIdx, colIdx, focusCell = false) {
  const model = getActiveModel()
  if (!model || model.empty) return
  const dataRows = getDataRows(model)
  if (dataRowIdx < 0 || dataRowIdx >= dataRows.length || colIdx < 0 || colIdx >= model.colCount) return

  state.selectedPos = { dataRowIdx, colIdx }

  // Update visual selection without rebuilding table
  tbody.querySelectorAll('td.cell.is-selected').forEach(el => el.classList.remove('is-selected'))
  tbody.querySelectorAll('tr.is-selected-row').forEach(el => el.classList.remove('is-selected-row'))
  headerRow.querySelectorAll('th.col-head.is-selected-col').forEach(el => el.classList.remove('is-selected-col'))

  const targetTd = tbody.querySelector(
    `td.cell[data-data-row-idx="${dataRowIdx}"][data-col-idx="${colIdx}"]`
  )
  if (targetTd) {
    targetTd.classList.add('is-selected')
    targetTd.closest('tr')?.classList.add('is-selected-row')
    if (focusCell) targetTd.focus({ preventScroll: false })
  }
  const colTh = headerRow.querySelectorAll('th.col-head')[colIdx]
  colTh?.classList.add('is-selected-col')

  updateFormulaBar(model)
}

function pickInitialSelection(model) {
  const dataRows = getDataRows(model)
  if (!dataRows.length || !model.colCount) return null
  const scanRows = Math.min(dataRows.length, 25)
  // Prefer the first formula cell near the top so formula bar immediately showcases fx if present
  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < model.colCount; c++) {
      if (dataRows[r].cells[c]?.f) return { dataRowIdx: r, colIdx: c }
    }
  }
  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < model.colCount; c++) {
      if (dataRows[r].cells[c]?.w) return { dataRowIdx: r, colIdx: c }
    }
  }
  return { dataRowIdx: 0, colIdx: 0 }
}

function switchSheet(index, focusTab = false) {
  if (index < 0 || index >= state.sheetNames.length) return
  if (index === state.activeSheetIndex && sheetTabs.childElementCount > 0) return
  state.activeSheetIndex = index
  state.sortCol = -1
  state.sortDir = 1
  state.visibleLimit = ROW_BATCH_SIZE
  gridWrap.scrollTop = 0
  gridWrap.scrollLeft = 0

  const model = getActiveModel()
  state.selectedPos = model && !model.empty ? pickInitialSelection(model) : null
  renderSheetTabs()
  if (focusTab) {
    sheetTabs.querySelectorAll('.sheet-tab')[index]?.focus()
  }
  renderGrid()
}

// ── Event Handlers ──
filterInput.addEventListener('input', () => {
  state.filterQuery = filterInput.value
  state.visibleLimit = ROW_BATCH_SIZE
  renderGrid()
})

filterInput.addEventListener('keydown', event => {
  if (event.key === 'Escape' && filterInput.value) {
    event.preventDefault()
    filterInput.value = ''
    state.filterQuery = ''
    renderGrid()
  }
})

function clearFilter() {
  filterInput.value = ''
  state.filterQuery = ''
  state.visibleLimit = ROW_BATCH_SIZE
  renderGrid()
  filterInput.focus()
}

clearFilterBtn.addEventListener('click', clearFilter)
statusAction.addEventListener('click', clearFilter)

sortPill.addEventListener('click', () => {
  state.sortCol = -1
  state.sortDir = 1
  renderGrid()
})

headerBtn.addEventListener('click', () => {
  const model = getActiveModel()
  if (!model || model.empty) return
  state.headerMode = !state.headerMode
  state.visibleLimit = ROW_BATCH_SIZE
  state.selectedPos = pickInitialSelection(model)
  renderGrid()
})

wrapBtn.addEventListener('click', () => {
  state.wrapMode = !state.wrapMode
  syncToolbarLabels(getActiveModel())
  gridWrap.classList.toggle('is-wrap', state.wrapMode)
})

loadMoreBtn.addEventListener('click', () => {
  state.visibleLimit += ROW_BATCH_SIZE
  renderGrid()
})

tbody.addEventListener('click', event => {
  const td = event.target.closest('td.cell')
  if (!td) return
  const r = Number(td.dataset.dataRowIdx)
  const c = Number(td.dataset.colIdx)
  if (Number.isInteger(r) && Number.isInteger(c)) {
    selectCell(r, c, true)
  }
})

tbody.addEventListener('keydown', event => {
  if (!state.selectedPos) return
  const deltas = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  }
  const delta = deltas[event.key]
  if (!delta) return
  const model = getActiveModel()
  if (!model || model.empty) return
  const currentTd = tbody.querySelector(
    `td.cell[data-data-row-idx="${state.selectedPos.dataRowIdx}"][data-col-idx="${state.selectedPos.colIdx}"]`
  )
  const tr = currentTd?.closest('tr')
  if (!tr) return
  event.preventDefault()

  if (delta[1] !== 0) {
    const nextCol = Math.max(0, Math.min(model.colCount - 1, state.selectedPos.colIdx + delta[1]))
    selectCell(state.selectedPos.dataRowIdx, nextCol, true)
    return
  }

  const targetTr = delta[0] < 0 ? tr.previousElementSibling : tr.nextElementSibling
  if (!targetTr) return
  const nextDataRowIdx = Number(targetTr.dataset.dataRowIdx)
  if (Number.isInteger(nextDataRowIdx)) {
    selectCell(nextDataRowIdx, state.selectedPos.colIdx, true)
  }
})

// ── Workbook Loading & Vani Bridge ──
async function readWorkbookBytes(plugin, file, token) {
  const buffer = new Uint8Array(file.size)
  let offset = 0
  let lastRead = -Infinity
  while (offset < file.size) {
    if (state.closed || token !== state.loadGen) return null
    const delay = MIN_READ_INTERVAL_MS - (performance.now() - lastRead)
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
    if (state.closed || token !== state.loadGen) return null
    const length = Math.min(CHUNK_SIZE, file.size - offset)
    lastRead = performance.now()
    const chunk = await plugin.readActiveBytes(offset, length)
    if (state.closed || token !== state.loadGen) return null
    if (!(chunk instanceof ArrayBuffer) || chunk.byteLength !== length) {
      throw new Error('Incomplete workbook byte range')
    }
    buffer.set(new Uint8Array(chunk), offset)
    offset += length
  }
  return buffer
}

async function openFile(plugin, file) {
  const key = file ? `${file.path || ''}\0${file.version || ''}\0${file.size ?? ''}` : ''
  if (key && key === state.fileKey) return
  state.fileKey = key
  const token = ++state.loadGen

  state.workbook = null
  state.sheetNames = []
  state.sheetCache.clear()
  state.activeSheetIndex = 0
  state.sortCol = -1
  state.sortDir = 1
  state.filterQuery = ''
  filterInput.value = ''
  state.visibleLimit = ROW_BATCH_SIZE
  state.selectedPos = null
  sheetTabs.replaceChildren()

  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 || !file.version) {
    state.statusKind = 'openFailed'
    renderGrid()
    return
  }
  if (file.size > MAX_BYTES) {
    state.statusKind = 'tooLargeBytes'
    renderGrid()
    return
  }

  state.statusKind = 'opening'
  renderGrid()

  try {
    const bytes = await readWorkbookBytes(plugin, file, token)
    if (!bytes || state.closed || token !== state.loadGen) return

    const wb = XLSX.read(bytes, {
      type: 'array',
      cellFormula: true,
      cellNF: true,
      cellDates: true,
      cellStyles: true
    })
    if (state.closed || token !== state.loadGen) return

    state.workbook = wb
    state.sheetNames = Array.isArray(wb.SheetNames) ? wb.SheetNames : []
    if (state.sheetNames.length === 0) {
      state.statusKind = 'emptyWorkbook'
      renderGrid()
      return
    }

    state.statusKind = null
    state.activeSheetIndex = 0
    const model = getActiveModel()
    state.selectedPos = model && !model.empty ? pickInitialSelection(model) : null
    renderSheetTabs()
    renderGrid()
  } catch {
    if (state.closed || token !== state.loadGen) return
    state.statusKind = 'openFailed'
    renderGrid()
  }
}

function applyTheme(theme) {
  if (!theme) return
  const nextLocale = theme.locale || 'en'
  const nextKey = resolveLocale(nextLocale)
  const changed = nextLocale !== state.locale || nextKey !== state.localeKey
  state.locale = nextLocale
  state.localeKey = nextKey
  if (changed) {
    renderGrid()
  }
}

window.addEventListener(
  'pagehide',
  () => {
    state.closed = true
    state.loadGen++
    state.workbook = null
    state.sheetCache.clear()
  },
  { once: true }
)

const plugin = window.vaniPlugin
const { context, theme } = await plugin.init
applyTheme(theme)
syncToolbarLabels(null)
renderGrid()

plugin.onTheme(applyTheme)
plugin.onContext(updated => {
  if (updated?.activeFile) void openFile(plugin, updated.activeFile)
})

// Notify host immediately after mounting the loading shell so large workbooks never hit the 5s watchdog.
plugin.ready()
void openFile(plugin, context?.activeFile)
