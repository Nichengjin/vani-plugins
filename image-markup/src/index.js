import './style.css'

const api = window.vaniPlugin
const { context, theme } = await api.init
const zh = theme.locale.startsWith('zh')
const label = (en, cn) => zh ? cn : en
const file = context.activeFile
document.body.innerHTML = `<header><div class="tools" role="group" aria-label="${label('Markup tools', '标注工具')}">
  <button data-tool="pen" aria-pressed="true">${label('Pen', '画笔')}</button><button data-tool="arrow" aria-pressed="false">${label('Arrow', '箭头')}</button><button data-tool="box" aria-pressed="false">${label('Box', '方框')}</button></div>
  <label class="color" title="${label('Ink color', '标注颜色')}"><input type="color" value="#e75336" aria-label="${label('Ink color', '标注颜色')}"></label>
  <button id="undo" disabled>${label('Undo', '撤销')}</button><button id="redo" disabled>${label('Redo', '重做')}</button>
  <div class="zoom"><button id="out" aria-label="${label('Zoom out', '缩小')}">−</button><button id="fit" title="${label('Fit image to window', '适应窗口')}">${label('Fit', '适应')}</button><button id="in" aria-label="${label('Zoom in', '放大')}">+</button></div></header>
  <main><div class="stage"><canvas hidden tabindex="0" aria-label="${label('Image canvas. Use arrows to move, Space to draw, Enter to finish.', '图像画布。方向键移动，空格开始绘制，回车完成。')}"></canvas></div></main>
  <footer><span id="filename"></span><span id="dimensions"></span></footer><p role="status">${label('Opening image…', '正在打开图片…')}</p>`
const $ = selector => document.querySelector(selector)
const canvas = $('canvas'), ctx = canvas.getContext('2d'), main = $('main')
const status = $('[role=status]')
const marks = [], removed = []
let bitmap, tool = 'pen', scale = 1, fit = true, active, pointer, cursor
$('#filename').textContent = file?.path.split(/[\\/]/).pop() ?? ''
api.ready()

function line(mark) {
  const a = mark.points[0], b = mark.points.at(-1)
  ctx.lineWidth = mark.width; ctx.lineCap = ctx.lineJoin = 'round'
  ctx.strokeStyle = ctx.fillStyle = mark.color
  ctx.beginPath()
  if (a.x === b.x && a.y === b.y && mark.points.length <= 2) {
    ctx.arc(a.x, a.y, mark.width / 2, 0, Math.PI * 2); ctx.fill(); return
  }
  if (mark.tool === 'box') ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y)
  else if (mark.tool === 'arrow') {
    const angle = Math.atan2(b.y - a.y, b.x - a.x), head = Math.min(mark.width * 4, Math.hypot(b.x - a.x, b.y - a.y) / 2)
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
    for (const delta of [-0.52, 0.52]) { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(angle + delta), b.y - head * Math.sin(angle + delta)) }
  } else { ctx.moveTo(a.x, a.y); for (const p of mark.points.slice(1)) ctx.lineTo(p.x, p.y) }
  ctx.stroke()
}
function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0)
  marks.forEach(line); if (active) line(active)
  $('#undo').disabled = !marks.length; $('#redo').disabled = !removed.length
}
function layout() {
  if (!bitmap) return
  if (fit) scale = Math.min(1, Math.max(1, main.clientWidth - 32) / bitmap.width, Math.max(1, main.clientHeight - 32) / bitmap.height)
  canvas.style.width = `${bitmap.width * scale}px`; canvas.style.height = `${bitmap.height * scale}px`
  $('#fit').textContent = `${Math.round(scale * 100)}%`; $('#fit').ariaLabel = label('Fit to window', '适应窗口')
}
function zoom(factor) { if (bitmap) { fit = false; scale = Math.max(.05, Math.min(8, scale * factor)); layout() } }
$('#fit').onclick = () => { fit = true; layout() }
$('#out').onclick = () => zoom(1 / 1.25); $('#in').onclick = () => zoom(1.25)
new ResizeObserver(layout).observe(main)
document.querySelectorAll('[data-tool]').forEach(button => { button.onclick = () => {
  tool = button.dataset.tool; document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button)))
} })
function undo() { if (marks.length && !active) { removed.push(marks.pop()); paint() } }
function redo() { if (removed.length && !active) { marks.push(removed.pop()); paint() } }
$('#undo').onclick = undo; $('#redo').onclick = redo
function start(p) { active = { tool, color: $('input').value, width: Math.max(2, 3 / scale), points: [p] }; paint() }
function move(p) { if (active.tool === 'pen') active.points.push(p); else active.points[1] = p; paint() }
function finish() { if (active) { marks.push(active); removed.length = 0; active = undefined; paint() } }
function point(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale } }
canvas.onpointerdown = e => { if (e.button || active) return; cursor = undefined; canvas.focus(); pointer = e.pointerId; canvas.setPointerCapture(pointer); start(point(e)) }
canvas.onpointermove = e => { if (active && e.pointerId === pointer) move(point(e)) }
canvas.onpointerup = e => { if (active && e.pointerId === pointer) { move(point(e)); pointer = undefined; finish() } }
canvas.onpointercancel = () => { pointer = active = undefined; paint() }
document.onkeydown = e => {
  if (!bitmap) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
  if (e.target !== canvas || pointer !== undefined) return
  cursor ??= { x: canvas.width / 2, y: canvas.height / 2 }
  const step = e.shiftKey ? 10 : 1
  if (e.key.startsWith('Arrow')) {
    e.preventDefault(); const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    cursor = { x: Math.max(0, Math.min(canvas.width - 1, cursor.x + d[0])), y: Math.max(0, Math.min(canvas.height - 1, cursor.y + d[1])) }
    if (active) move(cursor)
    $('#dimensions').textContent = `${Math.round(cursor.x)}, ${Math.round(cursor.y)} px`
  } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); active ? finish() : start(cursor) }
  else if (e.key === 'Escape') { active = undefined; paint() }
}
async function openImage() {
  if (!file?.version || !file.size) throw new Error()
  if (file.size > 32 * 1024 * 1024) { status.textContent = label('This image exceeds 32 MiB.', '图片超过了 32 MiB。'); return }
  const parts = []
  for (let offset = 0; offset < file.size; offset += 524288) parts.push(await api.readActiveBytes(offset, Math.min(524288, file.size - offset)))
  bitmap = await createImageBitmap(new Blob(parts)); parts.length = 0
  if (bitmap.width * bitmap.height > 32_000_000 || Math.max(bitmap.width, bitmap.height) > 16384) {
    bitmap.close(); bitmap = undefined; status.textContent = label('This image is too large to annotate.', '这张图片太大，无法标注。'); return
  }
  canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.hidden = false
  $('#dimensions').textContent = `${bitmap.width} × ${bitmap.height}`; layout(); paint(); status.hidden = true
  api.onExport(() => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error()), 'image/png')))
}
void openImage().catch(() => { status.textContent = label('Could not open this image.', '无法打开这张图片。') })
