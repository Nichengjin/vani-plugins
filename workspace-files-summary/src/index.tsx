import type { PluginBridgeApi } from '@vani/extension-contracts'

const plugin = (window as Window & { vaniPlugin: PluginBridgeApi }).vaniPlugin

void plugin.init.then(async () => {
  const entries = await plugin.request({ method: 'workspace.files.read' })
  document.body.style.cssText = 'padding: 12px; margin: 0; background: var(--background); color: var(--foreground); font: 13px var(--font-ui);'
  const groups = new Map<string, Array<{ name: string; path: string }>>()
  for (const entry of entries) {
    if (entry.kind !== 'file') continue
    const dot = entry.name.lastIndexOf('.')
    const extension = dot > 0 ? entry.name.slice(dot).toLowerCase() : 'No extension'
    const group = groups.get(extension) ?? []
    group.push(entry)
    groups.set(extension, group)
  }
  for (const [extension, files] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const group = document.createElement('details')
    group.open = true
    const summary = document.createElement('summary')
    summary.textContent = `${extension} · ${files.length}`
    group.append(summary)
    const list = document.createElement('ul')
    for (const { name, path } of files) {
      const row = document.createElement('li')
      const link = document.createElement('a')
      link.href = '#'
      link.textContent = name
      link.style.color = 'var(--foreground)'
      link.onclick = event => {
        event.preventDefault()
        plugin.navigate({ kind: 'file', path })
      }
      row.append(link)
      list.append(row)
    }
    group.append(list)
    document.body.append(group)
  }
  plugin.ready()
})
