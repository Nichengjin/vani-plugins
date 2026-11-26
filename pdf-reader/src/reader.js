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

const plugin = window.vaniPlugin
const { context, theme } = await plugin.init
let labels = readerLabels(theme.locale)
document.body.innerHTML = `
  <header>
    <div class="pagination">
      <button type="button" id="prev"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3.5-4.5 4.5 4.5 4.5"/></svg></button>
      <input id="page" type="text" inputmode="numeric" autocomplete="off" value="1" size="3" />
      <span class="slash" aria-hidden="true">/</span><span id="count">—</span>
      <button type="button" id="next"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5-4.5 4.5"/></svg></button>
    </div>
    <select id="zoom"><option value="width"></option><option value="fit"></option></select>
  </header>
  <main tabindex="0"><div id="paper" role="group" hidden></div></main>
  <p id="status" role="status"></p>`
const $ = selector => document.querySelector(selector)
const prev = $('#prev'), next = $('#next'), field = $('#page'), total = $('#count'), zoom = $('#zoom')
const stage = $('main'), paper = $('#paper'), status = $('#status')
for (const percent of [50, 75, 100, 125, 150, 200, 300]) zoom.add(new Option(`${percent}%`, percent))

let doc, loading, range, activePage, painting, textLayer, resizeTimer
let number = 1, generation = 0, state = 'opening', closed = false

function pageLabel() { return `${labels.page} ${number} / ${doc?.numPages ?? '—'}` }
function show(key) {
  state = key
  status.textContent = key ? labels[key] : pageLabel()
  status.classList.toggle('visually-hidden', !key)
  paper.hidden = Boolean(key)
}
function controls() {
  field.value = String(number)
  total.textContent = String(doc?.numPages ?? '—')
  field.disabled = zoom.disabled = !doc
  prev.disabled = !doc || number <= 1
  next.disabled = !doc || number >= doc.numPages
}
function localize() {
  for (const [element, key] of [[prev, 'previous'], [next, 'next'], [field, 'page'], [zoom, 'zoom']]) {
    element.setAttribute('aria-label', labels[key])
    element.title = labels[key]
  }
  zoom.options[0].text = labels.width
  zoom.options[1].text = labels.fit
  paper.setAttribute('aria-label', pageLabel())
  paper.querySelector('canvas')?.setAttribute('aria-label', pageLabel())
  show(state)
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
  try {
    const page = await doc.getPage(number)
    if (ticket !== generation) return
    if (activePage !== page) activePage?.cleanup()
    activePage = page
    const unit = page.getViewport({ scale: 1 })
    const style = getComputedStyle(stage)
    const width = Math.max(1, stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))
    const height = Math.max(1, stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom))
    const scale = zoom.value === 'width' ? width / unit.width
      : zoom.value === 'fit' ? Math.min(width / unit.width, height / unit.height) : Number(zoom.value) / 100 * (96 / 72)
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
zoom.onchange = () => void draw()
stage.onkeydown = event => {
  if (!doc || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = { ArrowLeft: number - 1, ArrowRight: number + 1, Home: 1, End: doc.numPages }[event.key]
  if (target !== undefined) { event.preventDefault(); go(target) }
}
const observer = new ResizeObserver(() => {
  clearTimeout(resizeTimer)
  if (doc && (zoom.value === 'width' || zoom.value === 'fit')) resizeTimer = setTimeout(draw, 90)
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
