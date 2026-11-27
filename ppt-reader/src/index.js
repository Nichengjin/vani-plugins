import './style.css'
import { readerLabels } from './labels.js'
import { parsePptx } from './pptx-parser.js'

const MAX_BYTES = 48 * 1024 * 1024
const READ_CHUNK = 512 * 1024
const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200]
const THUMB_WIDTH = 136
const SVG_NS = 'http://www.w3.org/2000/svg'

const STATUS_ICONS = {
  opening: '<svg class="spin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" opacity="0.22"/><path d="M10 3.5a6.5 6.5 0 0 1 6.5 6.5"/></svg>',
  empty: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="11" rx="1.8"/><path d="M7 15v2M13 15v2M5.5 17h9"/></svg>',
  error: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6.75v3.75"/><circle cx="10" cy="13.25" r="0.65" fill="currentColor" stroke="none"/></svg>'
}

function fileName(filePath) {
  if (typeof filePath !== 'string' || !filePath) return ''
  return filePath.split(/[\\/]/u).pop() || ''
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v))
  }
  return el
}

function buildShell() {
  const toolbar = document.createElement('header')
  toolbar.className = 'toolbar'

  const left = document.createElement('div')
  left.className = 'toolbar-left'

  const thumbsBtn = document.createElement('button')
  thumbsBtn.type = 'button'
  thumbsBtn.id = 'thumbs-toggle'
  thumbsBtn.className = 'icon-btn'
  thumbsBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5"/><path d="M6 2.75v10.5"/></svg>'

  const sep = document.createElement('span')
  sep.className = 'toolbar-sep'
  sep.setAttribute('aria-hidden', 'true')

  const prevBtn = document.createElement('button')
  prevBtn.type = 'button'
  prevBtn.id = 'prev'
  prevBtn.className = 'icon-btn'
  prevBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.75 3.75 5.5 8l4.25 4.25"/></svg>'

  const readout = document.createElement('div')
  readout.className = 'page-readout'

  const pageInput = document.createElement('input')
  pageInput.id = 'page'
  pageInput.type = 'text'
  pageInput.inputMode = 'numeric'
  pageInput.autocomplete = 'off'
  pageInput.value = '1'
  pageInput.size = 3

  const slash = document.createElement('span')
  slash.className = 'slash'
  slash.setAttribute('aria-hidden', 'true')
  slash.textContent = '/'

  const countSpan = document.createElement('span')
  countSpan.id = 'count'
  countSpan.textContent = '—'

  readout.append(pageInput, slash, countSpan)

  const nextBtn = document.createElement('button')
  nextBtn.type = 'button'
  nextBtn.id = 'next'
  nextBtn.className = 'icon-btn'
  nextBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.25 3.75 10.5 8l-4.25 4.25"/></svg>'

  left.append(thumbsBtn, sep, prevBtn, readout, nextBtn)

  const titleEl = document.createElement('span')
  titleEl.id = 'doc-title'
  titleEl.className = 'doc-title'

  const right = document.createElement('div')
  right.className = 'toolbar-right'

  const notesBtn = document.createElement('button')
  notesBtn.type = 'button'
  notesBtn.id = 'notes-toggle'
  notesBtn.className = 'notes-toggle'
  notesBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.25 3.5h9.5a1 1 0 0 1 1 1v6.25l-2.75 2.75H3.25a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"/><path d="M5 6.5h6M5 9.25h4"/></svg><span class="notes-label-text"></span><span class="notes-dot" hidden></span>'

  const zoomControl = document.createElement('div')
  zoomControl.className = 'zoom-control'

  const zoomCapsule = document.createElement('div')
  zoomCapsule.className = 'zoom-capsule'

  const zoomOutBtn = document.createElement('button')
  zoomOutBtn.type = 'button'
  zoomOutBtn.id = 'zoom-out'
  zoomOutBtn.className = 'zoom-step'
  zoomOutBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9"/></svg>'

  const zoomTriggerBtn = document.createElement('button')
  zoomTriggerBtn.type = 'button'
  zoomTriggerBtn.id = 'zoom-trigger'
  zoomTriggerBtn.className = 'zoom-trigger'
  zoomTriggerBtn.setAttribute('aria-haspopup', 'listbox')
  zoomTriggerBtn.setAttribute('aria-expanded', 'false')
  zoomTriggerBtn.setAttribute('aria-controls', 'zoom-menu')
  zoomTriggerBtn.innerHTML = '<span id="zoom-label" class="zoom-label"></span><svg class="zoom-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 6.25 8 10l3.75-3.75"/></svg>'

  const zoomInBtn = document.createElement('button')
  zoomInBtn.type = 'button'
  zoomInBtn.id = 'zoom-in'
  zoomInBtn.className = 'zoom-step'
  zoomInBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>'

  zoomCapsule.append(zoomOutBtn, zoomTriggerBtn, zoomInBtn)

  const zoomMenu = document.createElement('div')
  zoomMenu.id = 'zoom-menu'
  zoomMenu.className = 'zoom-menu'
  zoomMenu.setAttribute('role', 'listbox')
  zoomMenu.hidden = true

  const fitOption = document.createElement('button')
  fitOption.type = 'button'
  fitOption.className = 'zoom-option'
  fitOption.setAttribute('role', 'option')
  fitOption.dataset.value = 'fit'
  fitOption.setAttribute('aria-selected', 'true')
  fitOption.tabIndex = -1
  fitOption.innerHTML = '<span data-label="fitSlide"></span><svg class="zoom-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>'

  const zoomDivider = document.createElement('div')
  zoomDivider.className = 'zoom-divider'
  zoomDivider.setAttribute('role', 'separator')

  zoomMenu.append(fitOption, zoomDivider)
  for (const percent of ZOOM_PRESETS) {
    const opt = document.createElement('button')
    opt.type = 'button'
    opt.className = 'zoom-option'
    opt.setAttribute('role', 'option')
    opt.dataset.value = String(percent)
    opt.setAttribute('aria-selected', 'false')
    opt.tabIndex = -1
    opt.innerHTML = `<span>${percent}%</span><svg class="zoom-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>`
    zoomMenu.appendChild(opt)
  }

  zoomControl.append(zoomCapsule, zoomMenu)
  right.append(notesBtn, zoomControl)

  const progressTrack = document.createElement('div')
  progressTrack.className = 'progress-track'
  progressTrack.setAttribute('aria-hidden', 'true')
  const progressBar = document.createElement('div')
  progressBar.className = 'progress-bar'
  progressTrack.appendChild(progressBar)

  toolbar.append(left, titleEl, right, progressTrack)

  const body = document.createElement('div')
  body.className = 'deck-body'

  const thumbs = document.createElement('aside')
  thumbs.className = 'thumbs'
  thumbs.id = 'thumbs'

  const workspace = document.createElement('div')
  workspace.className = 'workspace'

  const stage = document.createElement('main')
  stage.className = 'stage'
  stage.tabIndex = 0

  const slideFrame = document.createElement('div')
  slideFrame.className = 'slide-frame'
  slideFrame.id = 'slide-frame'
  slideFrame.hidden = true
  stage.appendChild(slideFrame)

  const notesDrawer = document.createElement('section')
  notesDrawer.className = 'notes-drawer'
  notesDrawer.id = 'notes-drawer'
  notesDrawer.hidden = true

  const notesHeader = document.createElement('div')
  notesHeader.className = 'notes-header'

  const notesTitleGroup = document.createElement('div')
  notesTitleGroup.className = 'notes-title-group'
  const notesTitle = document.createElement('span')
  notesTitle.className = 'notes-title'
  const notesBadge = document.createElement('span')
  notesBadge.className = 'notes-slide-badge'
  notesTitleGroup.append(notesTitle, notesBadge)

  const notesCloseBtn = document.createElement('button')
  notesCloseBtn.type = 'button'
  notesCloseBtn.id = 'notes-close'
  notesCloseBtn.className = 'icon-btn notes-close'
  notesCloseBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 4.25 11.75 11.75M11.75 4.25 4.25 11.75"/></svg>'

  notesHeader.append(notesTitleGroup, notesCloseBtn)

  const notesBody = document.createElement('div')
  notesBody.className = 'notes-body'
  notesBody.id = 'notes-body'

  notesDrawer.append(notesHeader, notesBody)
  workspace.append(stage, notesDrawer)
  body.append(thumbs, workspace)

  const status = document.createElement('div')
  status.id = 'status'
  status.setAttribute('role', 'status')
  const statusIcon = document.createElement('span')
  statusIcon.className = 'status-icon'
  statusIcon.setAttribute('aria-hidden', 'true')
  const statusText = document.createElement('span')
  statusText.className = 'status-text'
  status.append(statusIcon, statusText)

  document.body.replaceChildren(toolbar, body, status)

  return {
    toolbar,
    thumbsBtn,
    prevBtn,
    pageInput,
    countSpan,
    nextBtn,
    titleEl,
    notesBtn,
    notesLabelText: notesBtn.querySelector('.notes-label-text'),
    notesDot: notesBtn.querySelector('.notes-dot'),
    zoomControl,
    zoomOutBtn,
    zoomTriggerBtn,
    zoomLabel: zoomTriggerBtn.querySelector('#zoom-label'),
    zoomInBtn,
    zoomMenu,
    zoomOptions: [...zoomMenu.querySelectorAll('.zoom-option')],
    thumbs,
    stage,
    slideFrame,
    notesDrawer,
    notesTitle,
    notesBadge,
    notesCloseBtn,
    notesBody,
    status,
    statusIcon,
    statusText
  }
}

function applyBackground(el, fill) {
  if (!fill || fill.type === 'none') return
  if (fill.type === 'solid') {
    el.style.backgroundColor = fill.color
  } else if (fill.type === 'gradient') {
    el.style.backgroundImage = fill.css
  } else if (fill.type === 'image' && fill.dataUri) {
    el.style.backgroundImage = `url("${fill.dataUri}")`
    el.style.backgroundSize = 'cover'
    el.style.backgroundPosition = 'center'
    el.style.backgroundRepeat = 'no-repeat'
  }
}

function applyTransform(el, xfrm) {
  const parts = []
  if (xfrm.rot) parts.push(`rotate(${xfrm.rot}deg)`)
  if (xfrm.flipH) parts.push('scaleX(-1)')
  if (xfrm.flipV) parts.push('scaleY(-1)')
  if (parts.length > 0) el.style.transform = parts.join(' ')
}

function renderTextBody(txBody, container) {
  if (!txBody || !txBody.paragraphs?.length) return
  const tx = document.createElement('div')
  tx.className = 'ppt-tx'
  tx.style.justifyContent = txBody.anchor
  tx.style.padding = `${txBody.padT}px ${txBody.padR}px ${txBody.padB}px ${txBody.padL}px`
  if (!txBody.wrap) tx.style.whiteSpace = 'nowrap'

  for (const p of txBody.paragraphs) {
    const pEl = document.createElement('div')
    pEl.className = 'ppt-p'
    pEl.style.textAlign = p.align
    pEl.style.marginLeft = `${Math.max(0, p.marginLeft + (p.indent < 0 ? p.indent : 0))}px`
    if (p.indent > 0) pEl.style.textIndent = `${p.indent}px`
    if (p.spaceBefore) pEl.style.marginTop = `${p.spaceBefore}px`
    if (p.spaceAfter) pEl.style.marginBottom = `${p.spaceAfter}px`
    pEl.style.lineHeight = p.lineHeightPx ? `${p.lineHeightPx}px` : String(p.lineHeight)

    if (p.bullet) {
      const bEl = document.createElement('span')
      bEl.className = 'ppt-bullet'
      const bulletGap = Math.max(12, Math.abs(p.indent || 16))
      bEl.style.width = `${bulletGap}px`
      bEl.style.fontSize = `${p.runs[0]?.fontSize || p.defaultFontSize}px`
      bEl.style.color = p.bullet.color
      bEl.textContent = p.bullet.text
      pEl.appendChild(bEl)
    }

    const content = document.createElement('span')
    content.className = 'ppt-p-content'
    if (p.runs.length === 0) {
      const spacer = document.createElement('span')
      spacer.style.fontSize = `${p.defaultFontSize}px`
      spacer.textContent = '\u200B'
      content.appendChild(spacer)
    } else {
      for (const run of p.runs) {
        if (run.br) {
          content.appendChild(document.createElement('br'))
          continue
        }
        const span = document.createElement('span')
        span.textContent = run.text
        if (run.fontSize) span.style.fontSize = `${run.fontSize}px`
        if (run.fontFamily) span.style.fontFamily = run.fontFamily
        if (run.color) span.style.color = run.color
        if (run.bold) span.style.fontWeight = '700'
        if (run.italic) span.style.fontStyle = 'italic'
        const decos = []
        if (run.underline) decos.push('underline')
        if (run.strike) decos.push('line-through')
        if (decos.length > 0) span.style.textDecoration = decos.join(' ')
        content.appendChild(span)
      }
    }

    pEl.appendChild(content)
    tx.appendChild(pEl)
  }

  container.appendChild(tx)
}

function shapeGeometrySvg(prst, w, h, fill, border) {
  const stroke = border && border.type === 'line' ? border.color : 'none'
  const strokeWidth = border && border.type === 'line' ? border.width : 0
  const fillCss = fill?.type === 'solid' ? fill.color : 'none'
  const dash = border?.dash === 'dashed' ? `${strokeWidth * 4} ${strokeWidth * 3}` : border?.dash === 'dotted' ? `${strokeWidth} ${strokeWidth * 2}` : null

  const polygonPoints = {
    triangle: `${w / 2},0 ${w},${h} 0,${h}`,
    rtTriangle: `0,0 ${w},${h} 0,${h}`,
    diamond: `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`,
    parallelogram: `${w * 0.2},0 ${w},0 ${w * 0.8},${h} 0,${h}`,
    pentagon: `0,0 ${w * 0.72},0 ${w},${h / 2} ${w * 0.72},${h} 0,${h}`,
    hexagon: `${w * 0.22},0 ${w * 0.78},0 ${w},${h / 2} ${w * 0.78},${h} ${w * 0.22},${h} 0,${h / 2}`,
    chevron: `0,0 ${w * 0.75},0 ${w},${h / 2} ${w * 0.75},${h} 0,${h} ${w * 0.25},${h / 2}`,
    rightArrow: `0,${h * 0.25} ${w * 0.65},${h * 0.25} ${w * 0.65},0 ${w},${h / 2} ${w * 0.65},${h} ${w * 0.65},${h * 0.75} 0,${h * 0.75}`,
    leftArrow: `${w},${h * 0.25} ${w * 0.35},${h * 0.25} ${w * 0.35},0 0,${h / 2} ${w * 0.35},${h} ${w * 0.35},${h * 0.75} ${w},${h * 0.75}`,
    upArrow: `${w * 0.25},${h} ${w * 0.25},${h * 0.35} 0,${h * 0.35} ${w / 2},0 ${w},${h * 0.35} ${w * 0.75},${h * 0.35} ${w * 0.75},${h}`,
    downArrow: `${w * 0.25},0 ${w * 0.25},${h * 0.65} 0,${h * 0.65} ${w / 2},${h} ${w},${h * 0.65} ${w * 0.75},${h * 0.65} ${w * 0.75},0`
  }[prst]

  if (!polygonPoints) return null
  const svg = svgEl('svg', { class: 'ppt-shape-svg', viewBox: `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' })
  const poly = svgEl('polygon', {
    points: polygonPoints,
    fill: fillCss,
    stroke,
    'stroke-width': strokeWidth,
    'stroke-linejoin': 'round'
  })
  if (dash) poly.setAttribute('stroke-dasharray', dash)
  svg.appendChild(poly)
  return svg
}

function renderLineElement(el) {
  const { xfrm, border } = el
  const w = Math.max(1, xfrm.w)
  const h = Math.max(1, xfrm.h)
  const stroke = border && border.type === 'line' ? border.color : '#57534e'
  const strokeWidth = border && border.type === 'line' ? border.width : 1.5

  const wrap = document.createElement('div')
  wrap.className = 'ppt-shape'
  wrap.style.left = `${xfrm.x}px`
  wrap.style.top = `${xfrm.y}px`
  wrap.style.width = `${w}px`
  wrap.style.height = `${h}px`
  if (xfrm.rot) wrap.style.transform = `rotate(${xfrm.rot}deg)`

  const svg = svgEl('svg', { class: 'ppt-shape-svg', viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' })
  const x1 = xfrm.flipH ? w : 0
  const y1 = xfrm.flipV ? h : 0
  const x2 = xfrm.flipH ? 0 : w
  const y2 = xfrm.flipV ? 0 : h

  let lineX1 = x1
  let lineY1 = y1
  let lineX2 = x2
  let lineY2 = y2
  if (xfrm.w < 1) {
    lineX1 = w / 2
    lineX2 = w / 2
  }
  if (xfrm.h < 1) {
    lineY1 = h / 2
    lineY2 = h / 2
  }

  const line = svgEl('line', {
    x1: lineX1,
    y1: lineY1,
    x2: lineX2,
    y2: lineY2,
    stroke,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round'
  })
  if (border?.dash === 'dashed') line.setAttribute('stroke-dasharray', `${strokeWidth * 4} ${strokeWidth * 3}`)
  else if (border?.dash === 'dotted') line.setAttribute('stroke-dasharray', `${strokeWidth} ${strokeWidth * 2}`)
  svg.appendChild(line)

  const addArrow = (tipX, tipY, fromX, fromY) => {
    const angle = Math.atan2(tipY - fromY, tipX - fromX)
    const len = Math.max(6, strokeWidth * 4)
    const spread = Math.PI / 6
    const p1x = tipX - len * Math.cos(angle - spread)
    const p1y = tipY - len * Math.sin(angle - spread)
    const p2x = tipX - len * Math.cos(angle + spread)
    const p2y = tipY - len * Math.sin(angle + spread)
    svg.appendChild(svgEl('polygon', {
      points: `${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`,
      fill: stroke
    }))
  }

  if (border?.tailArrow) addArrow(lineX2, lineY2, lineX1, lineY1)
  if (border?.headArrow) addArrow(lineX1, lineY1, lineX2, lineY2)

  wrap.appendChild(svg)
  return wrap
}

function renderSlideCanvas(slide, deck, labels) {
  const canvas = document.createElement('div')
  canvas.className = 'slide-canvas'
  canvas.style.width = `${deck.width}px`
  canvas.style.height = `${deck.height}px`
  applyBackground(canvas, slide.background)

  if (!slide.elements || slide.elements.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'ppt-empty-slide'
    empty.textContent = labels.emptySlide
    canvas.appendChild(empty)
    return canvas
  }

  for (const el of slide.elements) {
    if (el.kind === 'line') {
      if (el.border?.type !== 'none') canvas.appendChild(renderLineElement(el))
      continue
    }

    if (el.kind === 'pic') {
      const pic = document.createElement('div')
      pic.className = 'ppt-pic'
      pic.style.left = `${el.xfrm.x}px`
      pic.style.top = `${el.xfrm.y}px`
      pic.style.width = `${el.xfrm.w}px`
      pic.style.height = `${el.xfrm.h}px`
      applyTransform(pic, el.xfrm)
      if (el.prst === 'ellipse') pic.style.borderRadius = '50%'
      else if (el.prst === 'roundRect') pic.style.borderRadius = `${Math.min(el.xfrm.w, el.xfrm.h) * 0.08}px`
      if (el.border?.type === 'line') {
        pic.style.border = `${el.border.width}px ${el.border.dash} ${el.border.color}`
      }

      const img = document.createElement('img')
      img.src = el.dataUri
      img.alt = ''
      if (el.crop && (el.crop.l || el.crop.t || el.crop.r || el.crop.b)) {
        const wPct = Math.max(0.05, 1 - el.crop.l - el.crop.r)
        const hPct = Math.max(0.05, 1 - el.crop.t - el.crop.b)
        img.style.position = 'absolute'
        img.style.width = `${(1 / wPct) * 100}%`
        img.style.height = `${(1 / hPct) * 100}%`
        img.style.left = `${-(el.crop.l / wPct) * 100}%`
        img.style.top = `${-(el.crop.t / hPct) * 100}%`
      }
      pic.appendChild(img)
      canvas.appendChild(pic)
      continue
    }

    if (el.kind === 'table') {
      const wrap = document.createElement('div')
      wrap.className = 'ppt-table-wrap'
      wrap.style.left = `${el.xfrm.x}px`
      wrap.style.top = `${el.xfrm.y}px`
      wrap.style.width = `${el.xfrm.w}px`
      wrap.style.height = `${el.xfrm.h}px`
      applyTransform(wrap, el.xfrm)

      const table = document.createElement('table')
      table.className = 'ppt-table'
      if (el.colWidths.length > 0) {
        const colgroup = document.createElement('colgroup')
        for (const w of el.colWidths) {
          const col = document.createElement('col')
          col.style.width = `${w}px`
          colgroup.appendChild(col)
        }
        table.appendChild(colgroup)
      }

      const tbody = document.createElement('tbody')
      for (const row of el.rows) {
        const tr = document.createElement('tr')
        if (row.height > 0) tr.style.height = `${row.height}px`
        for (const cell of row.cells) {
          const td = document.createElement('td')
          if (cell.colSpan > 1) td.colSpan = cell.colSpan
          if (cell.rowSpan > 1) td.rowSpan = cell.rowSpan
          if (cell.bg) td.style.background = cell.bg
          td.style.verticalAlign = cell.vAlign
          td.style.padding = `${cell.padT}px ${cell.padR}px ${cell.padB}px ${cell.padL}px`

          const defaultBorder = '1px solid rgba(28, 25, 23, 0.14)'
          const sideCss = side => {
            const b = cell.borders[side]
            if (!b) return defaultBorder
            if (b.type === 'none') return '0'
            return `${b.width}px ${b.dash} ${b.color}`
          }
          td.style.borderLeft = sideCss('lnL')
          td.style.borderRight = sideCss('lnR')
          td.style.borderTop = sideCss('lnT')
          td.style.borderBottom = sideCss('lnB')

          renderTextBody(cell.text, td)
          tr.appendChild(td)
        }
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      wrap.appendChild(table)
      canvas.appendChild(wrap)
      continue
    }

    if (el.kind === 'fallback') {
      const box = document.createElement('div')
      box.className = 'ppt-fallback-box'
      box.style.left = `${el.xfrm.x}px`
      box.style.top = `${el.xfrm.y}px`
      box.style.width = `${el.xfrm.w}px`
      box.style.height = `${el.xfrm.h}px`
      box.textContent = el.fallbackType === 'chart' ? labels.chartFallback : labels.diagramFallback
      canvas.appendChild(box)
      continue
    }

    // Regular shape
    const shape = document.createElement('div')
    shape.className = 'ppt-shape'
    shape.style.left = `${el.xfrm.x}px`
    shape.style.top = `${el.xfrm.y}px`
    shape.style.width = `${el.xfrm.w}px`
    shape.style.height = `${el.xfrm.h}px`
    applyTransform(shape, el.xfrm)

    const polySvg = shapeGeometrySvg(el.prst, el.xfrm.w, el.xfrm.h, el.fill, el.border)
    if (polySvg) {
      shape.appendChild(polySvg)
    } else {
      const bg = document.createElement('div')
      bg.className = 'ppt-shape-bg'
      if (el.prst === 'ellipse') bg.style.borderRadius = '50%'
      else if (el.prst === 'roundRect') bg.style.borderRadius = `${el.roundRadius ?? 8}px`
      applyBackground(bg, el.fill)
      if (el.border?.type === 'line') {
        bg.style.border = `${el.border.width}px ${el.border.dash} ${el.border.color}`
      }
      shape.appendChild(bg)
    }

    renderTextBody(el.text, shape)
    canvas.appendChild(shape)
  }

  return canvas
}

const plugin = window.vaniPlugin
const { context, theme } = await plugin.init
let labels = readerLabels(theme.locale)

const ui = buildShell()
const title = fileName(context.activeFile?.path)
ui.titleEl.textContent = title
ui.titleEl.title = title

let deck = null
let activeSlide = 1
let zoomMode = 'fit'
let effectivePercent = 100
let thumbsOpen = window.innerWidth >= 620
let thumbsUserPinned = false
let notesOpen = false
let currentState = 'opening'
let closed = false
let resizeTimer = null

function slideLabel() {
  return `${labels.slide} ${activeSlide} / ${deck?.slides.length ?? '—'}`
}

function zoomModeLabel(mode) {
  if (mode === 'fit') return labels.fitSlide
  return `${mode}%`
}

function nextZoomStep(direction) {
  if (zoomMode !== 'fit') {
    const idx = ZOOM_PRESETS.indexOf(Number(zoomMode))
    if (idx !== -1) {
      const target = ZOOM_PRESETS[idx + direction]
      return target === undefined ? null : String(target)
    }
  }
  const current = Number.isFinite(effectivePercent) ? effectivePercent : 100
  if (direction > 0) {
    const found = ZOOM_PRESETS.find(p => p > current + 2)
    return found === undefined ? null : String(found)
  }
  for (let i = ZOOM_PRESETS.length - 1; i >= 0; i--) {
    if (ZOOM_PRESETS[i] < current - 2) return String(ZOOM_PRESETS[i])
  }
  return null
}

function updateZoomUi() {
  ui.zoomLabel.textContent = zoomModeLabel(zoomMode)
  for (const opt of ui.zoomOptions) {
    opt.setAttribute('aria-selected', String(opt.dataset.value === zoomMode))
  }
  ui.zoomTriggerBtn.disabled = !deck
  ui.zoomOutBtn.disabled = !deck || nextZoomStep(-1) === null
  ui.zoomInBtn.disabled = !deck || nextZoomStep(1) === null
  if (!deck) closeZoomMenu()
}

function showStatus(key) {
  currentState = key
  const blocking = Boolean(key)
  ui.statusText.textContent = key ? labels[key] : slideLabel()
  ui.status.classList.toggle('visually-hidden', !blocking)
  if (blocking) {
    const isError = key === 'tooLargeBytes' || key === 'openFailed' || key === 'noSlides'
    ui.status.dataset.tone = isError ? 'error' : 'neutral'
    ui.statusIcon.innerHTML = STATUS_ICONS[isError ? (key === 'noSlides' ? 'empty' : 'error') : key] || STATUS_ICONS.error
  } else {
    delete ui.status.dataset.tone
  }
  ui.slideFrame.hidden = blocking
  ui.toolbar.toggleAttribute('data-loading', key === 'opening')
}

function updateNotesUi() {
  const slide = deck?.slides[activeSlide - 1]
  const notes = slide?.notes || ''
  ui.notesDot.hidden = !notes
  ui.notesBtn.disabled = !deck
  ui.notesBtn.setAttribute('aria-pressed', String(notesOpen))
  ui.notesDrawer.hidden = !deck || !notesOpen
  ui.notesBadge.textContent = deck ? `${activeSlide} / ${deck.slides.length}` : ''
  if (notes) {
    ui.notesBody.textContent = notes
    delete ui.notesBody.dataset.empty
  } else {
    ui.notesBody.textContent = labels.noNotes
    ui.notesBody.dataset.empty = 'true'
  }
}

function updateThumbsUi() {
  const show = Boolean(deck) && thumbsOpen
  ui.thumbs.hidden = !show
  ui.thumbsBtn.disabled = !deck
  ui.thumbsBtn.setAttribute('aria-pressed', String(show))
  if (!show) return
  for (const item of ui.thumbs.querySelectorAll('.slide-thumb')) {
    const isCurrent = Number(item.dataset.slide) === activeSlide
    item.setAttribute('aria-current', String(isCurrent))
    if (isCurrent) item.scrollIntoView({ block: 'nearest' })
  }
}

function updateControls() {
  const count = deck?.slides.length ?? 0
  ui.pageInput.value = String(activeSlide)
  ui.countSpan.textContent = deck ? String(count) : '—'
  ui.pageInput.disabled = !deck
  ui.prevBtn.disabled = !deck || activeSlide <= 1
  ui.nextBtn.disabled = !deck || activeSlide >= count
  updateZoomUi()
  updateThumbsUi()
  updateNotesUi()
}

function localize() {
  for (const [el, key] of [
    [ui.thumbsBtn, 'toggleThumbs'],
    [ui.prevBtn, 'previous'],
    [ui.nextBtn, 'next'],
    [ui.pageInput, 'slide'],
    [ui.notesBtn, 'toggleNotes'],
    [ui.notesCloseBtn, 'closeNotes'],
    [ui.zoomTriggerBtn, 'zoom'],
    [ui.zoomOutBtn, 'zoomOut'],
    [ui.zoomInBtn, 'zoomIn']
  ]) {
    el.setAttribute('aria-label', labels[key])
    el.title = labels[key]
  }
  ui.thumbs.setAttribute('aria-label', labels.thumbsLabel)
  ui.notesDrawer.setAttribute('aria-label', labels.notesLabel)
  ui.notesTitle.textContent = labels.notes
  ui.notesLabelText.textContent = labels.notes
  ui.zoomMenu.setAttribute('aria-label', labels.zoomOptions)
  for (const node of ui.zoomMenu.querySelectorAll('[data-label]')) {
    node.textContent = labels[node.dataset.label]
  }
  ui.slideFrame.setAttribute('aria-label', slideLabel())
  updateControls()
  showStatus(currentState)
}

function openZoomMenu(focusTarget = 'selected') {
  if (!deck) return
  ui.zoomMenu.hidden = false
  ui.zoomTriggerBtn.setAttribute('aria-expanded', 'true')
  let option = ui.zoomOptions[0]
  if (focusTarget === 'last') option = ui.zoomOptions[ui.zoomOptions.length - 1]
  else if (focusTarget === 'selected') {
    option = ui.zoomOptions.find(item => item.dataset.value === zoomMode) || ui.zoomOptions[0]
  }
  option?.focus({ preventScroll: true })
}

function closeZoomMenu({ restoreFocus = false } = {}) {
  if (ui.zoomMenu.hidden) return
  ui.zoomMenu.hidden = true
  ui.zoomTriggerBtn.setAttribute('aria-expanded', 'false')
  if (restoreFocus) ui.zoomTriggerBtn.focus()
}

function computeScale() {
  if (!deck) return 1
  if (zoomMode !== 'fit') return Number(zoomMode) / 100
  const style = getComputedStyle(ui.stage)
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
  const availW = Math.max(120, ui.stage.clientWidth - padX)
  const availH = Math.max(120, ui.stage.clientHeight - padY)
  return Math.min(availW / deck.width, availH / deck.height, 2.5)
}

function applyStageScale() {
  if (!deck) return
  const scale = computeScale()
  effectivePercent = Math.round(scale * 100)
  const scaledW = Math.max(1, Math.round(deck.width * scale))
  const scaledH = Math.max(1, Math.round(deck.height * scale))
  ui.slideFrame.style.width = `${scaledW}px`
  ui.slideFrame.style.height = `${scaledH}px`
  const canvas = ui.slideFrame.firstElementChild
  if (canvas) {
    canvas.style.transform = `scale(${scale})`
  }
  updateZoomUi()
}

function renderActiveSlide() {
  if (!deck) return
  const slide = deck.slides[activeSlide - 1]
  if (!slide) return
  const canvas = renderSlideCanvas(slide, deck, labels)
  ui.slideFrame.replaceChildren(canvas)
  ui.slideFrame.setAttribute('aria-label', slideLabel())
  applyStageScale()
  showStatus('')
}

function renderThumbnails() {
  if (!deck) return
  const scale = THUMB_WIDTH / deck.width
  const thumbH = Math.max(1, Math.round(deck.height * scale))
  const frag = document.createDocumentFragment()

  for (const slide of deck.slides) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'slide-thumb'
    btn.dataset.slide = String(slide.index)
    btn.setAttribute('aria-label', `${labels.slide} ${slide.index}`)
    btn.setAttribute('aria-current', String(slide.index === activeSlide))

    const frame = document.createElement('div')
    frame.className = 'thumb-frame'
    frame.style.width = `${THUMB_WIDTH}px`
    frame.style.height = `${thumbH}px`

    const mini = renderSlideCanvas(slide, deck, labels)
    mini.style.transform = `scale(${scale})`
    frame.appendChild(mini)

    const idx = document.createElement('span')
    idx.className = 'thumb-index'
    idx.textContent = String(slide.index)

    btn.append(frame, idx)
    frag.appendChild(btn)
  }

  ui.thumbs.replaceChildren(frag)
}

function go(target) {
  if (!deck || !Number.isInteger(target) || target < 1 || target > deck.slides.length || target === activeSlide) {
    ui.pageInput.value = String(activeSlide)
    return
  }
  activeSlide = target
  ui.stage.scrollTo(0, 0)
  renderActiveSlide()
  updateControls()
}

function setZoom(nextMode) {
  if (!deck || !nextMode || nextMode === zoomMode) return
  zoomMode = nextMode
  applyStageScale()
}

function stepZoom(direction) {
  if (!deck) return
  const target = nextZoomStep(direction)
  if (target) setZoom(target)
}

function toggleThumbs() {
  if (!deck) return
  thumbsUserPinned = true
  thumbsOpen = !thumbsOpen
  updateThumbsUi()
  if (zoomMode === 'fit') applyStageScale()
}

function toggleNotes() {
  if (!deck) return
  notesOpen = !notesOpen
  updateNotesUi()
  if (zoomMode === 'fit') requestAnimationFrame(applyStageScale)
}

ui.thumbsBtn.onclick = toggleThumbs
ui.notesBtn.onclick = toggleNotes
ui.notesCloseBtn.onclick = () => {
  notesOpen = false
  updateNotesUi()
  if (zoomMode === 'fit') requestAnimationFrame(applyStageScale)
}

ui.thumbs.onclick = event => {
  const thumb = event.target.closest('.slide-thumb')
  if (!thumb) return
  go(Number(thumb.dataset.slide))
  if (window.innerWidth < 620) {
    thumbsOpen = false
    updateThumbsUi()
  }
}

ui.prevBtn.onclick = () => go(activeSlide - 1)
ui.nextBtn.onclick = () => go(activeSlide + 1)
ui.pageInput.onfocus = () => ui.pageInput.select()
ui.pageInput.onchange = () => go(Number(ui.pageInput.value))
ui.pageInput.onkeydown = event => {
  if (event.key === 'Enter') { go(Number(ui.pageInput.value)); ui.pageInput.select() }
  if (event.key === 'Escape') { ui.pageInput.value = String(activeSlide); ui.stage.focus() }
}

ui.zoomOutBtn.onclick = () => stepZoom(-1)
ui.zoomInBtn.onclick = () => stepZoom(1)

ui.zoomTriggerBtn.onclick = () => {
  if (ui.zoomMenu.hidden) openZoomMenu('selected')
  else closeZoomMenu()
}

ui.zoomTriggerBtn.onkeydown = event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    openZoomMenu('selected')
  }
}

ui.zoomMenu.onclick = event => {
  const opt = event.target.closest('.zoom-option')
  if (!opt) return
  setZoom(opt.dataset.value)
  closeZoomMenu({ restoreFocus: true })
}

ui.zoomMenu.onkeydown = event => {
  const index = ui.zoomOptions.indexOf(document.activeElement)
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeZoomMenu({ restoreFocus: true })
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    ui.zoomOptions[(index + 1 + ui.zoomOptions.length) % ui.zoomOptions.length]?.focus({ preventScroll: true })
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    ui.zoomOptions[(index - 1 + ui.zoomOptions.length) % ui.zoomOptions.length]?.focus({ preventScroll: true })
  } else if (event.key === 'Home') {
    event.preventDefault()
    ui.zoomOptions[0]?.focus({ preventScroll: true })
  } else if (event.key === 'End') {
    event.preventDefault()
    ui.zoomOptions[ui.zoomOptions.length - 1]?.focus({ preventScroll: true })
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const opt = ui.zoomOptions[index]
    if (opt) setZoom(opt.dataset.value)
    closeZoomMenu({ restoreFocus: true })
  } else if (event.key === 'Tab') {
    closeZoomMenu()
  }
}

document.addEventListener('pointerdown', event => {
  if (!ui.zoomMenu.hidden && !ui.zoomControl.contains(event.target)) closeZoomMenu()
})
window.addEventListener('blur', () => closeZoomMenu())

window.addEventListener('keydown', event => {
  if (!deck) return
  if (event.metaKey || event.ctrlKey) {
    if (event.altKey) return
    if (event.key === '=' || event.key === '+') {
      event.preventDefault()
      stepZoom(1)
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      stepZoom(-1)
    } else if (event.key === '0') {
      event.preventDefault()
      setZoom('fit')
    }
    return
  }

  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (event.altKey) return

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    go(activeSlide - 1)
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault()
    go(activeSlide + 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    go(1)
  } else if (event.key === 'End') {
    event.preventDefault()
    go(deck.slides.length)
  } else if (event.key === '=' || event.key === '+') {
    event.preventDefault()
    stepZoom(1)
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    stepZoom(-1)
  } else if (event.key === '0') {
    event.preventDefault()
    setZoom('fit')
  }
})

const observer = new ResizeObserver(() => {
  if (!thumbsUserPinned) {
    const shouldShow = window.innerWidth >= 620
    if (thumbsOpen !== shouldShow) {
      thumbsOpen = shouldShow
      updateThumbsUi()
    }
  }
  clearTimeout(resizeTimer)
  if (deck && zoomMode === 'fit') {
    resizeTimer = setTimeout(applyStageScale, 40)
  }
})
observer.observe(ui.stage)

localize()
updateControls()
showStatus('opening')
plugin.onTheme(updated => {
  labels = readerLabels(updated.locale)
  localize()
  if (deck) {
    renderActiveSlide()
    renderThumbnails()
    updateControls()
  }
})
plugin.ready()

async function readAllBytes(size) {
  const buffer = new Uint8Array(size)
  let offset = 0
  let lastRead = -Infinity
  while (offset < size) {
    if (closed) throw new Error('closed')
    const len = Math.min(READ_CHUNK, size - offset)
    const elapsed = performance.now() - lastRead
    if (elapsed < 18) await new Promise(r => setTimeout(r, 18 - elapsed))
    lastRead = performance.now()
    const chunk = await plugin.readActiveBytes(offset, len)
    if (!(chunk instanceof ArrayBuffer) || chunk.byteLength !== len) {
      throw new Error('Incomplete readActiveBytes chunk')
    }
    buffer.set(new Uint8Array(chunk), offset)
    offset += len
  }
  return buffer
}

async function openDeck(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size < 0 || !file.version) {
    showStatus('openFailed')
    return
  }
  if (file.size === 0) {
    showStatus('noSlides')
    return
  }
  if (file.size > MAX_BYTES) {
    showStatus('tooLargeBytes')
    return
  }
  try {
    const bytes = await readAllBytes(file.size)
    if (closed) return
    const parsed = await parsePptx(bytes)
    if (closed) return
    if (!parsed.slides || parsed.slides.length === 0) {
      showStatus('noSlides')
      return
    }
    deck = parsed
    activeSlide = 1
    renderThumbnails()
    renderActiveSlide()
    updateControls()
  } catch {
    if (!closed) showStatus('openFailed')
  }
}

void openDeck(context.activeFile)
