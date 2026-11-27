import { convertToHtml, images } from '../vendor/mammoth.mjs'
import './style.css'
import { readerLabels } from './labels.js'

const MAX_DOCX_BYTES = 32 * 1024 * 1024
const READ_CHUNK_BYTES = 524288
const ZOOM_MIN = 70
const ZOOM_MAX = 180
const ZOOM_STEP = 10

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sub', 'sup',
  'br', 'hr', 'a', 'img', 'span', 'div'
])

const DROP_SUBTREE_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math',
  'noscript', 'template', 'textarea', 'title', 'head', 'link', 'meta',
  'form', 'input', 'button', 'select', 'option', 'video', 'audio', 'source', 'canvas'
])

const SAFE_HREF_RE = /^(?:https?:\/\/|mailto:|#)/i
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=]+$/i
const SAFE_ID_RE = /^[A-Za-z0-9_.:-]+$/

const ICONS = {
  outline: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h7.5M2.5 12h9.5"/></svg>',
  search: '<svg class="search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 13.5 13.5"/></svg>',
  prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 9.75 8 6l3.75 3.75"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 6.25 8 10l3.75-3.75"/></svg>',
  clear: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"/></svg>',
  zoomOut: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9"/></svg>',
  zoomIn: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>',
  opening: '<svg class="spin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" opacity="0.22"/><path d="M10 3.5a6.5 6.5 0 0 1 6.5 6.5"/></svg>',
  empty: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.25h6l3 3v10.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V4.25a1 1 0 0 1 1-1Z"/><path d="M11.5 3.25v3h3"/></svg>',
  error: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6.75v3.75"/><circle cx="10" cy="13.25" r="0.65" fill="currentColor" stroke="none"/></svg>'
}

function fileName(filePath) {
  if (typeof filePath !== 'string' || !filePath) return ''
  return filePath.split(/[\\/]/u).pop() || ''
}

function sanitizeHref(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || /[\u0000-\u001f\u007f]/u.test(trimmed)) return null
  return SAFE_HREF_RE.test(trimmed) ? trimmed : null
}

function sanitizeImageSrc(raw) {
  if (typeof raw !== 'string') return null
  const compact = raw.trim().replace(/\s+/gu, '')
  return SAFE_DATA_IMAGE_RE.test(compact) ? compact : null
}

function sanitizeSpanAttr(raw) {
  const value = Number.parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(value) || value < 2 || value > 100) return null
  return String(value)
}

function sanitizeNode(sourceNode, targetDoc) {
  if (sourceNode.nodeType === Node.TEXT_NODE) {
    return targetDoc.createTextNode(sourceNode.nodeValue ?? '')
  }
  if (sourceNode.nodeType !== Node.ELEMENT_NODE) return null

  const tag = sourceNode.tagName.toLowerCase()
  if (DROP_SUBTREE_TAGS.has(tag)) return null

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = targetDoc.createDocumentFragment()
    for (const child of sourceNode.childNodes) {
      const cleanChild = sanitizeNode(child, targetDoc)
      if (cleanChild) fragment.appendChild(cleanChild)
    }
    return fragment
  }

  if (tag === 'img') {
    const safeSrc = sanitizeImageSrc(sourceNode.getAttribute('src'))
    if (!safeSrc) return null
    const img = targetDoc.createElement('img')
    img.setAttribute('src', safeSrc)
    const alt = sourceNode.getAttribute('alt')
    if (alt !== null) img.setAttribute('alt', alt)
    const title = sourceNode.getAttribute('title')
    if (title) img.setAttribute('title', title)
    return img
  }

  const element = targetDoc.createElement(tag)

  const id = sourceNode.getAttribute('id')?.trim()
  if (id && SAFE_ID_RE.test(id)) element.setAttribute('id', id)

  const title = sourceNode.getAttribute('title')
  if (title) element.setAttribute('title', title)

  if (tag === 'a') {
    const safeHref = sanitizeHref(sourceNode.getAttribute('href'))
    if (safeHref) {
      element.setAttribute('href', safeHref)
      if (!safeHref.startsWith('#')) {
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      }
    }
  } else if (tag === 'th' || tag === 'td') {
    const colspan = sanitizeSpanAttr(sourceNode.getAttribute('colspan'))
    const rowspan = sanitizeSpanAttr(sourceNode.getAttribute('rowspan'))
    if (colspan) element.setAttribute('colspan', colspan)
    if (rowspan) element.setAttribute('rowspan', rowspan)
  }

  for (const child of sourceNode.childNodes) {
    const cleanChild = sanitizeNode(child, targetDoc)
    if (cleanChild) element.appendChild(cleanChild)
  }

  if (tag === 'table') {
    const wrapper = targetDoc.createElement('div')
    wrapper.className = 'table-wrap'
    wrapper.appendChild(element)
    return wrapper
  }

  return element
}

function sanitizeMammothHtml(html) {
  const parser = new DOMParser()
  const parsed = parser.parseFromString(html || '', 'text/html')
  const fragment = document.createDocumentFragment()
  for (const child of parsed.body.childNodes) {
    const clean = sanitizeNode(child, document)
    if (clean) fragment.appendChild(clean)
  }
  return fragment
}

function countWords(text) {
  if (!text) return 0
  const matches = text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]|[A-Za-z0-9\u00c0-\u024f]+(?:['’-][A-Za-z0-9\u00c0-\u024f]+)*/gu)
  return matches ? matches.length : 0
}

const api = window.vaniPlugin
const { context, theme } = await api.init

let labels = readerLabels(theme.locale)
let numberFormat = new Intl.NumberFormat(labels.localeTag)
let closed = false
let docLoaded = false
let generation = 0
let zoomPercent = 100
let headings = []
let activeHeadingIndex = -1
let matches = []
let currentMatchIndex = -1
let wordCount = 0
let tableCount = 0
let activeFilePath = context.activeFile?.path || ''
let activeFileVersion = context.activeFile?.version
let scrollRaf = 0

const narrowMedia = window.matchMedia('(max-width: 639px)')
let outlineOpen = !narrowMedia.matches
let userToggledOutline = false

document.body.innerHTML = `
  <header class="toolbar">
    <div class="toolbar-left">
      <button type="button" id="outline-toggle" class="icon-btn" aria-pressed="${outlineOpen}">${ICONS.outline}</button>
      <div class="search-box">
        ${ICONS.search}
        <input id="search-input" class="search-input" type="search" autocomplete="off" spellcheck="false" />
        <span id="match-pill" class="match-pill" hidden></span>
        <button type="button" id="search-prev" class="search-nav-btn" hidden>${ICONS.prev}</button>
        <button type="button" id="search-next" class="search-nav-btn" hidden>${ICONS.next}</button>
        <button type="button" id="search-clear" class="search-nav-btn" hidden>${ICONS.clear}</button>
      </div>
    </div>
    <div class="toolbar-right">
      <div class="zoom-stepper" role="group">
        <button type="button" id="zoom-out" class="zoom-step">${ICONS.zoomOut}</button>
        <button type="button" id="zoom-reset" class="zoom-reset">100%</button>
        <button type="button" id="zoom-in" class="zoom-step">${ICONS.zoomIn}</button>
      </div>
    </div>
  </header>
  <div class="workspace">
    <aside id="outline-pane" class="outline-pane${outlineOpen ? '' : ' is-collapsed'}">
      <div id="outline-header" class="outline-header"></div>
      <nav id="outline-list" class="outline-list"></nav>
    </aside>
    <main id="stage" class="stage" tabindex="0">
      <article id="paper" class="paper" hidden>
        <div id="doc-content" class="doc-content"></div>
      </article>
      <div id="status-card" class="status-card" role="status" aria-live="polite">
        <div class="status-box">
          <span id="status-icon" class="status-icon" aria-hidden="true"></span>
          <p id="status-text" class="status-text"></p>
        </div>
      </div>
    </main>
  </div>
  <footer class="doc-footer">
    <span id="footer-filename" class="footer-filename"></span>
    <span id="footer-stats" class="footer-stats"></span>
  </footer>
`

const $ = selector => document.querySelector(selector)
const outlineToggle = $('#outline-toggle')
const searchInput = $('#search-input')
const matchPill = $('#match-pill')
const searchPrev = $('#search-prev')
const searchNext = $('#search-next')
const searchClear = $('#search-clear')
const zoomOut = $('#zoom-out')
const zoomReset = $('#zoom-reset')
const zoomIn = $('#zoom-in')
const outlinePane = $('#outline-pane')
const outlineHeader = $('#outline-header')
const outlineList = $('#outline-list')
const stage = $('#stage')
const paper = $('#paper')
const docContent = $('#doc-content')
const statusCard = $('#status-card')
const statusIcon = $('#status-icon')
const statusText = $('#status-text')
const footerFilename = $('#footer-filename')
const footerStats = $('#footer-stats')

let statusState = 'opening'

function showStatus(key) {
  statusState = key
  if (!key) {
    statusCard.hidden = true
    delete statusCard.dataset.tone
    paper.hidden = false
    return
  }
  paper.hidden = true
  statusCard.hidden = false
  const isError = key === 'tooLargeBytes' || key === 'openFailed'
  if (isError) statusCard.dataset.tone = 'error'
  else delete statusCard.dataset.tone
  const iconKey = key === 'opening' ? 'opening' : key === 'emptyDoc' ? 'empty' : 'error'
  statusIcon.innerHTML = ICONS[iconKey]
  statusText.textContent = labels[key]
}

function setOutlineVisible(nextOpen, fromUser = false) {
  outlineOpen = nextOpen
  if (fromUser) userToggledOutline = true
  outlinePane.classList.toggle('is-collapsed', !outlineOpen)
  outlineToggle.setAttribute('aria-pressed', String(outlineOpen))
}

function renderOutlineEmpty() {
  const empty = document.createElement('div')
  empty.className = 'outline-empty'
  empty.textContent = labels.noHeadings
  outlineList.replaceChildren(empty)
}

function updateActiveOutlineItem(index) {
  if (activeHeadingIndex === index) return
  activeHeadingIndex = index
  const buttons = outlineList.querySelectorAll('.outline-item')
  buttons.forEach((btn, idx) => {
    btn.classList.toggle('is-active', idx === index)
    if (idx === index) btn.setAttribute('aria-current', 'location')
    else btn.removeAttribute('aria-current')
  })
}

function syncOutlineFromScroll() {
  scrollRaf = 0
  if (!docLoaded || headings.length === 0) return
  const stageTop = stage.getBoundingClientRect().top
  let current = 0
  for (let i = 0; i < headings.length; i++) {
    const rect = headings[i].element.getBoundingClientRect()
    if (rect.top - stageTop <= 48) current = i
    else break
  }
  updateActiveOutlineItem(current)
}

function renderOutline() {
  if (!docLoaded) {
    outlineList.replaceChildren()
    return
  }
  if (headings.length === 0) {
    renderOutlineEmpty()
    return
  }
  const frag = document.createDocumentFragment()
  headings.forEach((item, index) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'outline-item'
    btn.dataset.level = String(item.level)
    btn.dataset.index = String(index)
    btn.textContent = item.text
    btn.title = item.text
    frag.appendChild(btn)
  })
  outlineList.replaceChildren(frag)
  activeHeadingIndex = -1
  updateActiveOutlineItem(0)
}

function updateZoomUi() {
  document.documentElement.style.setProperty('--doc-scale', String(zoomPercent / 100))
  zoomReset.textContent = `${zoomPercent}%`
  zoomOut.disabled = !docLoaded || zoomPercent <= ZOOM_MIN
  zoomIn.disabled = !docLoaded || zoomPercent >= ZOOM_MAX
  zoomReset.disabled = !docLoaded
}

function setZoom(nextPercent) {
  const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextPercent))
  if (clamped === zoomPercent) return
  zoomPercent = clamped
  updateZoomUi()
}

function updateSearchUi() {
  const hasQuery = searchInput.value.length > 0
  searchInput.disabled = !docLoaded
  matchPill.hidden = !docLoaded || !hasQuery
  searchPrev.hidden = !docLoaded || !hasQuery
  searchNext.hidden = !docLoaded || !hasQuery
  searchClear.hidden = !docLoaded || !hasQuery

  if (docLoaded && hasQuery) {
    const total = matches.length
    const current = total > 0 && currentMatchIndex >= 0 ? currentMatchIndex + 1 : 0
    matchPill.textContent = labels.matchCount(current, total)
    matchPill.dataset.empty = total === 0 ? 'true' : 'false'
    searchPrev.disabled = total === 0
    searchNext.disabled = total === 0
    searchClear.disabled = false
  }
}

function clearHighlights() {
  if (matches.length === 0) return
  const parents = new Set()
  for (const mark of matches) {
    const parent = mark.parentNode
    if (!parent) continue
    parents.add(parent)
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
  }
  for (const parent of parents) parent.normalize()
  matches = []
  currentMatchIndex = -1
}

function focusMatch(index, shouldScroll = true) {
  if (matches.length === 0) {
    currentMatchIndex = -1
    updateSearchUi()
    return
  }
  if (currentMatchIndex >= 0 && matches[currentMatchIndex]) {
    matches[currentMatchIndex].classList.remove('is-current')
  }
  const normalized = ((index % matches.length) + matches.length) % matches.length
  currentMatchIndex = normalized
  const activeMark = matches[currentMatchIndex]
  activeMark.classList.add('is-current')
  if (shouldScroll) {
    activeMark.scrollIntoView({ block: 'center', inline: 'nearest' })
  }
  updateSearchUi()
}

function runSearch({ scroll = true } = {}) {
  clearHighlights()
  const rawQuery = searchInput.value
  if (!docLoaded || !rawQuery) {
    updateSearchUi()
    return
  }

  const needle = rawQuery.toLowerCase()
  const needleLen = needle.length
  const textNodes = []
  const walker = document.createTreeWalker(docContent, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.length >= needleLen) {
      textNodes.push(node)
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue
    const lower = text.toLowerCase()
    let searchFrom = 0
    let hitIndex = lower.indexOf(needle, searchFrom)
    if (hitIndex === -1) continue

    const fragment = document.createDocumentFragment()
    while (hitIndex !== -1) {
      if (hitIndex > searchFrom) {
        fragment.appendChild(document.createTextNode(text.slice(searchFrom, hitIndex)))
      }
      const mark = document.createElement('mark')
      mark.className = 'find-hit'
      mark.textContent = text.slice(hitIndex, hitIndex + needleLen)
      fragment.appendChild(mark)
      matches.push(mark)
      searchFrom = hitIndex + needleLen
      hitIndex = lower.indexOf(needle, searchFrom)
    }
    if (searchFrom < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(searchFrom)))
    }
    textNode.parentNode?.replaceChild(fragment, textNode)
  }

  if (matches.length > 0) focusMatch(0, scroll)
  else updateSearchUi()
}

function updateFooter() {
  const name = fileName(activeFilePath)
  footerFilename.textContent = name
  footerFilename.title = activeFilePath || name
  footerStats.textContent = docLoaded
    ? labels.formatStats(wordCount, headings.length, tableCount, numberFormat)
    : ''
}

function localize() {
  outlineToggle.setAttribute('aria-label', labels.outlineToggle)
  outlineToggle.title = labels.outlineToggle
  outlineHeader.textContent = labels.outline
  outlineList.setAttribute('aria-label', labels.outline)
  outlinePane.setAttribute('aria-label', labels.outline)

  searchInput.placeholder = labels.findPlaceholder
  searchInput.setAttribute('aria-label', labels.findAriaLabel)
  searchPrev.setAttribute('aria-label', labels.prevMatch)
  searchPrev.title = labels.prevMatch
  searchNext.setAttribute('aria-label', labels.nextMatch)
  searchNext.title = labels.nextMatch
  searchClear.setAttribute('aria-label', labels.clearSearch)
  searchClear.title = labels.clearSearch

  zoomOut.setAttribute('aria-label', labels.zoomOut)
  zoomOut.title = labels.zoomOut
  zoomIn.setAttribute('aria-label', labels.zoomIn)
  zoomIn.title = labels.zoomIn
  zoomReset.setAttribute('aria-label', labels.resetZoom)
  zoomReset.title = labels.resetZoom

  if (docLoaded && headings.length === 0) renderOutlineEmpty()
  if (statusState) showStatus(statusState)
  updateSearchUi()
  updateZoomUi()
  updateFooter()
}

function resetDocumentState() {
  clearHighlights()
  docLoaded = false
  headings = []
  activeHeadingIndex = -1
  wordCount = 0
  tableCount = 0
  docContent.replaceChildren()
  outlineList.replaceChildren()
  updateSearchUi()
  updateZoomUi()
  updateFooter()
}

async function readAllActiveBytes(file, ticket) {
  const chunks = []
  let offset = 0
  while (offset < file.size) {
    const length = Math.min(READ_CHUNK_BYTES, file.size - offset)
    const buffer = await api.readActiveBytes(offset, length)
    if (closed || ticket !== generation) return null
    const view = new Uint8Array(buffer)
    if (view.byteLength === 0) throw new Error('Unexpected end of file')
    chunks.push(view)
    offset += view.byteLength
  }
  const combined = new Uint8Array(offset)
  let cursor = 0
  for (const chunk of chunks) {
    combined.set(chunk, cursor)
    cursor += chunk.byteLength
  }
  return combined.buffer
}

function collectHeadings() {
  const usedIds = new Set(
    Array.from(docContent.querySelectorAll('[id]'), el => el.id)
  )
  const items = []
  const nodes = docContent.querySelectorAll('h1, h2, h3')
  nodes.forEach((el, idx) => {
    const text = el.textContent?.replace(/\s+/gu, ' ').trim()
    if (!text) return
    if (!el.id) {
      let candidate = `doc-heading-${idx + 1}`
      while (usedIds.has(candidate)) candidate += '-x'
      el.id = candidate
      usedIds.add(candidate)
    }
    items.push({
      id: el.id,
      level: Number(el.tagName[1]),
      text,
      element: el
    })
  })
  return items
}

async function openDoc(file) {
  const ticket = ++generation
  resetDocumentState()
  activeFilePath = file?.path || ''
  activeFileVersion = file?.version
  updateFooter()

  if (!file || !Number.isSafeInteger(file.size) || file.size < 0) {
    showStatus('openFailed')
    return
  }
  if (file.size === 0) {
    showStatus('emptyDoc')
    return
  }
  if (file.size > MAX_DOCX_BYTES) {
    showStatus('tooLargeBytes')
    return
  }

  showStatus('opening')
  try {
    const arrayBuffer = await readAllActiveBytes(file, ticket)
    if (!arrayBuffer || closed || ticket !== generation) return

    const result = await convertToHtml(
      { arrayBuffer },
      { convertImage: images.dataUri }
    )
    if (closed || ticket !== generation) return

    const sanitizedFragment = sanitizeMammothHtml(result?.value || '')
    docContent.replaceChildren(sanitizedFragment)

    const text = docContent.textContent || ''
    const hasVisualContent = Boolean(docContent.querySelector('img, table, hr'))
    if (text.trim().length === 0 && !hasVisualContent) {
      docContent.replaceChildren()
      showStatus('emptyDoc')
      return
    }

    docLoaded = true
    headings = collectHeadings()
    wordCount = countWords(text)
    tableCount = docContent.querySelectorAll('table').length

    showStatus('')
    renderOutline()
    updateZoomUi()
    updateSearchUi()
    updateFooter()
    stage.scrollTop = 0

    if (searchInput.value.length > 0) runSearch({ scroll: false })
  } catch {
    if (closed || ticket !== generation) return
    resetDocumentState()
    showStatus('openFailed')
  }
}

outlineToggle.addEventListener('click', () => {
  setOutlineVisible(!outlineOpen, true)
})

outlineList.addEventListener('click', event => {
  const button = event.target.closest('.outline-item')
  if (!button) return
  const index = Number(button.dataset.index)
  const target = headings[index]
  if (!target) return
  target.element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  updateActiveOutlineItem(index)
  if (narrowMedia.matches) setOutlineVisible(false, false)
})

docContent.addEventListener('click', event => {
  const link = event.target.closest('a[href]')
  if (!link) return
  const href = link.getAttribute('href')
  if (!href || !href.startsWith('#')) return
  event.preventDefault()
  const targetId = href.slice(1)
  if (!targetId) {
    stage.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = document.getElementById(targetId)
  if (target && docContent.contains(target)) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})

stage.addEventListener('scroll', () => {
  if (!scrollRaf) scrollRaf = requestAnimationFrame(syncOutlineFromScroll)
}, { passive: true })

searchInput.addEventListener('input', () => {
  runSearch({ scroll: true })
})

searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (matches.length > 0) {
      focusMatch(currentMatchIndex + (event.shiftKey ? -1 : 1))
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    if (searchInput.value) {
      searchInput.value = ''
      runSearch({ scroll: false })
    } else {
      stage.focus()
    }
  }
})

searchPrev.addEventListener('click', () => {
  if (matches.length > 0) focusMatch(currentMatchIndex - 1)
})

searchNext.addEventListener('click', () => {
  if (matches.length > 0) focusMatch(currentMatchIndex + 1)
})

searchClear.addEventListener('click', () => {
  searchInput.value = ''
  runSearch({ scroll: false })
  searchInput.focus()
})

zoomOut.addEventListener('click', () => setZoom(zoomPercent - ZOOM_STEP))
zoomIn.addEventListener('click', () => setZoom(zoomPercent + ZOOM_STEP))
zoomReset.addEventListener('click', () => setZoom(100))

narrowMedia.addEventListener('change', event => {
  if (!userToggledOutline) setOutlineVisible(!event.matches, false)
})

window.addEventListener('keydown', event => {
  if (!event.metaKey && !event.ctrlKey) return
  if (event.altKey) return
  const key = event.key.toLowerCase()
  if (key === 'f') {
    event.preventDefault()
    if (docLoaded) {
      searchInput.focus()
      searchInput.select()
    }
    return
  }
  if (!docLoaded) return
  if (key === '=' || key === '+') {
    event.preventDefault()
    setZoom(zoomPercent + ZOOM_STEP)
  } else if (key === '-' || key === '_') {
    event.preventDefault()
    setZoom(zoomPercent - ZOOM_STEP)
  } else if (key === '0') {
    event.preventDefault()
    setZoom(100)
  }
})

const unlistenTheme = api.onTheme(updated => {
  labels = readerLabels(updated.locale)
  numberFormat = new Intl.NumberFormat(labels.localeTag)
  localize()
})

const unlistenContext = api.onContext(updated => {
  const nextFile = updated?.activeFile
  if (!nextFile) return
  if (nextFile.path !== activeFilePath || nextFile.version !== activeFileVersion) {
    void openDoc(nextFile)
  }
})

window.addEventListener('pagehide', () => {
  closed = true
  generation++
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  unlistenTheme()
  unlistenContext()
}, { once: true })

localize()
showStatus('opening')
// Signal readiness immediately so large .docx files never trip the 5s mount watchdog.
api.ready()
void openDoc(context.activeFile)
