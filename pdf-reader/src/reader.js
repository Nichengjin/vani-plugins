import { getDocument, TextLayer } from '../vendor/pdf.mjs'
// Registers the loopback (same-frame) WorkerMessageHandler before getDocument.
import '../vendor/pdf.worker.mjs'
import resources from '../vendor/resources.json'
import '../vendor/text-layer.css'
import './reader.css'
import { ActiveFileRange, RANGE_CHUNK } from './range.js'
import { readerLabels } from './labels.js'

class OfflineResources {
  async fetch({ kind, filename }) {
    const folder = { cMapUrl: 'cmaps', standardFontDataUrl: 'standard_fonts' }[kind]
    const key = `${folder}/${filename}`
    if (!Object.hasOwn(resources, key)) throw new Error('Unknown PDF resource')
    return Uint8Array.fromBase64(resources[key])
  }
}

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200, 300]
const ICON_CHECK = '<svg class="zoom-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>'
const ICON_FIT_PAGE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6V3.75A.75.75 0 0 1 3.75 3H6M10 3h2.25a.75.75 0 0 1 .75.75V6M13 10v2.25a.75.75 0 0 1-.75.75H10M6 13H3.75a.75.75 0 0 1-.75-.75V10"/></svg>'
const ICON_FIT_WIDTH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5v9M13.5 3.5v9M5.25 8h5.5M6.75 6.25 5 8l1.75 1.75M9.25 6.25 11 8l-1.75 1.75"/></svg>'
const STATUS_ICONS = {
  opening: '<svg class="spin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" opacity="0.22"/><path d="M10 3.5a6.5 6.5 0 0 1 6.5 6.5"/></svg>',
  drawing: '<svg class="spin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" opacity="0.22"/><path d="M10 3.5a6.5 6.5 0 0 1 6.5 6.5"/></svg>',
  locked: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>',
  empty: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.25h6l3 3v10.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V4.25a1 1 0 0 1 1-1Z"/><path d="M11.5 3.25v3h3"/></svg>',
  error: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6.75v3.75"/><circle cx="10" cy="13.25" r="0.65" fill="currentColor" stroke="none"/></svg>'
}

function fileName(filePath) {
  if (typeof filePath !== 'string' || !filePath) return ''
  return filePath.split(/[\\/]/u).pop() || ''
}

const plugin = window.vaniPlugin
const { context, theme } = await plugin.init
let labels = readerLabels(theme.locale)

const presetItemsHtml = ZOOM_PRESETS.map(
  percent => `<button type="button" class="zoom-option" role="option" data-value="${percent}" aria-selected="false" tabindex="-1"><span>${percent}%</span>${ICON_CHECK}</button>`
).join('')

document.body.innerHTML = `
  <header>
    <div class="pagination">
      <button type="button" id="prev" class="icon-btn"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.75 3.75 5.5 8l4.25 4.25"/></svg></button>
      <div class="page-readout">
        <input id="page" type="text" inputmode="numeric" autocomplete="off" value="1" size="3" />
        <span class="slash" aria-hidden="true">/</span>
        <span id="count">—</span>
      </div>
      <button type="button" id="next" class="icon-btn"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.25 3.75 10.5 8l-4.25 4.25"/></svg></button>
    </div>
    <span id="doc-title" class="doc-title"></span>
    <div class="toolbar-right">
      <button type="button" id="fit-toggle" class="icon-btn">${ICON_FIT_PAGE}</button>
      <div class="zoom-control">
        <div class="zoom-capsule">
          <button type="button" id="zoom-out" class="zoom-step"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9"/></svg></button>
          <button type="button" id="zoom-trigger" class="zoom-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="zoom-menu">
            <span id="zoom-label" class="zoom-label"></span>
            <svg class="zoom-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 6.25 8 10l3.75-3.75"/></svg>
          </button>
          <button type="button" id="zoom-in" class="zoom-step"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg></button>
        </div>
        <div id="zoom-menu" class="zoom-menu" role="listbox" hidden>
          <button type="button" class="zoom-option" role="option" data-value="width" aria-selected="true" tabindex="-1"><span data-label="width"></span>${ICON_CHECK}</button>
          <button type="button" class="zoom-option" role="option" data-value="fit" aria-selected="false" tabindex="-1"><span data-label="fit"></span>${ICON_CHECK}</button>
          <div class="zoom-divider" role="separator"></div>
          ${presetItemsHtml}
        </div>
      </div>
    </div>
    <div class="progress-track" aria-hidden="true"><div class="progress-bar"></div></div>
  </header>
  <main tabindex="0"><div id="paper" role="group" hidden></div></main>
  <div id="status" role="status"><span class="status-icon" aria-hidden="true"></span><span class="status-text"></span></div>`

const $ = selector => document.querySelector(selector)
const header = $('header')
const prev = $('#prev'), next = $('#next'), field = $('#page'), total = $('#count')
const docTitle = $('#doc-title')
const fitToggle = $('#fit-toggle')
const zoomControl = $('.zoom-control')
const zoomOut = $('#zoom-out'), zoomTrigger = $('#zoom-trigger'), zoomIn = $('#zoom-in')
const zoomLabel = $('#zoom-label'), zoomMenu = $('#zoom-menu')
const zoomOptions = [...zoomMenu.querySelectorAll('.zoom-option')]
const stage = $('main'), paper = $('#paper')
const status = $('#status'), statusIcon = status.querySelector('.status-icon'), statusText = status.querySelector('.status-text')

const title = fileName(context.activeFile?.path)
docTitle.textContent = title
docTitle.title = title

let doc, loading, range, activePage, painting, textLayer, resizeTimer
let number = 1, generation = 0, state = 'opening', closed = false
let zoomMode = 'width', effectivePercent = 100

function pageLabel() { return `${labels.page} ${number} / ${doc?.numPages ?? '—'}` }

function zoomModeLabel(mode) {
  if (mode === 'width') return labels.width
  if (mode === 'fit') return labels.fit
  return `${mode}%`
}

function nextZoomStep(direction) {
  if (zoomMode !== 'width' && zoomMode !== 'fit') {
    const index = ZOOM_PRESETS.indexOf(Number(zoomMode))
    if (index !== -1) {
      const target = ZOOM_PRESETS[index + direction]
      return target === undefined ? null : String(target)
    }
  }
  const current = Number.isFinite(effectivePercent) ? effectivePercent : 100
  if (direction > 0) {
    const found = ZOOM_PRESETS.find(percent => percent > current + 2)
    return found === undefined ? null : String(found)
  }
  for (let index = ZOOM_PRESETS.length - 1; index >= 0; index--) {
    if (ZOOM_PRESETS[index] < current - 2) return String(ZOOM_PRESETS[index])
  }
  return null
}

function updateZoomUi() {
  zoomLabel.textContent = zoomModeLabel(zoomMode)
  for (const option of zoomOptions) {
    option.setAttribute('aria-selected', String(option.dataset.value === zoomMode))
  }
  const nextFitKey = zoomMode === 'width' ? 'fit' : 'width'
  fitToggle.innerHTML = nextFitKey === 'fit' ? ICON_FIT_PAGE : ICON_FIT_WIDTH
  fitToggle.setAttribute('aria-label', labels[nextFitKey])
  fitToggle.title = labels[nextFitKey]
  fitToggle.disabled = !doc
  zoomTrigger.disabled = !doc
  zoomOut.disabled = !doc || nextZoomStep(-1) === null
  zoomIn.disabled = !doc || nextZoomStep(1) === null
  if (!doc) closeZoomMenu()
}

function show(key) {
  state = key
  const hasRenderedPage = Boolean(paper.querySelector('canvas'))
  const softDrawing = key === 'drawing' && hasRenderedPage
  const blocking = Boolean(key) && !softDrawing
  statusText.textContent = key ? labels[key] : pageLabel()
  status.classList.toggle('visually-hidden', !blocking)
  if (blocking) {
    const isError = key === 'unreadable' || key === 'invalid' || key === 'pageError'
    status.dataset.tone = isError ? 'error' : 'neutral'
    statusIcon.innerHTML = STATUS_ICONS[isError ? 'error' : key] || STATUS_ICONS.error
  } else {
    delete status.dataset.tone
  }
  paper.hidden = blocking
  paper.toggleAttribute('data-busy', softDrawing)
  header.toggleAttribute('data-loading', key === 'opening' || key === 'drawing')
}

function controls() {
  field.value = String(number)
  total.textContent = String(doc?.numPages ?? '—')
  field.disabled = !doc
  prev.disabled = !doc || number <= 1
  next.disabled = !doc || number >= doc.numPages
  updateZoomUi()
}

function localize() {
  for (const [element, key] of [
    [prev, 'previous'], [next, 'next'], [field, 'page'],
    [zoomTrigger, 'zoom'], [zoomOut, 'zoomOut'], [zoomIn, 'zoomIn']
  ]) {
    element.setAttribute('aria-label', labels[key])
    element.title = labels[key]
  }
  zoomMenu.setAttribute('aria-label', labels.zoomOptions)
  for (const node of zoomMenu.querySelectorAll('[data-label]')) {
    node.textContent = labels[node.dataset.label]
  }
  paper.setAttribute('aria-label', pageLabel())
  paper.querySelector('canvas')?.setAttribute('aria-label', pageLabel())
  updateZoomUi()
  show(state)
}

function openZoomMenu(focusTarget = 'selected') {
  if (!doc) return
  zoomMenu.hidden = false
  zoomTrigger.setAttribute('aria-expanded', 'true')
  let option = zoomOptions[0]
  if (focusTarget === 'last') option = zoomOptions[zoomOptions.length - 1]
  else if (focusTarget === 'selected') option = zoomOptions.find(item => item.dataset.value === zoomMode) || zoomOptions[0]
  option?.focus({ preventScroll: true })
}

function closeZoomMenu({ restoreFocus = false } = {}) {
  if (zoomMenu.hidden) return
  zoomMenu.hidden = true
  zoomTrigger.setAttribute('aria-expanded', 'false')
  if (restoreFocus) zoomTrigger.focus()
}

function setZoom(nextMode) {
  if (!doc || !nextMode || nextMode === zoomMode) return
  zoomMode = nextMode
  updateZoomUi()
  void draw()
}

function stepZoom(direction) {
  if (!doc) return
  const target = nextZoomStep(direction)
  if (target) setZoom(target)
}

localize()
controls()
plugin.onTheme(updated => { labels = readerLabels(updated.locale); localize() })
// The frame and controls are ready even when the first remote range takes seconds.
plugin.ready()

function cancelDrawing() {
  painting?.cancel()
  textLayer?.cancel()
  painting = textLayer = null
}

function close() {
  closed = true
  generation++
  clearTimeout(resizeTimer)
  closeZoomMenu()
  cancelDrawing()
  observer.disconnect()
  range?.abort()
  void loading?.destroy().catch(() => {})
  doc = activePage = null
}

function failed(key) {
  if (closed) return
  close()
  paper.replaceChildren()
  controls()
  show(key)
}

window.addEventListener('pagehide', close, { once: true })

async function draw() {
  if (!doc || closed) return
  const ticket = ++generation
  cancelDrawing()
  header.toggleAttribute('data-loading', true)
  try {
    const page = await doc.getPage(number)
    if (ticket !== generation) return
    if (activePage !== page) activePage?.cleanup()
    activePage = page
    const unit = page.getViewport({ scale: 1 })
    const style = getComputedStyle(stage)
    const width = Math.max(1, Math.floor(stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)))
    const height = Math.max(1, Math.floor(stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)))
    const scale = zoomMode === 'width' ? width / unit.width
      : zoomMode === 'fit' ? Math.min(width / unit.width, height / unit.height) : Number(zoomMode) / 100 * (96 / 72)
    effectivePercent = (scale / (96 / 72)) * 100
    updateZoomUi()
    const viewport = page.getViewport({ scale })
    const w = viewport.width, h = viewport.height
    if (!Number.isFinite(w + h) || w <= 0 || h <= 0) throw new Error('Invalid page geometry')
    // Retain CSS zoom on large sheets, but never allocate an unbounded raster.
    const ratio = Math.min(window.devicePixelRatio || 1, Math.sqrt(8_000_000 / (w * h)), 8192 / w, 8192 / h)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(w * ratio))
    canvas.height = Math.max(1, Math.floor(h * ratio))
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', pageLabel())
    const render = painting = page.render({ canvas, viewport, transform: [canvas.width / w, 0, 0, canvas.height / h, 0, 0] })
    await render.promise
    if (ticket !== generation) return
    painting = null
    paper.style.width = `${w}px`
    paper.style.height = `${h}px`
    paper.style.setProperty('--total-scale-factor', String(scale * page.userUnit))
    paper.setAttribute('aria-label', pageLabel())
    const layer = document.createElement('div')
    layer.className = 'textLayer'
    paper.replaceChildren(canvas, layer)
    show('')
    // A scan or missing text data must not veto a successfully painted page.
    try {
      const selectable = textLayer = new TextLayer({ container: layer, viewport, textContentSource: page.streamTextContent() })
      await selectable.render()
      if (ticket === generation && layer.textContent) canvas.setAttribute('aria-hidden', 'true')
    } catch { layer.remove() }
  } catch {
    if (ticket === generation) show('pageError')
  }
}

function go(target) {
  if (!doc || !Number.isInteger(target) || target < 1 || target > doc.numPages || target === number) {
    field.value = String(number)
    return
  }
  number = target
  controls()
  stage.scrollTo(0, 0)
  show('drawing')
  void draw()
}

prev.onclick = () => go(number - 1)
next.onclick = () => go(number + 1)
field.onfocus = () => field.select()
field.onchange = () => go(Number(field.value))
field.onkeydown = event => {
  if (event.key === 'Enter') { go(Number(field.value)); field.select() }
  if (event.key === 'Escape') { field.value = String(number); stage.focus() }
}

fitToggle.onclick = () => setZoom(zoomMode === 'width' ? 'fit' : 'width')
zoomOut.onclick = () => stepZoom(-1)
zoomIn.onclick = () => stepZoom(1)

zoomTrigger.onclick = () => {
  if (zoomMenu.hidden) openZoomMenu('selected')
  else closeZoomMenu()
}

zoomTrigger.onkeydown = event => {
  if (event.key === 'ArrowDown') { event.preventDefault(); openZoomMenu('selected') }
  else if (event.key === 'ArrowUp') { event.preventDefault(); openZoomMenu('selected') }
}

zoomMenu.onclick = event => {
  const option = event.target.closest('.zoom-option')
  if (!option) return
  setZoom(option.dataset.value)
  closeZoomMenu({ restoreFocus: true })
}

zoomMenu.onkeydown = event => {
  const index = zoomOptions.indexOf(document.activeElement)
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeZoomMenu({ restoreFocus: true })
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    zoomOptions[(index + 1 + zoomOptions.length) % zoomOptions.length]?.focus({ preventScroll: true })
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    zoomOptions[(index - 1 + zoomOptions.length) % zoomOptions.length]?.focus({ preventScroll: true })
  } else if (event.key === 'Home') {
    event.preventDefault()
    zoomOptions[0]?.focus({ preventScroll: true })
  } else if (event.key === 'End') {
    event.preventDefault()
    zoomOptions[zoomOptions.length - 1]?.focus({ preventScroll: true })
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const option = zoomOptions[index]
    if (option) setZoom(option.dataset.value)
    closeZoomMenu({ restoreFocus: true })
  } else if (event.key === 'Tab') {
    closeZoomMenu()
  }
}

document.addEventListener('pointerdown', event => {
  if (!zoomMenu.hidden && !zoomControl.contains(event.target)) closeZoomMenu()
})
window.addEventListener('blur', () => closeZoomMenu())

window.addEventListener('keydown', event => {
  if (!doc || (!event.metaKey && !event.ctrlKey) || event.altKey) return
  if (event.key === '=' || event.key === '+') {
    event.preventDefault()
    stepZoom(1)
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    stepZoom(-1)
  } else if (event.key === '0') {
    event.preventDefault()
    setZoom('width')
  }
})

stage.onkeydown = event => {
  if (!doc || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (event.key === 'PageDown') {
    const atBottom = zoomMode === 'fit' || stage.scrollHeight <= stage.clientHeight + 2 || stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 2
    if (atBottom && number < doc.numPages) { event.preventDefault(); go(number + 1) }
    return
  }
  if (event.key === 'PageUp') {
    const atTop = zoomMode === 'fit' || stage.scrollHeight <= stage.clientHeight + 2 || stage.scrollTop <= 2
    if (atTop && number > 1) { event.preventDefault(); go(number - 1) }
    return
  }
  const target = { ArrowLeft: number - 1, ArrowRight: number + 1, Home: 1, End: doc.numPages }[event.key]
  if (target !== undefined) { event.preventDefault(); go(target) }
}

const observer = new ResizeObserver(() => {
  clearTimeout(resizeTimer)
  if (doc && (zoomMode === 'width' || zoomMode === 'fit')) resizeTimer = setTimeout(draw, 90)
})
observer.observe(stage)

async function open(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size < 0 || !file.version) return failed('unreadable')
  if (!file.size) return failed('empty')
  try {
    range = new ActiveFileRange(file.size, plugin, () => failed('unreadable'))
    loading = getDocument({
      range, rangeChunkSize: RANGE_CHUNK, disableAutoFetch: true, disableStream: true,
      BinaryDataFactory: OfflineResources, useWorkerFetch: false, useSystemFonts: false,
      useWasm: false, disableWorkerRendering: true, enableXfa: false,
      canvasMaxAreaInBytes: 32 * 1024 * 1024
    })
    const loaded = await loading.promise
    if (closed) return
    doc = loaded
    controls()
    await draw()
  } catch (error) { failed(error?.name === 'PasswordException' ? 'locked' : 'invalid') }
}

void open(context.activeFile)
