import type { PluginBridgeApi, PluginThemeSnapshot, PluginWorkspaceEntry } from '@vani/extension-contracts'
import './summary.css'

const plugin = (window as unknown as { vaniPlugin: PluginBridgeApi }).vaniPlugin

const SVG_NS = 'http://www.w3.org/2000/svg'
const NO_EXT_KEY = ''

const PALETTE = [
  'var(--s-chart-1)',
  'var(--s-chart-2)',
  'var(--s-chart-4)',
  'var(--s-chart-5)',
  'var(--s-border-secondary)'
] as const

type Locale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'fr'
type SortMode = 'count' | 'name'

interface FileItem {
  name: string
  path: string
  parentDir: string
  extKey: string
  searchText: string
}

interface ExtensionGroup {
  key: string
  files: FileItem[]
}

interface Labels {
  filterPlaceholder: string
  clearFilter: string
  noExtension: string
  sortCount: string
  sortName: string
  sortByCountTitle: string
  sortByNameTitle: string
  collapseAll: string
  expandAll: string
  emptyWorkspace: string
  noMatches: string
  loading: string
  loadError: string
  retry: string
  breakdownAria: string
  groupsAria: string
  summary: (visibleFiles: number, totalFiles: number, visibleTypes: number, filtered: boolean) => string
  breakdownTooltip: (label: string, count: number, percent: string) => string
  otherTypes: (typeCount: number) => string
}

const LABELS: Record<Locale, Labels> = {
  en: {
    filterPlaceholder: 'Filter files…',
    clearFilter: 'Clear filter',
    noExtension: 'No extension',
    sortCount: 'Count',
    sortName: 'A–Z',
    sortByCountTitle: 'Sorted by file count — click to sort A–Z',
    sortByNameTitle: 'Sorted A–Z — click to sort by count',
    collapseAll: 'Collapse all',
    expandAll: 'Expand all',
    emptyWorkspace: 'No files in this workspace',
    noMatches: 'No matching files',
    loading: 'Loading workspace files…',
    loadError: 'Couldn’t load workspace files',
    retry: 'Retry',
    breakdownAria: 'File type breakdown',
    groupsAria: 'Files grouped by extension',
    summary: (visible, total, types, filtered) => {
      if (!filtered) {
        return `${visible} ${visible === 1 ? 'file' : 'files'} · ${types} ${types === 1 ? 'type' : 'types'}`
      }
      if (visible === 0) {
        return `0 of ${total} ${total === 1 ? 'file' : 'files'}`
      }
      return `${visible} of ${total} · ${types} ${types === 1 ? 'type' : 'types'}`
    },
    breakdownTooltip: (label, count, percent) =>
      `${label} — ${count} ${count === 1 ? 'file' : 'files'} (${percent})`,
    otherTypes: count => `Other (${count} ${count === 1 ? 'type' : 'types'})`
  },
  'zh-CN': {
    filterPlaceholder: '筛选文件…',
    clearFilter: '清除筛选',
    noExtension: '无扩展名',
    sortCount: '数量',
    sortName: 'A–Z',
    sortByCountTitle: '按文件数量排序，点击切换为按名称',
    sortByNameTitle: '按名称排序，点击切换为按数量',
    collapseAll: '全部折叠',
    expandAll: '全部展开',
    emptyWorkspace: '当前工作区暂无文件',
    noMatches: '没有匹配的文件',
    loading: '正在加载工作区文件…',
    loadError: '无法读取工作区文件',
    retry: '重试',
    breakdownAria: '文件类型分布',
    groupsAria: '按扩展名分组的文件',
    summary: (visible, total, types, filtered) => {
      if (!filtered) return `${visible} 个文件 · ${types} 种类型`
      if (visible === 0) return `0/${total} 个文件`
      return `${visible}/${total} 个文件 · ${types} 种类型`
    },
    breakdownTooltip: (label, count, percent) => `${label} — ${count} 个文件（${percent}）`,
    otherTypes: count => `其他（${count} 种）`
  },
  'zh-TW': {
    filterPlaceholder: '篩選檔案…',
    clearFilter: '清除篩選',
    noExtension: '無副檔名',
    sortCount: '數量',
    sortName: 'A–Z',
    sortByCountTitle: '依檔案數量排序，點擊切換為依名稱',
    sortByNameTitle: '依名稱排序，點擊切換為依數量',
    collapseAll: '全部摺疊',
    expandAll: '全部展開',
    emptyWorkspace: '目前工作區沒有檔案',
    noMatches: '沒有符合的檔案',
    loading: '正在載入工作區檔案…',
    loadError: '無法讀取工作區檔案',
    retry: '重試',
    breakdownAria: '檔案類型分布',
    groupsAria: '依副檔名分組的檔案',
    summary: (visible, total, types, filtered) => {
      if (!filtered) return `${visible} 個檔案 · ${types} 種分類`
      if (visible === 0) return `0/${total} 個檔案`
      return `${visible}/${total} 個檔案 · ${types} 種分類`
    },
    breakdownTooltip: (label, count, percent) => `${label} — ${count} 個檔案（${percent}）`,
    otherTypes: count => `其他（${count} 種）`
  },
  ja: {
    filterPlaceholder: 'ファイルを絞り込み…',
    clearFilter: '絞り込みを解除',
    noExtension: '拡張子なし',
    sortCount: '件数',
    sortName: 'A–Z',
    sortByCountTitle: 'ファイル数順で並び替え中（クリックで名前順）',
    sortByNameTitle: '名前順で並び替え中（クリックで件数順）',
    collapseAll: 'すべて折りたたむ',
    expandAll: 'すべて展開',
    emptyWorkspace: 'このワークスペースにファイルはありません',
    noMatches: '一致するファイルがありません',
    loading: 'ワークスペースのファイルを読み込み中…',
    loadError: 'ファイルを読み込めませんでした',
    retry: '再試行',
    breakdownAria: 'ファイル種別の内訳',
    groupsAria: '拡張子別のファイル一覧',
    summary: (visible, total, types, filtered) => {
      if (!filtered) return `${visible} 件 · ${types} 種類`
      if (visible === 0) return `0/${total} 件`
      return `${visible}/${total} 件 · ${types} 種類`
    },
    breakdownTooltip: (label, count, percent) => `${label} — ${count} 件（${percent}）`,
    otherTypes: count => `その他（${count} 種類）`
  },
  fr: {
    filterPlaceholder: 'Filtrer les fichiers…',
    clearFilter: 'Effacer le filtre',
    noExtension: 'Sans extension',
    sortCount: 'Nombre',
    sortName: 'A–Z',
    sortByCountTitle: 'Trié par nombre — cliquer pour trier de A à Z',
    sortByNameTitle: 'Trié de A à Z — cliquer pour trier par nombre',
    collapseAll: 'Tout réduire',
    expandAll: 'Tout développer',
    emptyWorkspace: 'Aucun fichier dans cet espace',
    noMatches: 'Aucun fichier correspondant',
    loading: 'Chargement des fichiers…',
    loadError: 'Impossible de charger les fichiers',
    retry: 'Réessayer',
    breakdownAria: 'Répartition par type de fichier',
    groupsAria: 'Fichiers regroupés par extension',
    summary: (visible, total, types, filtered) => {
      if (!filtered) {
        return `${visible} ${visible === 1 ? 'fichier' : 'fichiers'} · ${types} ${types === 1 ? 'type' : 'types'}`
      }
      if (visible === 0) {
        return `0 sur ${total} ${total === 1 ? 'fichier' : 'fichiers'}`
      }
      return `${visible} sur ${total} · ${types} ${types === 1 ? 'type' : 'types'}`
    },
    breakdownTooltip: (label, count, percent) =>
      `${label} — ${count} ${count === 1 ? 'fichier' : 'fichiers'} (${percent})`,
    otherTypes: count => `Autres (${count} ${count === 1 ? 'type' : 'types'})`
  }
}

function resolveLocale(locale: string | undefined): Locale {
  if (!locale) return 'en'
  if (/^zh/i.test(locale)) return /TW|HK|MO|Hant/i.test(locale) ? 'zh-TW' : 'zh-CN'
  const base = locale.split('-')[0]?.toLowerCase()
  if (base === 'ja') return 'ja'
  if (base === 'fr') return 'fr'
  return 'en'
}

function createSvg(viewBox: string, className: string, paths: ReadonlyArray<string>, strokeWidth = 1.5): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', String(strokeWidth))
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  if (className) svg.setAttribute('class', className)
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

const iconSearch = () =>
  createSvg('0 0 16 16', 'search-icon', ['M7.25 2.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z', 'M10.75 10.75 13.75 13.75'], 1.5)

const iconClear = () =>
  createSvg('0 0 12 12', '', ['M3.25 3.25 8.75 8.75', 'M8.75 3.25 3.25 8.75'], 1.6)

const iconChevron = () =>
  createSvg('0 0 13 13', 'ext-chevron', ['M4.75 3.25 8.25 6.5 4.75 9.75'], 1.5)

const iconFile = () =>
  createSvg(
    '0 0 16 16',
    'file-glyph',
    [
      'M3.75 2.75A.75.75 0 0 1 4.5 2h4.75L12.5 5.25v8a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-10.5Z',
      'M9.25 2v2.75c0 .28.22.5.5.5h2.75'
    ],
    1.35
  )

const iconSortCount = () =>
  createSvg('0 0 14 14', '', ['M2.5 3.75h9', 'M2.5 7h6.25', 'M2.5 10.25h3.5'], 1.4)

const iconSortName = () =>
  createSvg('0 0 14 14', '', ['M4.5 3v8', 'M2.75 9.25 4.5 11l1.75-1.75', 'M9.5 11V3', 'M7.75 4.75 9.5 3l1.75 1.75'], 1.35)

const iconCollapseAll = () =>
  createSvg('0 0 16 16', '', ['M5 3.75 8 6.5l3-2.75', 'M5 12.25 8 9.5l3 2.75'], 1.5)

const iconExpandAll = () =>
  createSvg('0 0 16 16', '', ['M5 6.25 8 3.5l3 2.75', 'M5 9.75 8 12.5l3-2.75'], 1.5)

const iconEmptyFolder = () =>
  createSvg(
    '0 0 28 28',
    'empty-icon',
    [
      'M3.75 8.25A2.25 2.25 0 0 1 6 6h4.55a2.25 2.25 0 0 1 1.65.72l1.2 1.28a2.25 2.25 0 0 0 1.65.72H22a2.25 2.25 0 0 1 2.25 2.25v8.78A2.25 2.25 0 0 1 22 22H6a2.25 2.25 0 0 1-2.25-2.25V8.25Z'
    ],
    1.45
  )

const iconEmptySearch = () =>
  createSvg(
    '0 0 24 24',
    'empty-icon',
    ['M10.75 4.25a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z', 'M15.5 15.5 19.75 19.75'],
    1.45
  )

function extractExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot > 0 && dot < name.length - 1) return name.slice(dot).toLowerCase()
  return NO_EXT_KEY
}

function extractParentDir(filePath: string): string {
  const normalized = filePath.replace(/\\/gu, '/').replace(/^\.\//u, '').replace(/^\/+/u, '')
  const slash = normalized.lastIndexOf('/')
  if (slash <= 0) return ''
  const dir = normalized.slice(0, slash)
  const segments = dir.split('/')
  return segments.length > 2 ? `…/${segments.slice(-2).join('/')}` : dir
}

function compareExtensionKey(a: string, b: string): number {
  if (a === b) return 0
  if (a === NO_EXT_KEY) return 1
  if (b === NO_EXT_KEY) return -1
  return a.localeCompare(b)
}

function compareFiles(a: FileItem, b: FileItem): number {
  const byName = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  return byName !== 0 ? byName : a.path.localeCompare(b.path)
}

function groupFiles(files: ReadonlyArray<FileItem>, sortMode: SortMode): ExtensionGroup[] {
  const map = new Map<string, FileItem[]>()
  for (const file of files) {
    let bucket = map.get(file.extKey)
    if (!bucket) {
      bucket = []
      map.set(file.extKey, bucket)
    }
    bucket.push(file)
  }
  const groups: ExtensionGroup[] = []
  for (const [key, list] of map) {
    list.sort(compareFiles)
    groups.push({ key, files: list })
  }
  groups.sort((a, b) => {
    if (sortMode === 'count') {
      const diff = b.files.length - a.files.length
      if (diff !== 0) return diff
    }
    return compareExtensionKey(a.key, b.key)
  })
  return groups
}

function formatPercent(count: number, total: number): string {
  if (total <= 0) return '0%'
  const pct = Math.round((count / total) * 100)
  return pct === 0 && count > 0 ? '<1%' : `${pct}%`
}

// ── State ──

let locale: Locale = 'en'
let loading = true
let loadFailed = false
let allFiles: FileItem[] = []
let colorByExt = new Map<string, string>()
let sortMode: SortMode = 'count'
let query = ''
let activePath: string | null = null
const collapsedNormal = new Set<string>()
const collapsedFiltered = new Set<string>()
let groupNodes = new Map<string, HTMLDetailsElement>()
let highlightTimer: number | undefined

const t = (): Labels => LABELS[locale]

function activeCollapsedSet(): Set<string> {
  return query.trim() ? collapsedFiltered : collapsedNormal
}

function extDisplayLabel(extKey: string): string {
  return extKey === NO_EXT_KEY ? t().noExtension : extKey
}

function colorForExt(extKey: string): string {
  return colorByExt.get(extKey) ?? PALETTE[4]
}

function assignPalette(files: ReadonlyArray<FileItem>): void {
  colorByExt = new Map()
  const ranked = groupFiles(files, 'count')
  for (let i = 0; i < ranked.length; i++) {
    colorByExt.set(ranked[i]!.key, i < 4 ? PALETTE[i]! : PALETTE[4])
  }
}

function normalizeEntries(entries: ReadonlyArray<PluginWorkspaceEntry>): FileItem[] {
  const result: FileItem[] = []
  for (const entry of entries) {
    if (entry.kind !== 'file') continue
    const extKey = extractExtension(entry.name)
    result.push({
      name: entry.name,
      path: entry.path,
      parentDir: extractParentDir(entry.path),
      extKey,
      searchText: `${entry.name}\n${entry.path}\n${extKey}`.toLowerCase()
    })
  }
  return result
}

function filterFiles(files: ReadonlyArray<FileItem>, rawQuery: string): FileItem[] {
  const trimmed = rawQuery.trim().toLowerCase()
  if (!trimmed) return [...files]
  const terms = trimmed.split(/\s+/u).filter(Boolean)
  const noExtLabel = t().noExtension.toLowerCase()
  return files.filter(file => {
    const haystack = file.extKey === NO_EXT_KEY ? `${file.searchText}\n${noExtLabel}` : file.searchText
    return terms.every(term => haystack.includes(term))
  })
}

// ── Static Shell Construction ──

const header = document.createElement('header')
header.className = 'panel-header'

const searchBox = document.createElement('div')
searchBox.className = 'search-box'

const searchInput = document.createElement('input')
searchInput.className = 'search-input'
searchInput.type = 'search'
searchInput.spellcheck = false
searchInput.autocomplete = 'off'

const clearBtn = document.createElement('button')
clearBtn.type = 'button'
clearBtn.className = 'icon-btn clear-btn'
clearBtn.hidden = true
clearBtn.append(iconClear())

searchBox.append(iconSearch(), searchInput, clearBtn)

const summaryMeta = document.createElement('div')
summaryMeta.className = 'summary-meta'
summaryMeta.hidden = true

const summaryStats = document.createElement('span')
summaryStats.className = 'summary-stats'

const headerActions = document.createElement('div')
headerActions.className = 'header-actions'

const sortToggle = document.createElement('button')
sortToggle.type = 'button'
sortToggle.className = 'sort-toggle'

const foldToggle = document.createElement('button')
foldToggle.type = 'button'
foldToggle.className = 'icon-btn fold-toggle'

headerActions.append(sortToggle, foldToggle)
summaryMeta.append(summaryStats, headerActions)

const breakdownBar = document.createElement('div')
breakdownBar.className = 'breakdown-bar'
breakdownBar.setAttribute('role', 'group')
breakdownBar.hidden = true

header.append(searchBox, summaryMeta, breakdownBar)

const scrollRegion = document.createElement('main')
scrollRegion.className = 'groups-scroll'

document.body.replaceChildren(header, scrollRegion)

// ── UI Updaters ──

function syncStaticLabels(): void {
  const strings = t()
  searchInput.placeholder = strings.filterPlaceholder
  searchInput.setAttribute('aria-label', strings.filterPlaceholder)
  clearBtn.setAttribute('aria-label', strings.clearFilter)
  clearBtn.title = strings.clearFilter
  breakdownBar.setAttribute('aria-label', strings.breakdownAria)
  scrollRegion.setAttribute('aria-label', strings.groupsAria)
  syncSortButton()
}

function syncSortButton(): void {
  const strings = t()
  const label = sortMode === 'count' ? strings.sortCount : strings.sortName
  const title = sortMode === 'count' ? strings.sortByCountTitle : strings.sortByNameTitle
  sortToggle.replaceChildren(sortMode === 'count' ? iconSortCount() : iconSortName(), document.createTextNode(label))
  sortToggle.title = title
  sortToggle.setAttribute('aria-label', title)
  sortToggle.setAttribute('aria-pressed', String(sortMode === 'name'))
}

function syncFoldButton(): void {
  const strings = t()
  const detailsList = [...groupNodes.values()]
  if (detailsList.length === 0) {
    foldToggle.hidden = true
    return
  }
  foldToggle.hidden = false
  const anyOpen = detailsList.some(node => node.open)
  const label = anyOpen ? strings.collapseAll : strings.expandAll
  foldToggle.replaceChildren(anyOpen ? iconCollapseAll() : iconExpandAll())
  foldToggle.title = label
  foldToggle.setAttribute('aria-label', label)
  foldToggle.dataset.action = anyOpen ? 'collapse' : 'expand'
}

function renderSkeleton(): void {
  const strings = t()
  searchInput.disabled = true
  searchBox.classList.add('is-disabled')
  summaryMeta.hidden = true
  breakdownBar.hidden = true

  const list = document.createElement('div')
  list.className = 'skeleton-list'
  list.setAttribute('role', 'status')
  list.setAttribute('aria-label', strings.loading)

  for (let i = 0; i < 3; i++) {
    const row = document.createElement('div')
    row.className = i === 0 ? 'skeleton-row' : 'skeleton-row is-indented'
    const dot = document.createElement('span')
    dot.className = 'skeleton-dot'
    const bar = document.createElement('span')
    bar.className = 'skeleton-bar'
    row.append(dot, bar)
    list.append(row)
  }
  scrollRegion.replaceChildren(list)
}

function renderEmpty(icon: SVGSVGElement, message: string, actionLabel?: string, onAction?: () => void): void {
  const box = document.createElement('div')
  box.className = 'empty-state'
  box.append(icon)

  const text = document.createElement('p')
  text.className = 'empty-message'
  text.textContent = message
  box.append(text)

  if (actionLabel && onAction) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'empty-action'
    btn.textContent = actionLabel
    btn.onclick = onAction
    box.append(btn)
  }
  scrollRegion.replaceChildren(box)
}

function focusGroup(extKey: string): void {
  const details = groupNodes.get(extKey)
  if (!details) return
  if (!details.open) {
    details.open = true
    activeCollapsedSet().delete(extKey)
    syncFoldButton()
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  details.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
  const summary = details.firstElementChild
  if (summary instanceof HTMLElement) {
    for (const node of groupNodes.values()) node.firstElementChild?.classList.remove('is-highlighted')
    summary.classList.add('is-highlighted')
    window.clearTimeout(highlightTimer)
    highlightTimer = window.setTimeout(() => summary.classList.remove('is-highlighted'), 520)
  }
}

function renderBreakdown(visibleFiles: ReadonlyArray<FileItem>): void {
  const strings = t()
  const total = visibleFiles.length
  if (total === 0) {
    breakdownBar.hidden = true
    breakdownBar.replaceChildren()
    return
  }

  const ranked = groupFiles(visibleFiles, 'count')
  const slices: Array<{ label: string; count: number; color: string; extKey?: string }> = []

  if (ranked.length <= 5) {
    for (const group of ranked) {
      slices.push({
        label: extDisplayLabel(group.key),
        count: group.files.length,
        color: colorForExt(group.key),
        extKey: group.key
      })
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const group = ranked[i]!
      slices.push({
        label: extDisplayLabel(group.key),
        count: group.files.length,
        color: colorForExt(group.key),
        extKey: group.key
      })
    }
    const rest = ranked.slice(4)
    const restFiles = rest.reduce((sum, group) => sum + group.files.length, 0)
    slices.push({
      label: strings.otherTypes(rest.length),
      count: restFiles,
      color: PALETTE[4]
    })
  }

  const fragment = document.createDocumentFragment()
  for (const slice of slices) {
    const tooltip = strings.breakdownTooltip(slice.label, slice.count, formatPercent(slice.count, total))
    const element = slice.extKey !== undefined
      ? document.createElement('button')
      : document.createElement('span')
    if (element instanceof HTMLButtonElement) {
      element.type = 'button'
      element.setAttribute('aria-label', tooltip)
      const targetKey = slice.extKey!
      element.onclick = () => focusGroup(targetKey)
    }
    element.className = 'breakdown-segment'
    element.style.flexGrow = String(slice.count)
    element.style.flexBasis = '0px'
    element.style.setProperty('--segment-color', slice.color)
    element.title = tooltip
    fragment.append(element)
  }

  breakdownBar.replaceChildren(fragment)
  breakdownBar.hidden = false
}

function navigateTo(filePath: string, row: HTMLLIElement): void {
  activePath = filePath
  for (const item of scrollRegion.querySelectorAll('.file-row.is-recent')) {
    item.classList.remove('is-recent')
  }
  row.classList.add('is-recent', 'is-pressed')
  window.setTimeout(() => row.classList.remove('is-pressed'), 160)
  plugin.navigate({ kind: 'file', path: filePath })
}

function render(): void {
  syncStaticLabels()

  if (loading) {
    renderSkeleton()
    return
  }

  const strings = t()
  clearBtn.hidden = query.length === 0

  if (loadFailed) {
    searchInput.disabled = true
    searchBox.classList.add('is-disabled')
    summaryMeta.hidden = true
    breakdownBar.hidden = true
    groupNodes = new Map()
    renderEmpty(iconEmptyFolder(), strings.loadError, strings.retry, () => void loadFiles(false))
    return
  }

  if (allFiles.length === 0) {
    searchInput.disabled = true
    searchBox.classList.add('is-disabled')
    summaryMeta.hidden = true
    breakdownBar.hidden = true
    groupNodes = new Map()
    renderEmpty(iconEmptyFolder(), strings.emptyWorkspace)
    return
  }

  searchInput.disabled = false
  searchBox.classList.remove('is-disabled')

  const isFiltered = query.trim().length > 0
  const visibleFiles = filterFiles(allFiles, query)
  const groups = groupFiles(visibleFiles, sortMode)

  summaryMeta.hidden = false
  summaryStats.textContent = strings.summary(visibleFiles.length, allFiles.length, groups.length, isFiltered)
  renderBreakdown(visibleFiles)

  if (groups.length === 0) {
    groupNodes = new Map()
    syncFoldButton()
    renderEmpty(iconEmptySearch(), strings.noMatches, strings.clearFilter, clearFilter)
    return
  }

  const collapsed = activeCollapsedSet()
  const nextGroupNodes = new Map<string, HTMLDetailsElement>()
  const container = document.createElement('div')
  container.className = 'groups-list'

  for (const group of groups) {
    const details = document.createElement('details')
    details.className = 'ext-group'
    details.open = !collapsed.has(group.key)

    const summary = document.createElement('summary')
    summary.className = 'ext-summary'

    const dot = document.createElement('span')
    dot.className = 'ext-dot'
    dot.setAttribute('aria-hidden', 'true')
    dot.style.setProperty('--group-dot', colorForExt(group.key))

    const label = document.createElement('span')
    label.className = group.key === NO_EXT_KEY ? 'ext-label is-muted' : 'ext-label'
    label.textContent = extDisplayLabel(group.key)

    const count = document.createElement('span')
    count.className = 'ext-count'
    count.textContent = String(group.files.length)

    summary.append(iconChevron(), dot, label, count)

    const list = document.createElement('ul')
    list.className = 'ext-list'

    for (const file of group.files) {
      const row = document.createElement('li')
      row.className = file.path === activePath ? 'file-row is-recent' : 'file-row'
      row.title = file.path

      const link = document.createElement('a')
      link.className = 'file-link'
      link.href = '#'
      link.textContent = file.name
      link.onclick = event => {
        event.preventDefault()
        event.stopPropagation()
        navigateTo(file.path, row)
      }

      row.onclick = event => {
        if (event.target === link) return
        navigateTo(file.path, row)
      }

      row.append(iconFile(), link)

      if (file.parentDir) {
        const dir = document.createElement('span')
        dir.className = 'file-dir'
        dir.setAttribute('aria-hidden', 'true')
        dir.textContent = file.parentDir
        row.append(dir)
      }

      list.append(row)
    }

    details.append(summary, list)
    details.addEventListener('toggle', () => {
      const targetSet = activeCollapsedSet()
      if (details.open) targetSet.delete(group.key)
      else targetSet.add(group.key)
      syncFoldButton()
    })

    nextGroupNodes.set(group.key, details)
    container.append(details)
  }

  groupNodes = nextGroupNodes
  scrollRegion.replaceChildren(container)
  syncFoldButton()
}

function clearFilter(): void {
  query = ''
  searchInput.value = ''
  collapsedFiltered.clear()
  render()
  searchInput.focus()
}

// ── Event Wiring ──

searchInput.addEventListener('input', () => {
  query = searchInput.value
  collapsedFiltered.clear()
  render()
})

searchInput.addEventListener('keydown', event => {
  if (event.key === 'Escape' && query.length > 0) {
    event.preventDefault()
    clearFilter()
  }
})

clearBtn.addEventListener('click', clearFilter)

sortToggle.addEventListener('click', () => {
  sortMode = sortMode === 'count' ? 'name' : 'count'
  render()
})

foldToggle.addEventListener('click', () => {
  const collapse = foldToggle.dataset.action === 'collapse'
  const targetSet = activeCollapsedSet()
  for (const [key, details] of groupNodes) {
    details.open = !collapse
    if (collapse) targetSet.add(key)
    else targetSet.delete(key)
  }
  syncFoldButton()
})

function applyLocale(theme: PluginThemeSnapshot): void {
  const next = resolveLocale(theme.locale)
  if (next === locale) return
  locale = next
  render()
}

async function loadFiles(initial: boolean): Promise<void> {
  loading = true
  loadFailed = false
  render()
  try {
    const entries = await plugin.request({ method: 'workspace.files.read' })
    allFiles = normalizeEntries(entries)
    assignPalette(allFiles)
  } catch {
    loadFailed = true
    allFiles = []
    colorByExt = new Map()
  } finally {
    loading = false
    render()
    if (initial) plugin.ready()
  }
}

// Show immediate loading skeleton before init completes.
render()

void plugin.init.then(async ({ theme }) => {
  locale = resolveLocale(theme.locale)
  plugin.onTheme(applyLocale)
  await loadFiles(true)
})
