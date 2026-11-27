import './style.css'

const api = window.vaniPlugin
const { context, theme } = await api.init
const file = context.activeFile
const isMac = /mac|iphone|ipad|ipod/iu.test(navigator.platform || navigator.userAgent)
const modUndo = isMac ? '⌘Z' : 'Ctrl+Z'
const modRedo = isMac ? '⇧⌘Z' : 'Ctrl+Shift+Z'

const PRESET_COLORS = [
  { hex: '#e75336', key: 'colorVermilion' },
  { hex: '#d97706', key: 'colorAmber' },
  { hex: '#16a34a', key: 'colorEmerald' },
  { hex: '#2563eb', key: 'colorCobalt' },
  { hex: '#23211f', key: 'colorCharcoal' }
]

const STROKE_WEIGHTS = [
  { id: 'thin', base: 2, min: 1.5, dot: 4, key: 'thin' },
  { id: 'medium', base: 3, min: 2, dot: 6.5, key: 'medium' },
  { id: 'bold', base: 5, min: 3, dot: 9.5, key: 'bold' }
]

const ICONS = {
  pen: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.6 2.4a1.55 1.55 0 0 1 2.2 2.2L6.1 12.3 2.5 13.5l1.2-3.6 7.9-7.5Z"/><path d="m9.8 4.2 2 2"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 12.5 12.5 3.5"/><path d="M6.5 3.5h6v6"/></svg>',
  box: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.25" width="11" height="9.5" rx="2"/></svg>',
  undo: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.25 2.75 2.5 5.5l2.75 2.75"/><path d="M2.75 5.5H9a3.75 3.75 0 1 1 0 7.5H6"/></svg>',
  redo: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.75 2.75 13.5 5.5l-2.75 2.75"/><path d="M13.25 5.5H7a3.75 3.75 0 1 0 0 7.5h3"/></svg>',
  clear: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 4.5h10.5"/><path d="M6 4.5V3.25A1.25 1.25 0 0 1 7.25 2h1.5A1.25 1.25 0 0 1 10 3.25V4.5"/><path d="M4.25 4.5 4.9 12.4A1.5 1.5 0 0 0 6.4 13.75h3.2a1.5 1.5 0 0 0 1.5-1.35l.65-7.9"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 8h8.5"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.75v8.5M3.75 8h8.5"/></svg>',
  image: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.25" y="2.75" width="11.5" height="10.5" rx="2"/><circle cx="5.75" cy="6.25" r="1.15" fill="currentColor" stroke="none"/><path d="m2.75 11.25 3.1-3.1a.9.9 0 0 1 1.27 0l1.88 1.88 1.6-1.6a.9.9 0 0 1 1.27 0l1.63 1.63"/></svg>',
  alert: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.75"/><path d="M8 5.25v3.25"/><circle cx="8" cy="10.85" r=".75" fill="currentColor" stroke="none"/></svg>'
}

const MESSAGES = {
  en: {
    toolsGroup: 'Markup tools',
    pen: 'Pen',
    arrow: 'Arrow',
    box: 'Box',
    paletteGroup: 'Ink color',
    customColor: 'Custom color',
    colorVermilion: 'Vermilion',
    colorAmber: 'Amber',
    colorEmerald: 'Emerald',
    colorCobalt: 'Cobalt',
    colorCharcoal: 'Ink charcoal',
    weightGroup: 'Stroke width',
    thin: 'Thin stroke',
    medium: 'Medium stroke',
    bold: 'Bold stroke',
    undo: 'Undo',
    redo: 'Redo',
    clear: 'Clear all markups',
    zoomGroup: 'Zoom controls',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    fit: 'Fit to window',
    canvasAria: 'Image canvas. Use arrows to move, Space to draw, Enter to finish.',
    opening: 'Opening image…',
    tooLargeBytes: 'This image exceeds 32 MiB.',
    tooLargePixels: 'This image is too large to annotate.',
    openFailed: 'Could not open this image.',
    markupCount: n => (n === 1 ? '1 markup' : `${n} markups`)
  },
  'zh-CN': {
    toolsGroup: '标注工具',
    pen: '画笔',
    arrow: '箭头',
    box: '方框',
    paletteGroup: '标注颜色',
    customColor: '自定义颜色',
    colorVermilion: '朱红',
    colorAmber: '琥珀',
    colorEmerald: '翠绿',
    colorCobalt: '钴蓝',
    colorCharcoal: '墨黑',
    weightGroup: '线条粗细',
    thin: '细线条',
    medium: '中等线条',
    bold: '粗线条',
    undo: '撤销',
    redo: '重做',
    clear: '清除全部标注',
    zoomGroup: '缩放控制',
    zoomOut: '缩小',
    zoomIn: '放大',
    fit: '适应窗口',
    canvasAria: '图像画布。方向键移动，空格开始绘制，回车完成。',
    opening: '正在打开图片…',
    tooLargeBytes: '图片超过了 32 MiB。',
    tooLargePixels: '这张图片太大，无法标注。',
    openFailed: '无法打开这张图片。',
    markupCount: n => `${n} 处标注`
  },
  'zh-TW': {
    toolsGroup: '標註工具',
    pen: '畫筆',
    arrow: '箭頭',
    box: '方框',
    paletteGroup: '標註顏色',
    customColor: '自訂顏色',
    colorVermilion: '朱紅',
    colorAmber: '琥珀',
    colorEmerald: '翠綠',
    colorCobalt: '鈷藍',
    colorCharcoal: '墨黑',
    weightGroup: '線條粗細',
    thin: '細線條',
    medium: '中等線條',
    bold: '粗線條',
    undo: '復原',
    redo: '重做',
    clear: '清除全部標註',
    zoomGroup: '縮放控制',
    zoomOut: '縮小',
    zoomIn: '放大',
    fit: '符合視窗',
    canvasAria: '影像畫布。方向鍵移動，空白鍵開始繪製，Enter 完成。',
    opening: '正在開啟圖片…',
    tooLargeBytes: '圖片超過了 32 MiB。',
    tooLargePixels: '這張圖片太大，無法標註。',
    openFailed: '無法開啟這張圖片。',
    markupCount: n => `${n} 處標註`
  },
  ja: {
    toolsGroup: '注釈ツール',
    pen: 'ペン',
    arrow: '矢印',
    box: '枠',
    paletteGroup: 'インクの色',
    customColor: 'カスタムカラー',
    colorVermilion: '朱色',
    colorAmber: 'アンバー',
    colorEmerald: 'エメラルド',
    colorCobalt: 'コバルト',
    colorCharcoal: 'チャコール',
    weightGroup: '線の太さ',
    thin: '細い線',
    medium: '標準の線',
    bold: '太い線',
    undo: '取り消す',
    redo: 'やり直す',
    clear: 'すべての注釈を消去',
    zoomGroup: 'ズーム操作',
    zoomOut: '縮小',
    zoomIn: '拡大',
    fit: 'ウィンドウに合わせる',
    canvasAria: '画像キャンバス。矢印キーで移動、スペースで描画開始、Enter で確定。',
    opening: '画像を開いています…',
    tooLargeBytes: 'この画像は 32 MiB を超えています。',
    tooLargePixels: 'この画像は大きすぎて注釈できません。',
    openFailed: 'この画像を開けませんでした。',
    markupCount: n => `${n} 件の注釈`
  },
  fr: {
    toolsGroup: 'Outils d’annotation',
    pen: 'Stylo',
    arrow: 'Flèche',
    box: 'Cadre',
    paletteGroup: 'Couleur de l’encre',
    customColor: 'Couleur personnalisée',
    colorVermilion: 'Vermillon',
    colorAmber: 'Ambre',
    colorEmerald: 'Émeraude',
    colorCobalt: 'Cobalt',
    colorCharcoal: 'Charbon',
    weightGroup: 'Épaisseur du trait',
    thin: 'Trait fin',
    medium: 'Trait moyen',
    bold: 'Trait épais',
    undo: 'Annuler',
    redo: 'Rétablir',
    clear: 'Effacer les annotations',
    zoomGroup: 'Contrôles du zoom',
    zoomOut: 'Zoom arrière',
    zoomIn: 'Zoom avant',
    fit: 'Ajuster à la fenêtre',
    canvasAria: 'Canevas d’image. Flèches pour déplacer, Espace pour dessiner, Entrée pour terminer.',
    opening: 'Ouverture de l’image…',
    tooLargeBytes: 'Cette image dépasse 32 Mio.',
    tooLargePixels: 'Cette image est trop grande pour être annotée.',
    openFailed: 'Impossible d’ouvrir cette image.',
    markupCount: n => (n === 1 ? '1 annotation' : `${n} annotations`)
  }
}

function resolveLocale(raw) {
  const code = String(raw || 'en').toLowerCase()
  if (code.startsWith('zh')) {
    if (/(hant|tw|hk|mo)\b/u.test(code)) return 'zh-TW'
    return 'zh-CN'
  }
  if (code.startsWith('ja')) return 'ja'
  if (code.startsWith('fr')) return 'fr'
  return 'en'
}

let locale = resolveLocale(theme.locale)
const t = key => MESSAGES[locale][key]

document.body.innerHTML = `<header>
  <div class="tools" role="group">
    <button type="button" data-tool="pen" aria-pressed="true">${ICONS.pen}<span class="tool-label"></span></button>
    <button type="button" data-tool="arrow" aria-pressed="false">${ICONS.arrow}<span class="tool-label"></span></button>
    <button type="button" data-tool="box" aria-pressed="false">${ICONS.box}<span class="tool-label"></span></button>
  </div>
  <span class="divider" aria-hidden="true"></span>
  <div class="palette" role="group">
    <div class="swatches">
      ${PRESET_COLORS.map((c, index) => `<button type="button" class="swatch" data-color="${c.hex}" aria-pressed="${index === 0}" style="--swatch-color:${c.hex}"></button>`).join('')}
    </div>
    <label class="color-custom" data-active="false" style="--active-color:#e75336">
      <input type="color" value="#e75336">
    </label>
  </div>
  <div class="weights" role="group">
    ${STROKE_WEIGHTS.map(w => `<button type="button" class="weight-btn" data-weight="${w.id}" aria-pressed="${w.id === 'medium'}"><span class="weight-dot" style="--dot:${w.dot}px"></span></button>`).join('')}
  </div>
  <span class="divider" aria-hidden="true"></span>
  <div class="history">
    <button type="button" id="undo" class="icon-btn" disabled>${ICONS.undo}</button>
    <button type="button" id="redo" class="icon-btn" disabled>${ICONS.redo}</button>
    <button type="button" id="clear" class="icon-btn danger-hover" disabled>${ICONS.clear}</button>
  </div>
  <div class="zoom" role="group">
    <button type="button" id="out" class="zoom-btn">${ICONS.minus}</button>
    <button type="button" id="fit" class="zoom-fit">100%</button>
    <button type="button" id="in" class="zoom-btn">${ICONS.plus}</button>
  </div>
</header>
<main>
  <div class="stage">
    <canvas hidden tabindex="0"></canvas>
  </div>
  <div class="status-overlay" role="status" aria-live="polite" data-state="loading">
    <span class="status-spinner" aria-hidden="true"></span>
    <span class="status-alert" aria-hidden="true">${ICONS.alert}</span>
    <span class="status-text"></span>
  </div>
</main>
<footer>
  <div class="footer-meta">
    <span class="file-icon" aria-hidden="true">${ICONS.image}</span>
    <span id="filename"></span>
    <span id="markup-count" class="count-pill" hidden></span>
  </div>
  <span id="dimensions"></span>
</footer>`

const $ = selector => document.querySelector(selector)
const $$ = selector => [...document.querySelectorAll(selector)]

const canvas = $('canvas')
const ctx = canvas.getContext('2d')
const main = $('main')
const statusEl = $('[role="status"]')
const statusTextEl = $('.status-text')
const colorInput = $('input[type="color"]')
const customColorEl = $('.color-custom')
const undoBtn = $('#undo')
const redoBtn = $('#redo')
const clearBtn = $('#clear')
const outBtn = $('#out')
const fitBtn = $('#fit')
const inBtn = $('#in')
const filenameEl = $('#filename')
const markupCountEl = $('#markup-count')
const dimensionsEl = $('#dimensions')

const marks = []
const undoStack = []
const redoStack = []

let bitmap
let tool = 'pen'
let weight = 'medium'
let currentColor = '#e75336'
let scale = 1
let fit = true
let active
let pointer
let cursor
let statusKey = 'opening'

filenameEl.textContent = file?.path.split(/[\\/]/).pop() ?? ''

function syncMarkupCount() {
  if (!marks.length) {
    markupCountEl.hidden = true
    markupCountEl.textContent = ''
    return
  }
  markupCountEl.hidden = false
  markupCountEl.textContent = MESSAGES[locale].markupCount(marks.length)
}

function showStatus(state, messageKey) {
  statusKey = messageKey
  statusEl.dataset.state = state
  statusTextEl.textContent = t(messageKey)
  statusEl.hidden = false
}

function applyLabels() {
  $('.tools').setAttribute('aria-label', t('toolsGroup'))
  for (const [id, shortcut] of [['pen', '1'], ['arrow', '2'], ['box', '3']]) {
    const btn = $(`[data-tool="${id}"]`)
    const name = t(id)
    btn.querySelector('.tool-label').textContent = name
    btn.title = `${name} (${shortcut})`
    btn.setAttribute('aria-label', name)
  }

  $('.palette').setAttribute('aria-label', t('paletteGroup'))
  for (const preset of PRESET_COLORS) {
    const btn = $(`.swatch[data-color="${preset.hex}"]`)
    const name = t(preset.key)
    btn.title = name
    btn.setAttribute('aria-label', name)
  }
  customColorEl.title = t('customColor')
  colorInput.setAttribute('aria-label', t('customColor'))

  $('.weights').setAttribute('aria-label', t('weightGroup'))
  for (const item of STROKE_WEIGHTS) {
    const btn = $(`[data-weight="${item.id}"]`)
    const name = t(item.key)
    btn.title = name
    btn.setAttribute('aria-label', name)
  }

  undoBtn.title = `${t('undo')} (${modUndo})`
  undoBtn.setAttribute('aria-label', `${t('undo')} (${modUndo})`)
  redoBtn.title = `${t('redo')} (${modRedo})`
  redoBtn.setAttribute('aria-label', `${t('redo')} (${modRedo})`)
  clearBtn.title = t('clear')
  clearBtn.setAttribute('aria-label', t('clear'))

  $('.zoom').setAttribute('aria-label', t('zoomGroup'))
  outBtn.title = `${t('zoomOut')} (−)`
  outBtn.setAttribute('aria-label', t('zoomOut'))
  fitBtn.title = `${t('fit')} (0)`
  fitBtn.setAttribute('aria-label', t('fit'))
  inBtn.title = `${t('zoomIn')} (+)`
  inBtn.setAttribute('aria-label', t('zoomIn'))

  canvas.setAttribute('aria-label', t('canvasAria'))
  if (!statusEl.hidden && statusKey) statusTextEl.textContent = t(statusKey)
  syncMarkupCount()
}

applyLabels()
api.onTheme(nextTheme => {
  const nextLocale = resolveLocale(nextTheme.locale)
  if (nextLocale !== locale) {
    locale = nextLocale
    applyLabels()
  }
})
api.ready()

function setTool(nextTool) {
  tool = nextTool
  for (const button of $$('[data-tool]')) {
    button.setAttribute('aria-pressed', String(button.dataset.tool === tool))
  }
}

function setWeight(nextWeight) {
  weight = nextWeight
  for (const button of $$('[data-weight]')) {
    button.setAttribute('aria-pressed', String(button.dataset.weight === weight))
  }
}

function setColor(hex) {
  const normalized = hex.toLowerCase()
  currentColor = normalized
  if (colorInput.value.toLowerCase() !== normalized) colorInput.value = normalized
  customColorEl.style.setProperty('--active-color', normalized)
  let matchedPreset = false
  for (const button of $$('.swatch')) {
    const isMatch = button.dataset.color === normalized
    if (isMatch) matchedPreset = true
    button.setAttribute('aria-pressed', String(isMatch))
  }
  customColorEl.dataset.active = String(!matchedPreset)
}

function drawMark(mark) {
  const a = mark.points[0]
  const b = mark.points.at(-1)
  ctx.lineWidth = mark.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = mark.color
  ctx.fillStyle = mark.color
  ctx.beginPath()
  if (a.x === b.x && a.y === b.y && mark.points.length <= 2) {
    ctx.arc(a.x, a.y, mark.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  if (mark.tool === 'box') {
    ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y)
  } else if (mark.tool === 'arrow') {
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const head = Math.min(mark.width * 4, Math.hypot(b.x - a.x, b.y - a.y) / 2)
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    for (const delta of [-0.52, 0.52]) {
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - head * Math.cos(angle + delta), b.y - head * Math.sin(angle + delta))
    }
  } else {
    ctx.moveTo(a.x, a.y)
    if (mark.points.length === 2) {
      ctx.lineTo(b.x, b.y)
    } else {
      for (let i = 1; i < mark.points.length - 1; i++) {
        const p = mark.points[i]
        const next = mark.points[i + 1]
        ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2)
      }
      ctx.lineTo(b.x, b.y)
    }
  }
  ctx.stroke()
}

function paint() {
  if (!bitmap) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  for (const mark of marks) drawMark(mark)
  if (active) drawMark(active)
  undoBtn.disabled = !undoStack.length
  redoBtn.disabled = !redoStack.length
  clearBtn.disabled = !marks.length
  syncMarkupCount()
}

function updateDimensions() {
  if (!bitmap) return
  if (cursor) dimensionsEl.textContent = `${Math.round(cursor.x)}, ${Math.round(cursor.y)} px`
  else dimensionsEl.textContent = `${bitmap.width} × ${bitmap.height} px`
}

function layout() {
  if (!bitmap) return
  if (fit) {
    scale = Math.min(
      1,
      Math.max(1, main.clientWidth - 32) / bitmap.width,
      Math.max(1, main.clientHeight - 32) / bitmap.height
    )
  }
  canvas.style.width = `${bitmap.width * scale}px`
  canvas.style.height = `${bitmap.height * scale}px`
  fitBtn.textContent = `${Math.round(scale * 100)}%`
  fitBtn.dataset.fitted = String(fit)
}

function zoom(factor) {
  if (!bitmap) return
  fit = false
  scale = Math.max(0.05, Math.min(8, scale * factor))
  layout()
}

function resetFit() {
  if (!bitmap) return
  fit = true
  layout()
}

fitBtn.onclick = resetFit
outBtn.onclick = () => zoom(1 / 1.25)
inBtn.onclick = () => zoom(1.25)
new ResizeObserver(layout).observe(main)

for (const button of $$('[data-tool]')) {
  button.onclick = () => setTool(button.dataset.tool)
}

for (const button of $$('[data-weight]')) {
  button.onclick = () => setWeight(button.dataset.weight)
}

for (const button of $$('.swatch')) {
  button.onclick = () => setColor(button.dataset.color)
}

colorInput.addEventListener('input', () => setColor(colorInput.value))
colorInput.addEventListener('change', () => setColor(colorInput.value))

function undo() {
  if (!undoStack.length || active) return
  const entry = undoStack.pop()
  redoStack.push(entry)
  if (entry.type === 'add') marks.pop()
  else if (entry.type === 'clear') marks.push(...entry.marks)
  paint()
}

function redo() {
  if (!redoStack.length || active) return
  const entry = redoStack.pop()
  undoStack.push(entry)
  if (entry.type === 'add') marks.push(entry.mark)
  else if (entry.type === 'clear') marks.length = 0
  paint()
}

function clearAll() {
  if (!marks.length || active) return
  undoStack.push({ type: 'clear', marks: [...marks] })
  marks.length = 0
  redoStack.length = 0
  paint()
}

undoBtn.onclick = undo
redoBtn.onclick = redo
clearBtn.onclick = clearAll

function strokeWidth() {
  const spec = STROKE_WEIGHTS.find(item => item.id === weight) ?? STROKE_WEIGHTS[1]
  return Math.max(spec.min, spec.base / scale)
}

function start(p) {
  const ink = colorInput.value || currentColor
  active = { tool, color: ink, width: strokeWidth(), points: [p] }
  paint()
}

function move(p) {
  if (!active) return
  if (active.tool === 'pen') {
    const prev = active.points.at(-1)
    if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < 0.4) return
    active.points.push(p)
  } else {
    active.points[1] = p
  }
  paint()
}

function finish() {
  if (!active) return
  marks.push(active)
  undoStack.push({ type: 'add', mark: active })
  redoStack.length = 0
  active = undefined
  paint()
}

function point(e) {
  const r = canvas.getBoundingClientRect()
  return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }
}

canvas.onpointerdown = e => {
  if (e.button || active) return
  cursor = undefined
  updateDimensions()
  canvas.setAttribute('data-pointer-focus', 'true')
  canvas.focus({ preventScroll: true })
  pointer = e.pointerId
  canvas.setPointerCapture(pointer)
  start(point(e))
}

canvas.onpointermove = e => {
  if (active && e.pointerId === pointer) move(point(e))
}

canvas.onpointerup = e => {
  if (active && e.pointerId === pointer) {
    move(point(e))
    pointer = undefined
    finish()
  }
}

canvas.onpointercancel = () => {
  pointer = undefined
  active = undefined
  paint()
}

canvas.onblur = () => {
  canvas.removeAttribute('data-pointer-focus')
  if (cursor) {
    cursor = undefined
    updateDimensions()
  }
}

main.addEventListener('wheel', e => {
  if (!bitmap || (!e.ctrlKey && !e.metaKey)) return
  e.preventDefault()
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
  zoom(factor)
}, { passive: false })

document.onkeydown = e => {
  if (e.key === 'Tab' || (e.target === canvas && (e.key.startsWith('Arrow') || e.key === ' ' || e.key === 'Enter'))) {
    canvas.removeAttribute('data-pointer-focus')
  }
  if (!bitmap) return
  const key = e.key.toLowerCase()
  const mod = e.ctrlKey || e.metaKey

  if (mod && !e.altKey && key === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
    return
  }
  if (mod && !e.altKey && !e.shiftKey && key === 'y') {
    e.preventDefault()
    redo()
    return
  }

  const inInput = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/u.test(e.target.tagName)

  if (!inInput && !e.altKey) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault()
      zoom(1.25)
      return
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      zoom(1 / 1.25)
      return
    }
    if (e.key === '0' && (!mod || e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      resetFit()
      return
    }
    if (!mod) {
      if (key === '1' || key === 'p') { e.preventDefault(); setTool('pen'); return }
      if (key === '2' || key === 'a') { e.preventDefault(); setTool('arrow'); return }
      if (key === '3' || key === 'b') { e.preventDefault(); setTool('box'); return }
    }
  }

  if (e.target !== canvas || pointer !== undefined) return
  cursor ??= { x: canvas.width / 2, y: canvas.height / 2 }
  const step = e.shiftKey ? 10 : 1
  if (e.key.startsWith('Arrow')) {
    e.preventDefault()
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    cursor = {
      x: Math.max(0, Math.min(canvas.width - 1, cursor.x + delta[0])),
      y: Math.max(0, Math.min(canvas.height - 1, cursor.y + delta[1]))
    }
    if (active) move(cursor)
    updateDimensions()
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    active ? finish() : start(cursor)
  } else if (e.key === 'Escape') {
    active = undefined
    paint()
  }
}

async function openImage() {
  if (!file?.version || !file.size) throw new Error()
  if (file.size > 32 * 1024 * 1024) {
    showStatus('error', 'tooLargeBytes')
    return
  }
  const parts = []
  for (let offset = 0; offset < file.size; offset += 524288) {
    parts.push(await api.readActiveBytes(offset, Math.min(524288, file.size - offset)))
  }
  bitmap = await createImageBitmap(new Blob(parts))
  parts.length = 0
  if (bitmap.width * bitmap.height > 32_000_000 || Math.max(bitmap.width, bitmap.height) > 16384) {
    bitmap.close()
    bitmap = undefined
    showStatus('error', 'tooLargePixels')
    return
  }
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.hidden = false
  updateDimensions()
  layout()
  paint()
  statusEl.hidden = true
  api.onExport(() => new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error())), 'image/png')
  }))
}

void openImage().catch(() => {
  showStatus('error', 'openFailed')
})
