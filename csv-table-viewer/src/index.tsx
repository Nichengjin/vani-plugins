import type { PluginBridgeApi, PluginContext } from '@vani/extension-contracts'
import './table.css'

const plugin = (window as Window & { vaniPlugin: PluginBridgeApi }).vaniPlugin

function parseCsv(text: string): string[][] {
  if (!text) return []
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
      } else quoted = !quoted
    } else if (!quoted && char === ',') {
      row.push(cell)
      cell = ''
    } else if (!quoted && (char === '\r' || char === '\n')) {
      if (char === '\r' && text[i + 1] === '\n') i++
      rows.push([...row, cell])
      row = []
      cell = ''
    } else cell += char
  }
  if (row.length || cell || text.endsWith(',')) rows.push([...row, cell])
  return rows
}

function render(content: string): void {
  const [headers = [], ...rows] = parseCsv(content)
  const filter = document.createElement('input')
  filter.type = 'search'
  filter.placeholder = 'Filter rows'
  filter.setAttribute('aria-label', filter.placeholder)
  const table = document.createElement('table')
  const head = table.createTHead().insertRow()
  const body = table.createTBody()
  let column = -1
  let direction = 1
  function update(): void {
    const query = filter.value.toLocaleLowerCase()
    const matches = query ? rows.filter(row => row.some(cell => cell.toLocaleLowerCase().includes(query))) : [...rows]
    if (column >= 0) matches.sort((a, b) => direction * (a[column] ?? '').localeCompare(b[column] ?? '', undefined, { numeric: true }))
    body.replaceChildren()
    for (const row of matches.slice(0, 250)) {
      const line = body.insertRow()
      for (let i = 0; i < headers.length; i++) line.insertCell().textContent = row[i] ?? ''
    }
  }
  for (const [index, title] of headers.entries()) {
    const th = document.createElement('th')
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = title
    button.onclick = () => {
      direction = column === index ? -direction : 1
      column = index
      for (const header of head.cells) header.removeAttribute('aria-sort')
      th.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending')
      update()
    }
    th.append(button)
    head.append(th)
  }
  filter.oninput = update
  document.body.replaceChildren(filter, table)
  update()
}

function update(context: PluginContext): void {
  render(context.activeFile?.text ?? '')
}

void plugin.init.then(async ({ context }) => {
  plugin.onContext(update)
  update(await plugin.request({ method: 'file.active.read' }).then(activeFile => ({ activeFile }), () => context))
  plugin.ready()
})
