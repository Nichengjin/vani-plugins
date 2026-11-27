import type { PluginActiveFile, PluginBridgeApi, PluginContext, PluginThemeSnapshot } from '@vani/extension-contracts'
import './table.css'

const plugin = (window as Window & { vaniPlugin: PluginBridgeApi }).vaniPlugin

const DISPLAY_LIMIT = 500
const TYPE_SAMPLE_LIMIT = 200
const SVG_NS = 'http://www.w3.org/2000/svg'

type LocaleKey = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'fr'

interface Labels {
  filterPlaceholder: string
  filterAriaLabel: string
  clearFilter: string
  clearSort: (column: string) => string
  rowsCount: (total: string, rawTotal: number) => string
  filteredRowsCount: (matched: string, total: string) => string
  cappedRowsCount: (shown: string, matched: string) => string
  columnsCount: (count: string, rawCount: number) => string
  truncatedBadge: string
  truncatedTitle: string
  emptyFile: string
  noDataRows: string
  noMatches: (query: string) => string
  cappedNotice: (shown: string, matched: string) => string
}

const LABELS: Record<LocaleKey, Labels> = {
  en: {
    filterPlaceholder: 'Filter rows…',
    filterAriaLabel: 'Filter rows',
    clearFilter: 'Clear filter',
    clearSort: column => `Reset sort (${column})`,
    rowsCount: (total, raw) => (raw === 1 ? '1 row' : `${total} rows`),
    filteredRowsCount: (matched, total) => `${matched} of ${total} rows`,
    cappedRowsCount: (shown, matched) => `${shown} / ${matched} rows`,
    columnsCount: (count, raw) => (raw === 1 ? '1 column' : `${count} columns`),
    truncatedBadge: 'Truncated',
    truncatedTitle: 'Showing the loaded portion of a large file',
    emptyFile: 'This CSV file is empty.',
    noDataRows: 'This CSV file has no data rows.',
    noMatches: query => `No rows match “${query}”`,
    cappedNotice: (shown, matched) => `Showing the first ${shown} of ${matched} rows. Filter to narrow results.`
  },
  'zh-CN': {
    filterPlaceholder: '筛选行…',
    filterAriaLabel: '筛选行',
    clearFilter: '清除筛选',
    clearSort: column => `取消按「${column}」排序`,
    rowsCount: total => `${total} 行`,
    filteredRowsCount: (matched, total) => `${matched} / ${total} 行`,
    cappedRowsCount: (shown, matched) => `${shown} / ${matched} 行`,
    columnsCount: count => `${count} 列`,
    truncatedBadge: '已截断',
    truncatedTitle: '文件较大，当前仅显示已加载部分',
    emptyFile: '此 CSV 文件为空。',
    noDataRows: '此 CSV 文件没有数据行。',
    noMatches: query => `没有匹配“${query}”的行`,
    cappedNotice: (shown, matched) => `当前显示前 ${shown} 行（共 ${matched} 行），可使用筛选缩小范围。`
  },
  'zh-TW': {
    filterPlaceholder: '篩選列…',
    filterAriaLabel: '篩選列',
    clearFilter: '清除篩選',
    clearSort: column => `取消依「${column}」排序`,
    rowsCount: total => `${total} 列`,
    filteredRowsCount: (matched, total) => `${matched} / ${total} 列`,
    cappedRowsCount: (shown, matched) => `${shown} / ${matched} 列`,
    columnsCount: count => `${count} 欄`,
    truncatedBadge: '已截斷',
    truncatedTitle: '檔案較大，目前僅顯示已載入部分',
    emptyFile: '此 CSV 檔案為空。',
    noDataRows: '此 CSV 檔案沒有資料列。',
    noMatches: query => `沒有符合「${query}」的列`,
    cappedNotice: (shown, matched) => `目前顯示前 ${shown} 列（共 ${matched} 列），可使用篩選縮小範圍。`
  },
  ja: {
    filterPlaceholder: '行を絞り込む…',
    filterAriaLabel: '行を絞り込む',
    clearFilter: '絞り込みを解除',
    clearSort: column => `「${column}」の並び替えを解除`,
    rowsCount: total => `${total} 行`,
    filteredRowsCount: (matched, total) => `${matched} / ${total} 行`,
    cappedRowsCount: (shown, matched) => `${shown} / ${matched} 行`,
    columnsCount: count => `${count} 列`,
    truncatedBadge: '一部のみ表示',
    truncatedTitle: 'ファイルが大きいため、読み込んだ部分のみ表示しています',
    emptyFile: 'この CSV ファイルは空です。',
    noDataRows: 'この CSV ファイルにデータ行はありません。',
    noMatches: query => `「${query}」に一致する行はありません`,
    cappedNotice: (shown, matched) => `全 ${matched} 行のうち先頭 ${shown} 行を表示しています。絞り込みで対象を絞れます。`
  },
  fr: {
    filterPlaceholder: 'Filtrer les lignes…',
    filterAriaLabel: 'Filtrer les lignes',
    clearFilter: 'Effacer le filtre',
    clearSort: column => `Réinitialiser le tri (${column})`,
    rowsCount: (total, raw) => (raw === 1 ? '1 ligne' : `${total} lignes`),
    filteredRowsCount: (matched, total) => `${matched} sur ${total} lignes`,
    cappedRowsCount: (shown, matched) => `${shown} / ${matched} lignes`,
    columnsCount: (count, raw) => (raw === 1 ? '1 colonne' : `${count} colonnes`),
    truncatedBadge: 'Tronqué',
    truncatedTitle: 'Affichage de la partie chargée d’un fichier volumineux',
    emptyFile: 'Ce fichier CSV est vide.',
    noDataRows: 'Ce fichier CSV ne contient aucune ligne de données.',
    noMatches: query => `Aucune ligne ne correspond à « ${query} »`,
    cappedNotice: (shown, matched) => `Affichage des ${shown} premières lignes sur ${matched}. Filtrez pour affiner les résultats.`
  }
}

function resolveLocale(locale: string | undefined): LocaleKey {
  if (!locale) return 'en'
  if (/^zh/iu.test(locale)) return /TW|HK|MO|Hant/iu.test(locale) ? 'zh-TW' : 'zh-CN'
  const base = locale.split('-')[0]?.toLowerCase()
  if (base === 'ja' || base === 'fr') return base
  return 'en'
}

function createSvg(
  viewBox: string,
  width: number,
  height: number,
  paths: string[],
  strokeWidth = 1.75
): SVGSVGElement {
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
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

const iconSearch = () => createSvg('0 0 16 16', 14, 14, ['M7.25 12.5a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Z', 'M13.5 13.5l-2.6-2.6'], 1.75)
const iconClear = (size = 12) => createSvg('0 0 12 12', size, size, ['M3 3l6 6', 'M9 3l-6 6'], 1.7)
const iconSortIdle = () => createSvg('0 0 12 12', 12, 12, ['M3.5 4.75L6 2.25L8.5 4.75', 'M3.5 7.25L6 9.75L8.5 7.25'], 1.5)
const iconSortAsc = (size = 12) => createSvg('0 0 12 12', size, size, ['M6 9.5V2.5', 'M3.25 5.25L6 2.5L8.75 5.25'], 1.65)
const iconSortDesc = (size = 12) => createSvg('0 0 12 12', size, size, ['M6 2.5V9.5', 'M3.25 6.75L6 9.5L8.75 6.75'], 1.65)
const iconEmptyTable = () => createSvg(
  '0 0 24 24',
  28,
  28,
  ['M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z', 'M4 9.5h16', 'M4 14.5h16', 'M9.5 9.5V20'],
  1.5
)
const iconEmptySearch = () => createSvg(
  '0 0 24 24',
  28,
  28,
  ['M10.75 18a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5Z', 'M20 20l-4.1-4.1', 'M8.5 10.75h4.5'],
  1.5
)

function parseCsv(raw: string): string[][] {
  if (!raw) return []
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  if (!text.trim()) return []
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"' && (quoted || !cell)) {
      if (quoted && text[i + 1] === '"') {
        cell += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (!quoted && char === ',') {
      row.push(cell)
      cell = ''
    } else if (!quoted && (char === '\r' || char === '\n')) {
      if (char === '\r' && text[i + 1] === '\n') i++
      rows.push([...row, cell])
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (row.length || cell || text.endsWith(',')) rows.push([...row, cell])
  return rows
}

const NUMERIC_PATTERN = /^([+-])?\s*([$€£¥₹₩])?\s*([+-])?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(%)?$/u
const PLACEHOLDER_CELL = /^(?:-|—|–|n\/a|na|null|none|nan)$/iu

function parseNumericValue(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = NUMERIC_PATTERN.exec(trimmed)
  if (!match) return null
  const [, leadingSign, currency, innerSign, digits, percent] = match
  if (leadingSign && innerSign) return null
  if (currency && percent) return null
  if (!digits) return null
  // Keep leading-zero codes (e.g. postal codes like "02138") as text rather than numbers.
  if (/^0\d/u.test(digits)) return null
  const sign = (leadingSign ?? innerSign) === '-' ? -1 : 1
  const numeric = Number(digits.replaceAll(',', ''))
  if (!Number.isFinite(numeric)) return null
  return sign * numeric
}

function detectNumericColumns(columnCount: number, rows: string[][]): boolean[] {
  const result = new Array<boolean>(columnCount).fill(false)
  for (let col = 0; col < columnCount; col++) {
    let sampled = 0
    let numeric = 0
    for (let r = 0; r < rows.length && sampled < TYPE_SAMPLE_LIMIT; r++) {
      const value = (rows[r]?.[col] ?? '').trim()
      if (!value || PLACEHOLDER_CELL.test(value)) continue
      sampled++
      if (parseNumericValue(value) !== null) numeric++
    }
    result[col] = sampled > 0 && numeric / sampled >= 0.8
  }
  return result
}

interface TableState {
  locale: string
  localeKey: LocaleKey
  fileKey: string | null
  filePath: string | null
  truncated: boolean
  headers: string[]
  rows: string[][]
  numericCols: boolean[]
  sortColumn: number
  sortDirection: 1 | -1
}

const state: TableState = {
  locale: 'en',
  localeKey: 'en',
  fileKey: null,
  filePath: null,
  truncated: false,
  headers: [],
  rows: [],
  numericCols: [],
  sortColumn: -1,
  sortDirection: 1
}

const labels = (): Labels => LABELS[state.localeKey]
const formatNumber = (value: number): string => new Intl.NumberFormat(state.locale || 'en').format(value)

// Persistent layout nodes
const toolbar = document.createElement('header')
toolbar.className = 'csv-toolbar'

const searchWrap = document.createElement('div')
searchWrap.className = 'csv-search'

const searchIcon = document.createElement('span')
searchIcon.className = 'csv-search-icon'
searchIcon.append(iconSearch())

const filterInput = document.createElement('input')
filterInput.type = 'search'
filterInput.className = 'csv-search-input'
filterInput.autocomplete = 'off'
filterInput.spellcheck = false

const clearFilterButton = document.createElement('button')
clearFilterButton.type = 'button'
clearFilterButton.className = 'csv-search-clear'
clearFilterButton.hidden = true
clearFilterButton.append(iconClear(12))

searchWrap.append(searchIcon, filterInput, clearFilterButton)

const metaCluster = document.createElement('div')
metaCluster.className = 'csv-meta'

const sortPill = document.createElement('button')
sortPill.type = 'button'
sortPill.className = 'csv-sort-pill'
sortPill.hidden = true

const sortPillLabel = document.createElement('span')
sortPillLabel.className = 'csv-sort-pill-label'
const sortPillDir = document.createElement('span')
sortPillDir.className = 'csv-sort-pill-dir'
const sortPillDismiss = document.createElement('span')
sortPillDismiss.className = 'csv-sort-pill-dismiss'
sortPillDismiss.append(iconClear(10))
sortPill.append(sortPillLabel, sortPillDir, sortPillDismiss)

const truncatedBadge = document.createElement('span')
truncatedBadge.className = 'csv-badge-truncated'
truncatedBadge.hidden = true

const rowsMeta = document.createElement('span')
rowsMeta.className = 'csv-meta-rows'

const colsSep = document.createElement('span')
colsSep.className = 'csv-meta-sep'
colsSep.textContent = '·'
colsSep.setAttribute('aria-hidden', 'true')

const colsMeta = document.createElement('span')
colsMeta.className = 'csv-meta-cols'

metaCluster.append(sortPill, truncatedBadge, rowsMeta, colsSep, colsMeta)
toolbar.append(searchWrap, metaCluster)

const viewport = document.createElement('main')
viewport.className = 'csv-viewport'

const table = document.createElement('table')
table.className = 'csv-table'
const thead = table.createTHead()
const headerRow = thead.insertRow()
const tbody = table.createTBody()

const cappedNote = document.createElement('div')
cappedNote.className = 'csv-capped-note'
cappedNote.hidden = true

const emptyState = document.createElement('div')
emptyState.className = 'csv-empty'
emptyState.hidden = true

const emptyIcon = document.createElement('div')
emptyIcon.className = 'csv-empty-icon'

const emptyMessage = document.createElement('p')
emptyMessage.className = 'csv-empty-message'

const emptyAction = document.createElement('button')
emptyAction.type = 'button'
emptyAction.className = 'csv-empty-action'
emptyAction.hidden = true

emptyState.append(emptyIcon, emptyMessage, emptyAction)
viewport.append(table, cappedNote, emptyState)

interface HeaderControl {
  th: HTMLTableCellElement
  iconSlot: HTMLSpanElement
}

let headerControls: HeaderControl[] = []

function syncHeaderStates(): void {
  for (let i = 0; i < headerControls.length; i++) {
    const control = headerControls[i]
    if (!control) continue
    const active = i === state.sortColumn
    control.th.classList.toggle('is-sorted', active)
    if (active) {
      control.th.setAttribute('aria-sort', state.sortDirection === 1 ? 'ascending' : 'descending')
      control.iconSlot.replaceChildren(state.sortDirection === 1 ? iconSortAsc() : iconSortDesc())
    } else {
      control.th.removeAttribute('aria-sort')
      control.iconSlot.replaceChildren(iconSortIdle())
    }
  }
}

function syncToolbarLabels(): void {
  const l = labels()
  filterInput.placeholder = l.filterPlaceholder
  filterInput.setAttribute('aria-label', l.filterAriaLabel)
  clearFilterButton.setAttribute('aria-label', l.clearFilter)
  clearFilterButton.title = l.clearFilter
  truncatedBadge.textContent = l.truncatedBadge
  truncatedBadge.title = l.truncatedTitle
  emptyAction.textContent = l.clearFilter

  if (state.sortColumn >= 0 && state.sortColumn < state.headers.length) {
    const title = state.headers[state.sortColumn] || `#${state.sortColumn + 1}`
    sortPillLabel.textContent = title
    sortPillDir.replaceChildren(state.sortDirection === 1 ? iconSortAsc(11) : iconSortDesc(11))
    const label = l.clearSort(title)
    sortPill.setAttribute('aria-label', label)
    sortPill.title = label
    sortPill.hidden = false
  } else {
    sortPill.hidden = true
  }
}

function rebuildHeaders(): void {
  headerRow.replaceChildren()
  headerControls = []
  for (let index = 0; index < state.headers.length; index++) {
    const title = state.headers[index] ?? ''
    const th = document.createElement('th')
    th.scope = 'col'
    if (state.numericCols[index]) th.classList.add('is-numeric')

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'csv-th-btn'

    const labelSpan = document.createElement('span')
    labelSpan.className = 'csv-th-label'
    labelSpan.textContent = title
    if (title.length > 24) labelSpan.title = title

    const iconSlot = document.createElement('span')
    iconSlot.className = 'csv-sort-icon'
    iconSlot.setAttribute('aria-hidden', 'true')
    iconSlot.append(iconSortIdle())

    button.append(labelSpan, iconSlot)
    button.onclick = () => {
      state.sortDirection = state.sortColumn === index ? (state.sortDirection === 1 ? -1 : 1) : 1
      state.sortColumn = index
      syncHeaderStates()
      syncToolbarLabels()
      renderBody()
    }

    th.append(button)
    headerRow.append(th)
    headerControls.push({ th, iconSlot })
  }
  syncHeaderStates()
}

function compareCells(a: string, b: string, direction: 1 | -1): number {
  const trimmedA = a.trim()
  const trimmedB = b.trim()
  const emptyA = trimmedA.length === 0
  const emptyB = trimmedB.length === 0
  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  const numA = parseNumericValue(trimmedA)
  const numB = parseNumericValue(trimmedB)
  if (numA !== null && numB !== null && numA !== numB) {
    return direction * (numA - numB)
  }

  const localeResult = a.localeCompare(b, state.locale || undefined, { numeric: true, sensitivity: 'base' })
  if (localeResult !== 0) return direction * localeResult
  return direction * a.localeCompare(b, state.locale || undefined, { numeric: true })
}

function renderBody(): void {
  const l = labels()
  const rawQuery = filterInput.value
  const query = rawQuery.toLocaleLowerCase()
  const hasQuery = query.length > 0
  clearFilterButton.hidden = !hasQuery
  truncatedBadge.hidden = !state.truncated

  const hasHeaders = state.headers.length > 0
  if (!hasHeaders) {
    table.hidden = true
    tbody.replaceChildren()
    cappedNote.hidden = true
    rowsMeta.textContent = ''
    colsMeta.textContent = ''
    colsSep.hidden = true
    emptyIcon.replaceChildren(iconEmptyTable())
    emptyMessage.textContent = l.emptyFile
    emptyAction.hidden = true
    emptyState.classList.add('is-full')
    emptyState.hidden = false
    return
  }

  table.hidden = false
  const matches = hasQuery
    ? state.rows.filter(row => row.some(cell => cell.toLocaleLowerCase().includes(query)))
    : [...state.rows]

  if (state.sortColumn >= 0) {
    const col = state.sortColumn
    const dir = state.sortDirection
    matches.sort((a, b) => compareCells(a[col] ?? '', b[col] ?? '', dir))
  }

  const total = state.rows.length
  const matched = matches.length
  const shown = Math.min(matched, DISPLAY_LIMIT)
  const isCapped = matched > DISPLAY_LIMIT

  const fragment = document.createDocumentFragment()
  const colCount = state.headers.length
  for (let r = 0; r < shown; r++) {
    const row = matches[r]!
    const tr = document.createElement('tr')
    for (let c = 0; c < colCount; c++) {
      const td = document.createElement('td')
      const value = row[c] ?? ''
      td.textContent = value
      if (value.length > 24) td.title = value
      if (c === 0) td.classList.add('is-primary')
      if (state.numericCols[c]) td.classList.add('is-numeric')
      if (c === state.sortColumn) td.classList.add('is-sorted')
      tr.append(td)
    }
    fragment.append(tr)
  }
  tbody.replaceChildren(fragment)

  if (isCapped) {
    rowsMeta.textContent = l.cappedRowsCount(formatNumber(shown), formatNumber(matched))
    cappedNote.textContent = l.cappedNotice(formatNumber(shown), formatNumber(matched))
    cappedNote.hidden = false
  } else {
    rowsMeta.textContent = hasQuery
      ? l.filteredRowsCount(formatNumber(matched), formatNumber(total))
      : l.rowsCount(formatNumber(total), total)
    cappedNote.hidden = true
  }

  colsMeta.textContent = l.columnsCount(formatNumber(colCount), colCount)
  colsSep.hidden = false

  if (matched === 0) {
    emptyState.classList.remove('is-full')
    if (hasQuery) {
      emptyIcon.replaceChildren(iconEmptySearch())
      emptyMessage.textContent = l.noMatches(rawQuery)
      emptyAction.hidden = false
    } else {
      emptyIcon.replaceChildren(iconEmptyTable())
      emptyMessage.textContent = l.noDataRows
      emptyAction.hidden = true
    }
    emptyState.hidden = false
  } else {
    emptyState.hidden = true
  }
}

function clearFilterAndFocus(): void {
  filterInput.value = ''
  renderBody()
  filterInput.focus()
}

filterInput.addEventListener('input', renderBody)
filterInput.addEventListener('keydown', event => {
  if (event.key === 'Escape' && filterInput.value) {
    event.preventDefault()
    clearFilterAndFocus()
  }
})
clearFilterButton.addEventListener('click', clearFilterAndFocus)
emptyAction.addEventListener('click', clearFilterAndFocus)
sortPill.addEventListener('click', () => {
  state.sortColumn = -1
  state.sortDirection = 1
  syncHeaderStates()
  syncToolbarLabels()
  renderBody()
})

function applyTheme(theme: PluginThemeSnapshot | undefined): void {
  if (!theme) return
  const nextLocale = theme.locale || 'en'
  const nextKey = resolveLocale(nextLocale)
  const changed = nextLocale !== state.locale || nextKey !== state.localeKey
  state.locale = nextLocale
  state.localeKey = nextKey
  if (changed) {
    syncToolbarLabels()
    if (state.fileKey !== null) renderBody()
  }
}

function applyFile(activeFile: PluginActiveFile | undefined): void {
  const path = activeFile?.path ?? ''
  const text = activeFile?.text ?? ''
  const truncated = Boolean(activeFile?.truncated)
  const key = `${path}\0${truncated ? '1' : '0'}\0${text}`
  if (key === state.fileKey) return

  const pathChanged = state.filePath !== null && state.filePath !== path
  state.fileKey = key
  state.filePath = path
  state.truncated = truncated

  const parsed = parseCsv(text)
  const [rawHeaders = [], ...rows] = parsed
  const colCount = parsed.length
    ? Math.max(rawHeaders.length, ...rows.map(row => row.length))
    : 0
  const headers = Array.from({ length: colCount }, (_, index) => rawHeaders[index] ?? '')

  state.headers = headers
  state.rows = rows
  state.numericCols = detectNumericColumns(colCount, rows)

  if (pathChanged || state.sortColumn >= colCount) {
    state.sortColumn = -1
    state.sortDirection = 1
  }
  if (pathChanged) {
    filterInput.value = ''
    viewport.scrollTop = 0
    viewport.scrollLeft = 0
  }

  rebuildHeaders()
  syncToolbarLabels()
  renderBody()
}

function updateContext(context: PluginContext): void {
  applyFile(context.activeFile)
}

document.body.replaceChildren(toolbar, viewport)
syncToolbarLabels()

void plugin.init.then(async ({ theme, context }) => {
  applyTheme(theme)
  plugin.onTheme(applyTheme)
  plugin.onContext(updateContext)
  const initialContext = await plugin
    .request({ method: 'file.active.read' })
    .then(activeFile => ({ activeFile }), () => context)
  updateContext(initialContext)
  plugin.ready()
})
