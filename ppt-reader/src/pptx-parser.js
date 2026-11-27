import JSZip from '../vendor/jszip.mjs'

const EMU_PER_PX = 9525
const PT_TO_PX = 96 / 72

const DEFAULT_CLR_MAP = {
  bg1: 'lt1',
  tx1: 'dk1',
  bg2: 'lt2',
  tx2: 'dk2',
  accent1: 'accent1',
  accent2: 'accent2',
  accent3: 'accent3',
  accent4: 'accent4',
  accent5: 'accent5',
  accent6: 'accent6',
  hlink: 'hlink',
  folHlink: 'folHlink'
}

const PRESET_COLORS = {
  aliceBlue: 'F0F8FF', antiqueWhite: 'FAEBD7', aqua: '00FFFF', aquamarine: '7FFFD4',
  azure: 'F0FFFF', beige: 'F5F5DC', bisque: 'FFE4C4', black: '000000',
  blanchedAlmond: 'FFEBCD', blue: '0000FF', blueViolet: '8A2BE2', brown: 'A52A2A',
  burlyWood: 'DEB887', cadetBlue: '5F9EA0', chartreuse: '7FFF00', chocolate: 'D2691E',
  coral: 'FF7F50', cornflowerBlue: '6495ED', cornsilk: 'FFF8DC', crimson: 'DC143C',
  cyan: '00FFFF', darkBlue: '00008B', darkCyan: '008B8B', darkGoldenrod: 'B8860B',
  darkGray: 'A9A9A9', darkGreen: '006400', darkKhaki: 'BDB76B', darkMagenta: '8B008B',
  darkOliveGreen: '556B2F', darkOrange: 'FF8C00', darkOrchid: '9932CC', darkRed: '8B0000',
  darkSalmon: 'E9967A', darkSeaGreen: '8FBC8B', darkSlateBlue: '483D8B', darkSlateGray: '2F4F4F',
  darkTurquoise: '00CED1', darkViolet: '9400D3', deepPink: 'FF1493', deepSkyBlue: '00BFFF',
  dimGray: '696969', dkBlue: '00008B', dkCyan: '008B8B', dkGoldenrod: 'B8860B',
  dkGray: 'A9A9A9', dkGreen: '006400', dkKhaki: 'BDB76B', dkMagenta: '8B008B',
  dkOliveGreen: '556B2F', dkOrange: 'FF8C00', dkOrchid: '9932CC', dkRed: '8B0000',
  dkSalmon: 'E9967A', dkSeaGreen: '8FBC8B', dkSlateBlue: '483D8B', dkSlateGray: '2F4F4F',
  dkTurquoise: '00CED1', dkViolet: '9400D3', dodgerBlue: '1E90FF', firebrick: 'B22222',
  floralWhite: 'FFFAF0', forestGreen: '228B22', fuchsia: 'FF00FF', gainsboro: 'DCDCDC',
  ghostWhite: 'F8F8FF', gold: 'FFD700', goldenrod: 'DAA520', gray: '808080',
  green: '008000', greenYellow: 'ADFF2F', honeydew: 'F0FFF0', hotPink: 'FF69B4',
  indianRed: 'CD5C5C', indigo: '4B0082', ivory: 'FFFFF0', khaki: 'F0E68C',
  lavender: 'E6E6FA', lavenderBlush: 'FFF0F5', lawnGreen: '7CFC00', lemonChiffon: 'FFFACD',
  lightBlue: 'ADD8E6', lightCoral: 'F08080', lightCyan: 'E0FFFF', lightGoldenrodYellow: 'FAFAD2',
  lightGray: 'D3D3D3', lightGreen: '90EE90', lightPink: 'FFB6C1', lightSalmon: 'FFA07A',
  lightSeaGreen: '20B2AA', lightSkyBlue: '87CEFA', lightSlateGray: '778899', lightSteelBlue: 'B0C4DE',
  lightYellow: 'FFFFE0', lime: '00FF00', limeGreen: '32CD32', linen: 'FAF0E6',
  ltBlue: 'ADD8E6', ltCoral: 'F08080', ltCyan: 'E0FFFF', ltGoldenrodYellow: 'FAFAD2',
  ltGray: 'D3D3D3', ltGreen: '90EE90', ltPink: 'FFB6C1', ltSalmon: 'FFA07A',
  ltSeaGreen: '20B2AA', ltSkyBlue: '87CEFA', ltSlateGray: '778899', ltSteelBlue: 'B0C4DE',
  ltYellow: 'FFFFE0', magenta: 'FF00FF', maroon: '800000', medAquamarine: '66CDAA',
  medBlue: '0000CD', medOrchid: 'BA55D3', medPurple: '9370DB', medSeaGreen: '3CB371',
  medSlateBlue: '7B68EE', medSpringGreen: '00FA9A', medTurquoise: '48D1CC', medVioletRed: 'C71585',
  midnightBlue: '191970', mintCream: 'F5FFFA', mistyRose: 'FFE4E1', moccasin: 'FFE4B5',
  navajoWhite: 'FFDEAD', navy: '000080', oldLace: 'FDF5E6', olive: '808000',
  oliveDrab: '6B8E23', orange: 'FFA500', orangeRed: 'FF4500', orchid: 'DA70D6',
  paleGoldenrod: 'EEE8AA', paleGreen: '98FB98', paleTurquoise: 'AFEEEE', paleVioletRed: 'DB7093',
  papayaWhip: 'FFEFD5', peachPuff: 'FFDAB9', peru: 'CD853F', pink: 'FFC0CB',
  plum: 'DDA0DD', powderBlue: 'B0E0E6', purple: '800080', red: 'FF0000',
  rosyBrown: 'BC8F8F', royalBlue: '4169E1', saddleBrown: '8B4513', salmon: 'FA8072',
  sandyBrown: 'F4A460', seaGreen: '2E8B57', seaShell: 'FFF5EE', sienna: 'A0522D',
  silver: 'C0C0C0', skyBlue: '87CEEB', slateBlue: '6A5ACD', slateGray: '708090',
  snow: 'FFFAFA', springGreen: '00FF7F', steelBlue: '4682B4', tan: 'D2B48C',
  teal: '008080', thistle: 'D8BFD8', tomato: 'FF6347', turquoise: '40E0D0',
  violet: 'EE82EE', wheat: 'F5DEB3', white: 'FFFFFF', whiteSmoke: 'F5F5F5',
  yellow: 'FFFF00', yellowGreen: '9ACD32'
}

const IMAGE_MIMES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff'
}

const WINGDINGS_MAP = {
  '\uf0a7': '▪',
  '\uf0a8': '▫',
  '\uf0b7': '•',
  '\uf0d8': '➢',
  '\uf0fc': '✓',
  '\uf076': '❖',
  '\uf071': '❑',
  '\uf06e': '■',
  '\uf06f': '□',
  '\uf0e0': '➜',
  '\uf0de': '➤',
  '\u2022': '•'
}

function defaultParseXml(xmlText) {
  const Parser = globalThis.DOMParser
  if (!Parser) throw new Error('DOMParser is unavailable')
  const doc = new Parser().parseFromString(xmlText, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML')
  }
  return doc
}

function localName(node) {
  if (!node) return ''
  return node.localName || String(node.nodeName || '').split(':').pop() || ''
}

function elementChildren(node) {
  if (!node || !node.childNodes) return []
  const list = []
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]
    if (child.nodeType === 1) list.push(child)
  }
  return list
}

function childrenByLocal(node, name) {
  const out = []
  for (const child of elementChildren(node)) {
    if (localName(child) === name) out.push(child)
  }
  return out
}

function firstChildByLocal(node, name) {
  for (const child of elementChildren(node)) {
    if (localName(child) === name) return child
  }
  return null
}

function attr(node, name) {
  if (!node || !node.attributes) return null
  const direct = node.getAttribute?.(name)
  if (direct !== null && direct !== undefined) return direct
  for (let i = 0; i < node.attributes.length; i++) {
    const a = node.attributes[i]
    const ln = a.localName || String(a.name || '').split(':').pop()
    if (ln === name) return a.value
  }
  return null
}

function numAttr(node, name) {
  const raw = attr(node, name)
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function emuToPx(emu) {
  return Number.isFinite(emu) ? emu / EMU_PER_PX : 0
}

function normalizePath(path) {
  const parts = String(path || '').replace(/\\/g, '/').split('/')
  const stack = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

function resolveTarget(basePartPath, target) {
  if (!target) return null
  if (target.startsWith('/')) return normalizePath(target.slice(1))
  const slash = basePartPath.lastIndexOf('/')
  const dir = slash === -1 ? '' : basePartPath.slice(0, slash + 1)
  return normalizePath(dir + target)
}

function relsPathFor(partPath) {
  const slash = partPath.lastIndexOf('/')
  if (slash === -1) return `_rels/${partPath}.rels`
  return `${partPath.slice(0, slash + 1)}_rels/${partPath.slice(slash + 1)}.rels`
}

function findZipFile(zip, path) {
  if (!path) return null
  const norm = normalizePath(path)
  const direct = zip.file(norm)
  if (direct) return direct
  const lower = norm.toLowerCase()
  for (const key of Object.keys(zip.files)) {
    if (!zip.files[key].dir && key.toLowerCase() === lower) {
      return zip.files[key]
    }
  }
  return null
}

async function readXml(zip, path, parseXml) {
  const entry = findZipFile(zip, path)
  if (!entry) return null
  const text = await entry.async('string')
  return parseXml(text)
}

async function readRels(zip, partPath, parseXml) {
  const doc = await readXml(zip, relsPathFor(partPath), parseXml)
  const map = new Map()
  if (!doc) return map
  for (const rel of childrenByLocal(doc.documentElement, 'Relationship')) {
    const id = attr(rel, 'Id')
    const type = attr(rel, 'Type') || ''
    const target = attr(rel, 'Target') || ''
    const mode = attr(rel, 'TargetMode') || ''
    if (!id || !target || mode === 'External') continue
    map.set(id, { id, type, target: resolveTarget(partPath, target) })
  }
  return map
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n))
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ]
}

function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [h / 6, s, l]
}

function hueToRgb(p, q, t) {
  let tn = t
  if (tn < 0) tn += 1
  if (tn > 1) tn -= 1
  if (tn < 1 / 6) return p + (q - p) * 6 * tn
  if (tn < 1 / 2) return q
  if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
  return p
}

function hslToRgb(h, s, l) {
  const hn = ((h % 1) + 1) % 1
  const sn = clamp01(s)
  const ln = clamp01(l)
  if (sn === 0) {
    const v = clampByte(ln * 255)
    return [v, v, v]
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  return [
    clampByte(hueToRgb(p, q, hn + 1 / 3) * 255),
    clampByte(hueToRgb(p, q, hn) * 255),
    clampByte(hueToRgb(p, q, hn - 1 / 3) * 255)
  ]
}

function rgbToCss([r, g, b], alpha = 1) {
  if (alpha < 0.999) {
    return `rgba(${clampByte(r)}, ${clampByte(g)}, ${clampByte(b)}, ${Number(clamp01(alpha).toFixed(3))})`
  }
  const toHex = n => clampByte(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function applyColorTransforms(baseRgb, colorNode) {
  let [r, g, b] = baseRgb
  let alpha = 1
  const children = elementChildren(colorNode)
  for (const mod of children) {
    const name = localName(mod)
    const val = numAttr(mod, 'val')
    if (name === 'alpha' && val !== null) {
      alpha = clamp01(val / 100000)
    } else if (name === 'alphaMod' && val !== null) {
      alpha = clamp01(alpha * (val / 100000))
    } else if (name === 'alphaOff' && val !== null) {
      alpha = clamp01(alpha + val / 100000)
    } else if (name === 'tint' && val !== null) {
      const t = clamp01(val / 100000)
      r = clampByte(r * t + 255 * (1 - t))
      g = clampByte(g * t + 255 * (1 - t))
      b = clampByte(b * t + 255 * (1 - t))
    } else if (name === 'shade' && val !== null) {
      const s = clamp01(val / 100000)
      r = clampByte(r * s)
      g = clampByte(g * s)
      b = clampByte(b * s)
    } else if (name === 'lumMod' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h, s, clamp01(l * (val / 100000)))
    } else if (name === 'lumOff' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h, s, clamp01(l + val / 100000))
    } else if (name === 'satMod' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h, clamp01(s * (val / 100000)), l)
    } else if (name === 'satOff' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h, clamp01(s + val / 100000), l)
    } else if (name === 'hueMod' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h * (val / 100000), s, l)
    } else if (name === 'hueOff' && val !== null) {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h + val / 21600000, s, l)
    } else if (name === 'inv') {
      r = 255 - r
      g = 255 - g
      b = 255 - b
    } else if (name === 'comp') {
      const [h, s, l] = rgbToHsl(r, g, b)
      ;[r, g, b] = hslToRgb(h + 0.5, s, l)
    } else if (name === 'gray') {
      const y = clampByte(0.2126 * r + 0.7152 * g + 0.0722 * b)
      r = g = b = y
    }
  }
  return { rgb: [r, g, b], alpha, css: rgbToCss([r, g, b], alpha) }
}

function resolveColorNode(colorNode, ctx, phColor = null) {
  if (!colorNode) return null
  const name = localName(colorNode)
  let baseRgb = null
  let baseAlpha = 1

  if (name === 'srgbClr') {
    baseRgb = hexToRgb(attr(colorNode, 'val'))
  } else if (name === 'schemeClr') {
    const key = attr(colorNode, 'val')
    if (key === 'phClr' && phColor) {
      baseRgb = phColor.rgb
      baseAlpha = phColor.alpha ?? 1
    } else {
      const mapped = ctx.clrMap[key] || key
      const hex = ctx.theme.colors[mapped] || ctx.theme.colors[key]
      baseRgb = hexToRgb(hex)
    }
  } else if (name === 'prstClr') {
    const val = attr(colorNode, 'val')
    baseRgb = hexToRgb(PRESET_COLORS[val])
  } else if (name === 'sysClr') {
    const lastClr = attr(colorNode, 'lastClr')
    const val = attr(colorNode, 'val')
    baseRgb = hexToRgb(lastClr || (val === 'windowText' ? '000000' : val === 'window' ? 'FFFFFF' : '000000'))
  } else if (name === 'scrgbClr') {
    const r = numAttr(colorNode, 'r') ?? 0
    const g = numAttr(colorNode, 'g') ?? 0
    const b = numAttr(colorNode, 'b') ?? 0
    baseRgb = [clampByte((r / 100000) * 255), clampByte((g / 100000) * 255), clampByte((b / 100000) * 255)]
  } else if (name === 'hslClr') {
    const h = (numAttr(colorNode, 'hue') ?? 0) / 21600000
    const s = (numAttr(colorNode, 'sat') ?? 0) / 100000
    const l = (numAttr(colorNode, 'lum') ?? 0) / 100000
    baseRgb = hslToRgb(h, s, l)
  }

  if (!baseRgb) return null
  const transformed = applyColorTransforms(baseRgb, colorNode)
  const finalAlpha = clamp01(transformed.alpha * baseAlpha)
  return {
    rgb: transformed.rgb,
    alpha: finalAlpha,
    css: rgbToCss(transformed.rgb, finalAlpha)
  }
}

function findColorChild(parent, ctx, phColor = null) {
  if (!parent) return null
  for (const child of elementChildren(parent)) {
    const resolved = resolveColorNode(child, ctx, phColor)
    if (resolved) return resolved
  }
  return null
}

function parseTheme(themeDoc) {
  const theme = {
    colors: {
      dk1: '000000',
      lt1: 'FFFFFF',
      dk2: '1F497D',
      lt2: 'EEECE1',
      accent1: '4F81BD',
      accent2: 'C0504D',
      accent3: '9BBB59',
      accent4: '8064A2',
      accent5: '4BACC6',
      accent6: 'F79646',
      hlink: '0000FF',
      folHlink: '800080'
    },
    fonts: {
      major: 'Calibri, Arial, sans-serif',
      minor: 'Calibri, Arial, sans-serif'
    },
    fillStyles: [],
    bgFillStyles: [],
    lnStyles: []
  }
  if (!themeDoc?.documentElement) return theme

  const themeElements = firstChildByLocal(themeDoc.documentElement, 'themeElements')
  if (!themeElements) return theme

  const clrScheme = firstChildByLocal(themeElements, 'clrScheme')
  if (clrScheme) {
    for (const entry of elementChildren(clrScheme)) {
      const key = localName(entry)
      const srgb = firstChildByLocal(entry, 'srgbClr')
      const sys = firstChildByLocal(entry, 'sysClr')
      const hex = attr(srgb, 'val') || attr(sys, 'lastClr')
      if (hex && /^[0-9a-fA-F]{6}$/.test(hex)) {
        theme.colors[key] = hex
      }
    }
  }

  const fontScheme = firstChildByLocal(themeElements, 'fontScheme')
  if (fontScheme) {
    const extractFont = group => {
      if (!group) return null
      const latin = attr(firstChildByLocal(group, 'latin'), 'typeface')
      const ea = attr(firstChildByLocal(group, 'ea'), 'typeface')
      const names = [latin, ea].filter(v => v && !v.startsWith('+'))
      return names.length ? names.join(', ') : null
    }
    const major = extractFont(firstChildByLocal(fontScheme, 'majorFont'))
    const minor = extractFont(firstChildByLocal(fontScheme, 'minorFont'))
    if (major) theme.fonts.major = `${major}, system-ui, sans-serif`
    if (minor) theme.fonts.minor = `${minor}, system-ui, sans-serif`
  }

  const fmtScheme = firstChildByLocal(themeElements, 'fmtScheme')
  if (fmtScheme) {
    const fillStyleLst = firstChildByLocal(fmtScheme, 'fillStyleLst')
    if (fillStyleLst) theme.fillStyles = elementChildren(fillStyleLst)
    const bgFillStyleLst = firstChildByLocal(fmtScheme, 'bgFillStyleLst')
    if (bgFillStyleLst) theme.bgFillStyles = elementChildren(bgFillStyleLst)
    const lnStyleLst = firstChildByLocal(fmtScheme, 'lnStyleLst')
    if (lnStyleLst) theme.lnStyles = elementChildren(lnStyleLst)
  }

  return theme
}

function parseClrMap(node, fallback = DEFAULT_CLR_MAP) {
  if (!node) return { ...fallback }
  const map = { ...fallback }
  for (const key of Object.keys(DEFAULT_CLR_MAP)) {
    const val = attr(node, key)
    if (val) map[key] = val
  }
  return map
}

function resolveFontFamily(typeface, ctx) {
  if (!typeface) return null
  if (typeface === '+mj-lt' || typeface === '+mj-ea' || typeface === '+mj-cs') {
    return ctx.theme.fonts.major
  }
  if (typeface === '+mn-lt' || typeface === '+mn-ea' || typeface === '+mn-cs') {
    return ctx.theme.fonts.minor
  }
  return typeface
}

function parseFillElement(fillNode, ctx, rels, phColor = null) {
  if (!fillNode) return null
  const name = localName(fillNode)
  if (name === 'noFill') return { type: 'none' }

  if (name === 'solidFill') {
    const color = findColorChild(fillNode, ctx, phColor)
    return color ? { type: 'solid', color: color.css, alpha: color.alpha } : null
  }

  if (name === 'gradFill') {
    const gsLst = firstChildByLocal(fillNode, 'gsLst')
    const stops = []
    if (gsLst) {
      for (const gs of childrenByLocal(gsLst, 'gs')) {
        const pos = numAttr(gs, 'pos') ?? 0
        const color = findColorChild(gs, ctx, phColor)
        if (color) stops.push({ pos: clamp01(pos / 100000) * 100, color: color.css })
      }
    }
    if (stops.length === 0) return null
    stops.sort((a, b) => a.pos - b.pos)
    const stopCss = stops.map(s => `${s.color} ${s.pos.toFixed(1)}%`).join(', ')
    const pathEl = firstChildByLocal(fillNode, 'path')
    if (pathEl) {
      return { type: 'gradient', css: `radial-gradient(circle, ${stopCss})` }
    }
    const lin = firstChildByLocal(fillNode, 'lin')
    const ang = numAttr(lin, 'ang') ?? 0
    // OOXML lin/@ang 0 means left-to-right (CSS 90deg); angle increases clockwise.
    const cssDeg = ((ang / 60000) + 90) % 360
    return { type: 'gradient', css: `linear-gradient(${cssDeg.toFixed(1)}deg, ${stopCss})` }
  }

  if (name === 'blipFill') {
    const blip = firstChildByLocal(fillNode, 'blip')
    const embedId = findBlipEmbedId(blip)
    if (embedId && rels) {
      const target = rels.get(embedId)?.target
      if (target) return { type: 'image', target }
    }
  }

  return null
}

function findBlipEmbedId(blip) {
  if (!blip) return null
  const direct = attr(blip, 'embed')
  if (direct) return direct
  const extLst = firstChildByLocal(blip, 'extLst')
  if (extLst) {
    for (const ext of childrenByLocal(extLst, 'ext')) {
      for (const child of elementChildren(ext)) {
        const svgEmbed = attr(child, 'embed')
        if (svgEmbed) return svgEmbed
      }
    }
  }
  return null
}

function parseSpPrFill(spPr, ctx, rels) {
  if (!spPr) return null
  for (const child of elementChildren(spPr)) {
    const n = localName(child)
    if (n === 'noFill' || n === 'solidFill' || n === 'gradFill' || n === 'blipFill') {
      return parseFillElement(child, ctx, rels)
    }
  }
  return null
}

function parseBorder(lnNode, ctx, phColor = null) {
  if (!lnNode) return null
  if (firstChildByLocal(lnNode, 'noFill')) return { type: 'none', width: 0 }
  const wEmu = numAttr(lnNode, 'w')
  const width = wEmu !== null ? Math.max(0.75, emuToPx(wEmu)) : 1
  const solid = firstChildByLocal(lnNode, 'solidFill')
  const grad = firstChildByLocal(lnNode, 'gradFill')
  let color = null
  if (solid) {
    color = findColorChild(solid, ctx, phColor)?.css || null
  } else if (grad) {
    const gsLst = firstChildByLocal(grad, 'gsLst')
    const firstGs = gsLst ? firstChildByLocal(gsLst, 'gs') : null
    color = findColorChild(firstGs, ctx, phColor)?.css || null
  }
  if (!color) return null
  const prstDash = attr(firstChildByLocal(lnNode, 'prstDash'), 'val')
  let dash = 'solid'
  if (prstDash === 'dot' || prstDash === 'sysDot') dash = 'dotted'
  else if (prstDash && prstDash !== 'solid') dash = 'dashed'

  const headEnd = attr(firstChildByLocal(lnNode, 'headEnd'), 'type')
  const tailEnd = attr(firstChildByLocal(lnNode, 'tailEnd'), 'type')
  return {
    type: 'line',
    width,
    color,
    dash,
    headArrow: Boolean(headEnd && headEnd !== 'none'),
    tailArrow: Boolean(tailEnd && tailEnd !== 'none')
  }
}

function parseXfrm(xfrmNode) {
  if (!xfrmNode) return null
  const off = firstChildByLocal(xfrmNode, 'off')
  const ext = firstChildByLocal(xfrmNode, 'ext')
  if (!off || !ext) return null
  const x = emuToPx(numAttr(off, 'x') ?? 0)
  const y = emuToPx(numAttr(off, 'y') ?? 0)
  const w = emuToPx(numAttr(ext, 'cx') ?? 0)
  const h = emuToPx(numAttr(ext, 'cy') ?? 0)
  const chOff = firstChildByLocal(xfrmNode, 'chOff')
  const chExt = firstChildByLocal(xfrmNode, 'chExt')
  const rotRaw = numAttr(xfrmNode, 'rot')
  return {
    x,
    y,
    w,
    h,
    rot: rotRaw ? rotRaw / 60000 : 0,
    flipH: attr(xfrmNode, 'flipH') === '1' || attr(xfrmNode, 'flipH') === 'true',
    flipV: attr(xfrmNode, 'flipV') === '1' || attr(xfrmNode, 'flipV') === 'true',
    chX: chOff ? emuToPx(numAttr(chOff, 'x') ?? 0) : 0,
    chY: chOff ? emuToPx(numAttr(chOff, 'y') ?? 0) : 0,
    chW: chExt ? emuToPx(numAttr(chExt, 'cx') ?? 0) : 0,
    chH: chExt ? emuToPx(numAttr(chExt, 'cy') ?? 0) : 0
  }
}

function mapChildXfrm(child, group) {
  if (!child) return null
  const sx = group.chW > 0 ? group.w / group.chW : 1
  const sy = group.chH > 0 ? group.h / group.chH : 1
  return {
    x: group.x + (child.x - group.chX) * sx,
    y: group.y + (child.y - group.chY) * sy,
    w: child.w * sx,
    h: child.h * sy,
    rot: (child.rot || 0) + (group.rot || 0),
    flipH: Boolean(child.flipH) !== Boolean(group.flipH),
    flipV: Boolean(child.flipV) !== Boolean(group.flipV),
    chX: child.chX,
    chY: child.chY,
    chW: child.chW,
    chH: child.chH
  }
}

function parseRPr(rPrNode, ctx) {
  if (!rPrNode) return {}
  const out = {}
  const sz = numAttr(rPrNode, 'sz')
  if (sz !== null) out.fontSize = (sz / 100) * PT_TO_PX
  const b = attr(rPrNode, 'b')
  if (b !== null) out.bold = b === '1' || b === 'true'
  const i = attr(rPrNode, 'i')
  if (i !== null) out.italic = i === '1' || i === 'true'
  const u = attr(rPrNode, 'u')
  if (u !== null) out.underline = u !== 'none'
  const strike = attr(rPrNode, 'strike')
  if (strike !== null) out.strike = strike !== 'noStrike'

  const solid = firstChildByLocal(rPrNode, 'solidFill')
  if (solid) {
    const color = findColorChild(solid, ctx)
    if (color) out.color = color.css
  }

  const latin = attr(firstChildByLocal(rPrNode, 'latin'), 'typeface')
  const ea = attr(firstChildByLocal(rPrNode, 'ea'), 'typeface')
  const font = resolveFontFamily(latin || ea, ctx)
  if (font) out.fontFamily = font

  return out
}

function parsePPr(pPrNode, ctx) {
  if (!pPrNode) return {}
  const out = {}
  const algn = attr(pPrNode, 'algn')
  if (algn) {
    out.align = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' }[algn] || 'left'
  }
  const lvl = numAttr(pPrNode, 'lvl')
  if (lvl !== null) out.level = lvl
  const marL = numAttr(pPrNode, 'marL')
  if (marL !== null) out.marginLeft = emuToPx(marL)
  const indent = numAttr(pPrNode, 'indent')
  if (indent !== null) out.indent = emuToPx(indent)

  const lnSpc = firstChildByLocal(pPrNode, 'lnSpc')
  if (lnSpc) {
    const pct = numAttr(firstChildByLocal(lnSpc, 'spcPct'), 'val')
    const pts = numAttr(firstChildByLocal(lnSpc, 'spcPts'), 'val')
    if (pct !== null) out.lineHeight = clamp01(pct / 100000) * (pct / 100000 >= 1 ? 1 : 1) || pct / 100000
    else if (pts !== null) out.lineHeightPx = (pts / 100) * PT_TO_PX
  }

  const spcBef = firstChildByLocal(pPrNode, 'spcBef')
  if (spcBef) {
    const pts = numAttr(firstChildByLocal(spcBef, 'spcPts'), 'val')
    if (pts !== null) out.spaceBefore = (pts / 100) * PT_TO_PX
  }

  const spcAft = firstChildByLocal(pPrNode, 'spcAft')
  if (spcAft) {
    const pts = numAttr(firstChildByLocal(spcAft, 'spcPts'), 'val')
    if (pts !== null) out.spaceAfter = (pts / 100) * PT_TO_PX
  }

  if (firstChildByLocal(pPrNode, 'buNone')) {
    out.bullet = { type: 'none' }
  } else {
    const buChar = firstChildByLocal(pPrNode, 'buChar')
    const buAutoNum = firstChildByLocal(pPrNode, 'buAutoNum')
    if (buChar) {
      const raw = attr(buChar, 'char') || '•'
      out.bullet = { type: 'char', char: WINGDINGS_MAP[raw] || raw }
    } else if (buAutoNum) {
      out.bullet = {
        type: 'auto',
        scheme: attr(buAutoNum, 'type') || 'arabicPeriod',
        startAt: numAttr(buAutoNum, 'startAt') ?? 1
      }
    }
  }

  const buClr = firstChildByLocal(pPrNode, 'buClr')
  if (buClr) {
    const c = findColorChild(buClr, ctx)
    if (c) out.bulletColor = c.css
  }

  const defRPr = firstChildByLocal(pPrNode, 'defRPr')
  if (defRPr) out.defRPr = parseRPr(defRPr, ctx)

  return out
}

function parseLstStyle(lstStyleNode, ctx) {
  const levels = {}
  if (!lstStyleNode) return levels
  for (const child of elementChildren(lstStyleNode)) {
    const name = localName(child)
    if (name === 'defPPr') {
      levels[0] = parsePPr(child, ctx)
    } else {
      const m = /^lvl(\d)pPr$/.exec(name)
      if (m) levels[Number(m[1]) - 1] = parsePPr(child, ctx)
    }
  }
  return levels
}

function mergeStyles(...layers) {
  const out = {}
  for (const layer of layers) {
    if (!layer) continue
    for (const [k, v] of Object.entries(layer)) {
      if (v !== undefined && v !== null) out[k] = v
    }
  }
  return out
}

function formatAutoBullet(scheme, count) {
  if (scheme.startsWith('alphaLc')) {
    const idx = ((count - 1) % 26)
    return `${String.fromCharCode(97 + idx)}.`
  }
  if (scheme.startsWith('alphaUc')) {
    const idx = ((count - 1) % 26)
    return `${String.fromCharCode(65 + idx)}.`
  }
  if (scheme.startsWith('romanLc')) {
    return `${toRoman(count).toLowerCase()}.`
  }
  if (scheme.startsWith('romanUc')) {
    return `${toRoman(count)}.`
  }
  if (scheme.includes('ParenR')) return `${count})`
  return `${count}.`
}

function toRoman(num) {
  const pairs = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let n = Math.max(1, num)
  let out = ''
  for (const [v, s] of pairs) {
    while (n >= v) { out += s; n -= v }
  }
  return out
}

function roleDefaultSizePx(role) {
  if (role === 'title' || role === 'ctrTitle') return 40 * PT_TO_PX
  if (role === 'subTitle') return 22 * PT_TO_PX
  if (role === 'table') return 13 * PT_TO_PX
  if (role === 'body' || role === 'obj') return 18 * PT_TO_PX
  return 16 * PT_TO_PX
}

function parseTxBody(txBodyNode, ctx, styleChain, role, slideNumber, fallbackFontColor) {
  if (!txBodyNode) return null
  const bodyPr = firstChildByLocal(txBodyNode, 'bodyPr')
  const anchorRaw = attr(bodyPr, 'anchor')
  const anchor = { t: 'flex-start', ctr: 'center', b: 'flex-end' }[anchorRaw] || 'flex-start'
  const padL = emuToPx(numAttr(bodyPr, 'lIns') ?? 91440)
  const padT = emuToPx(numAttr(bodyPr, 'tIns') ?? 45720)
  const padR = emuToPx(numAttr(bodyPr, 'rIns') ?? 91440)
  const padB = emuToPx(numAttr(bodyPr, 'bIns') ?? 45720)
  const wrap = attr(bodyPr, 'wrap') !== 'none'

  const ownLstStyle = parseLstStyle(firstChildByLocal(txBodyNode, 'lstStyle'), ctx)
  const allLstStyles = [...styleChain, ownLstStyle]

  const paragraphs = []
  const autoCounters = new Map()

  for (const pNode of childrenByLocal(txBodyNode, 'p')) {
    const pPrNode = firstChildByLocal(pNode, 'pPr')
    const pPr = parsePPr(pPrNode, ctx)
    const level = pPr.level ?? 0
    const lvlStyles = allLstStyles.map(s => s?.[level] || s?.[0]).filter(Boolean)
    const mergedP = mergeStyles(...lvlStyles, pPr)
    const mergedDefRPr = mergeStyles(
      ...lvlStyles.map(s => s.defRPr),
      pPr.defRPr
    )

    const endParaRPr = parseRPr(firstChildByLocal(pNode, 'endParaRPr'), ctx)
    const baseRunStyle = mergeStyles(
      {
        fontSize: roleDefaultSizePx(role),
        fontFamily: ctx.theme.fonts.minor,
        color: fallbackFontColor || '#1c1917',
        bold: role === 'title' || role === 'ctrTitle'
      },
      mergedDefRPr,
      endParaRPr
    )

    const runs = []
    for (const child of elementChildren(pNode)) {
      const name = localName(child)
      if (name === 'r') {
        const rPr = parseRPr(firstChildByLocal(child, 'rPr'), ctx)
        const tNode = firstChildByLocal(child, 't')
        const text = tNode ? (tNode.textContent ?? '') : ''
        if (text.length > 0) {
          runs.push({
            text,
            ...mergeStyles(baseRunStyle, rPr)
          })
        }
      } else if (name === 'br') {
        runs.push({ br: true, fontSize: baseRunStyle.fontSize })
      } else if (name === 'fld') {
        const fldType = attr(child, 'type')
        const rPr = parseRPr(firstChildByLocal(child, 'rPr'), ctx)
        const tNode = firstChildByLocal(child, 't')
        let text = tNode ? (tNode.textContent ?? '') : ''
        if (fldType === 'slidenum' && slideNumber != null) {
          text = String(slideNumber)
        }
        if (text.length > 0) {
          runs.push({
            text,
            ...mergeStyles(baseRunStyle, rPr)
          })
        }
      }
    }

    const hasText = runs.some(r => !r.br && r.text)
    let bullet = null
    if (hasText && mergedP.bullet && mergedP.bullet.type !== 'none') {
      if (mergedP.bullet.type === 'char') {
        bullet = {
          text: mergedP.bullet.char,
          color: mergedP.bulletColor || runs[0]?.color || baseRunStyle.color
        }
      } else if (mergedP.bullet.type === 'auto') {
        const prev = autoCounters.get(level) ?? ((mergedP.bullet.startAt ?? 1) - 1)
        const next = prev + 1
        autoCounters.set(level, next)
        bullet = {
          text: formatAutoBullet(mergedP.bullet.scheme, next),
          color: mergedP.bulletColor || runs[0]?.color || baseRunStyle.color
        }
      }
    } else if (!mergedP.bullet || mergedP.bullet.type !== 'auto') {
      autoCounters.delete(level)
    }

    paragraphs.push({
      align: mergedP.align || (role === 'ctrTitle' || role === 'subTitle' ? 'center' : 'left'),
      level,
      marginLeft: mergedP.marginLeft ?? (level > 0 ? level * 20 : 0),
      indent: mergedP.indent ?? (bullet ? -14 : 0),
      lineHeight: mergedP.lineHeight ?? 1.18,
      lineHeightPx: mergedP.lineHeightPx ?? null,
      spaceBefore: mergedP.spaceBefore ?? 0,
      spaceAfter: mergedP.spaceAfter ?? 2,
      bullet,
      defaultFontSize: baseRunStyle.fontSize,
      runs
    })
  }

  return { anchor, padL, padT, padR, padB, wrap, paragraphs }
}

function getPlaceholderInfo(node) {
  const nvPr =
    firstChildByLocal(firstChildByLocal(node, 'nvSpPr'), 'nvPr') ||
    firstChildByLocal(firstChildByLocal(node, 'nvPicPr'), 'nvPr') ||
    firstChildByLocal(firstChildByLocal(node, 'nvGraphicFramePr'), 'nvPr')
  const ph = nvPr ? firstChildByLocal(nvPr, 'ph') : null
  if (!ph) return null
  return {
    type: attr(ph, 'type') || 'body',
    idx: attr(ph, 'idx')
  }
}

function findMatchingPlaceholder(phMap, phInfo) {
  if (!phMap || !phInfo) return null
  if (phInfo.idx !== null && phMap.byIdx.has(phInfo.idx)) {
    return phMap.byIdx.get(phInfo.idx)
  }
  if (phInfo.type && phMap.byType.has(phInfo.type)) {
    return phMap.byType.get(phInfo.type)
  }
  if (phInfo.type === 'ctrTitle' && phMap.byType.has('title')) {
    return phMap.byType.get('title')
  }
  if (phInfo.type === 'subTitle' && phMap.byType.has('body')) {
    return phMap.byType.get('body')
  }
  return null
}

function resolveStyleReferences(shapeNode, ctx, rels) {
  const styleNode = firstChildByLocal(shapeNode, 'style')
  if (!styleNode) return { fill: null, border: null, fontColor: null }

  let fill = null
  const fillRef = firstChildByLocal(styleNode, 'fillRef')
  if (fillRef) {
    const idx = numAttr(fillRef, 'idx') ?? 0
    const phClr = findColorChild(fillRef, ctx)
    if (idx >= 1 && idx <= ctx.theme.fillStyles.length) {
      fill = parseFillElement(ctx.theme.fillStyles[idx - 1], ctx, rels, phClr)
    } else if (idx >= 1001 && idx - 1001 < ctx.theme.bgFillStyles.length) {
      fill = parseFillElement(ctx.theme.bgFillStyles[idx - 1001], ctx, rels, phClr)
    } else if (idx > 0 && phClr) {
      fill = { type: 'solid', color: phClr.css, alpha: phClr.alpha }
    }
  }

  let border = null
  const lnRef = firstChildByLocal(styleNode, 'lnRef')
  if (lnRef) {
    const idx = numAttr(lnRef, 'idx') ?? 0
    const phClr = findColorChild(lnRef, ctx)
    if (idx >= 1 && idx <= ctx.theme.lnStyles.length) {
      border = parseBorder(ctx.theme.lnStyles[idx - 1], ctx, phClr)
    } else if (idx > 0 && phClr) {
      border = { type: 'line', width: 1, color: phClr.css, dash: 'solid' }
    }
  }

  let fontColor = null
  const fontRef = firstChildByLocal(styleNode, 'fontRef')
  if (fontRef) {
    const c = findColorChild(fontRef, ctx)
    if (c) fontColor = c.css
  }

  return { fill, border, fontColor }
}

async function loadImageDataUri(zip, mediaPath, imageCache) {
  if (!mediaPath) return null
  if (imageCache.has(mediaPath)) return imageCache.get(mediaPath)
  const ext = mediaPath.split('.').pop()?.toLowerCase() || ''
  const mime = IMAGE_MIMES[ext]
  if (!mime) {
    imageCache.set(mediaPath, null)
    return null
  }
  const entry = findZipFile(zip, mediaPath)
  if (!entry) {
    imageCache.set(mediaPath, null)
    return null
  }
  const b64 = await entry.async('base64')
  const uri = `data:${mime};base64,${b64}`
  imageCache.set(mediaPath, uri)
  return uri
}

function unwrapTreeNodes(container) {
  const out = []
  for (const child of elementChildren(container)) {
    const name = localName(child)
    if (name === 'AlternateContent') {
      const fb = firstChildByLocal(child, 'Fallback')
      const ch = firstChildByLocal(child, 'Choice')
      const picked = fb || ch
      if (picked) out.push(...unwrapTreeNodes(picked))
    } else {
      out.push(child)
    }
  }
  return out
}

function parseTable(tblNode, xfrm, ctx, slideNumber) {
  const tblPr = firstChildByLocal(tblNode, 'tblPr')
  const firstRowFlag = attr(tblPr, 'firstRow') === '1'
  const bandRowFlag = attr(tblPr, 'bandRow') === '1'
  const tblFill = parseSpPrFill(tblPr, ctx, null)

  const tblGrid = firstChildByLocal(tblNode, 'tblGrid')
  const rawCols = tblGrid ? childrenByLocal(tblGrid, 'gridCol').map(c => emuToPx(numAttr(c, 'w') ?? 0)) : []
  const rawColSum = rawCols.reduce((a, b) => a + b, 0)
  const colWidths = rawColSum > 0 && xfrm.w > 0
    ? rawCols.map(w => (w / rawColSum) * xfrm.w)
    : rawCols

  const trNodes = childrenByLocal(tblNode, 'tr')
  const rows = []
  const accentHex = ctx.theme.colors[ctx.clrMap.accent1] || ctx.theme.colors.accent1 || '4F81BD'
  const accentRgb = hexToRgb(accentHex) || [79, 129, 189]
  const headerBg = rgbToCss(accentRgb, 0.92)
  const bandBg = rgbToCss(accentRgb, 0.08)

  for (let rIdx = 0; rIdx < trNodes.length; rIdx++) {
    const tr = trNodes[rIdx]
    const rowH = emuToPx(numAttr(tr, 'h') ?? 0)
    const cells = []
    for (const tc of childrenByLocal(tr, 'tc')) {
      const hMerge = attr(tc, 'hMerge') === '1'
      const vMerge = attr(tc, 'vMerge') === '1'
      if (hMerge || vMerge) continue

      const colSpan = numAttr(tc, 'gridSpan') ?? 1
      const rowSpan = numAttr(tc, 'rowSpan') ?? 1
      const tcPr = firstChildByLocal(tc, 'tcPr')
      const explicitFill = parseSpPrFill(tcPr, ctx, null)

      let bg = null
      let defaultTextColor = '#1c1917'
      let isHeader = firstRowFlag && rIdx === 0

      if (explicitFill) {
        bg = explicitFill.type === 'solid' ? explicitFill.color : explicitFill.type === 'gradient' ? explicitFill.css : null
      } else if (isHeader) {
        bg = headerBg
        defaultTextColor = '#ffffff'
      } else if (bandRowFlag && rIdx % 2 === 1) {
        bg = bandBg
      } else if (tblFill?.type === 'solid') {
        bg = tblFill.color
      }

      const borders = {}
      for (const side of ['lnL', 'lnR', 'lnT', 'lnB']) {
        const b = parseBorder(firstChildByLocal(tcPr, side), ctx)
        if (b) borders[side] = b
      }

      const padL = emuToPx(numAttr(tcPr, 'marL') ?? 68580)
      const padR = emuToPx(numAttr(tcPr, 'marR') ?? 68580)
      const padT = emuToPx(numAttr(tcPr, 'marT') ?? 45720)
      const padB = emuToPx(numAttr(tcPr, 'marB') ?? 45720)
      const anchorRaw = attr(tcPr, 'anchor')
      const vAlign = { t: 'top', ctr: 'middle', b: 'bottom' }[anchorRaw] || 'top'

      const txBody = firstChildByLocal(tc, 'txBody')
      const text = parseTxBody(txBody, ctx, [], 'table', slideNumber, defaultTextColor)
      if (isHeader && text) {
        for (const p of text.paragraphs) {
          for (const run of p.runs) {
            if (!run.br && run.bold === undefined) run.bold = true
          }
        }
      }

      cells.push({
        colSpan,
        rowSpan,
        bg,
        borders,
        padL,
        padR,
        padT,
        padB,
        vAlign,
        text
      })
    }
    rows.push({ height: rowH, cells })
  }

  return { kind: 'table', xfrm, colWidths, rows }
}

async function parseSpTree(spTreeNode, { zip, ctx, rels, master, layout, slideNumber, isTemplate, groupXfrm, imageCache }) {
  if (!spTreeNode) return []
  const items = []

  for (const node of unwrapTreeNodes(spTreeNode)) {
    const tag = localName(node)

    if (tag === 'grpSp') {
      const grpSpPr = firstChildByLocal(node, 'grpSpPr')
      const localGrp = parseXfrm(firstChildByLocal(grpSpPr, 'xfrm'))
      const mappedGrp = localGrp ? (groupXfrm ? mapChildXfrm(localGrp, groupXfrm) : localGrp) : groupXfrm
      const nested = await parseSpTree(node, {
        zip, ctx, rels, master, layout, slideNumber, isTemplate, groupXfrm: mappedGrp, imageCache
      })
      items.push(...nested)
      continue
    }

    if (tag === 'sp' || tag === 'cxnSp') {
      const phInfo = getPlaceholderInfo(node)
      if (isTemplate && phInfo) continue

      const layoutPh = findMatchingPlaceholder(layout?.placeholders, phInfo)
      const masterPh = findMatchingPlaceholder(master?.placeholders, phInfo)

      const spPr = firstChildByLocal(node, 'spPr')
      let xfrm = parseXfrm(firstChildByLocal(spPr, 'xfrm')) || layoutPh?.xfrm || masterPh?.xfrm
      if (!xfrm) continue
      if (groupXfrm) xfrm = mapChildXfrm(xfrm, groupXfrm)

      const prstGeom = firstChildByLocal(spPr, 'prstGeom') || layoutPh?.prstGeom || masterPh?.prstGeom
      const prst = attr(prstGeom, 'prst') || (tag === 'cxnSp' ? 'straightConnector1' : 'rect')
      let roundRadius = null
      if (prst === 'roundRect') {
        const avLst = firstChildByLocal(prstGeom, 'avLst')
        const gd = avLst ? firstChildByLocal(avLst, 'gd') : null
        const fmla = attr(gd, 'fmla')
        const m = /^val\s+(\d+)$/.exec(fmla || '')
        const adj = m ? Number(m[1]) / 100000 : 0.16667
        roundRadius = Math.min(xfrm.w, xfrm.h) * Math.min(0.5, Math.max(0, adj))
      }

      const styleRefs = resolveStyleReferences(node, ctx, rels)
      let fill = parseSpPrFill(spPr, ctx, rels)
      if (!fill && layoutPh?.spPr) fill = parseSpPrFill(layoutPh.spPr, ctx, layout.rels)
      if (!fill && masterPh?.spPr) fill = parseSpPrFill(masterPh.spPr, ctx, master.rels)
      if (!fill) fill = styleRefs.fill

      if (fill?.type === 'image') {
        const dataUri = await loadImageDataUri(zip, fill.target, imageCache)
        fill = dataUri ? { type: 'image', dataUri } : null
      }

      let border = parseBorder(firstChildByLocal(spPr, 'ln'), ctx)
      if (!border && layoutPh?.spPr) border = parseBorder(firstChildByLocal(layoutPh.spPr, 'ln'), ctx)
      if (!border && masterPh?.spPr) border = parseBorder(firstChildByLocal(masterPh.spPr, 'ln'), ctx)
      if (!border) border = styleRefs.border

      const role = phInfo?.type || (tag === 'sp' ? 'other' : 'line')
      const masterTxStyle = master?.txStyles
        ? (role === 'title' || role === 'ctrTitle'
          ? master.txStyles.titleStyle
          : role === 'body' || role === 'subTitle' || role === 'obj'
            ? master.txStyles.bodyStyle
            : master.txStyles.otherStyle)
        : null

      const styleChain = [
        ctx.defaultTextStyle,
        masterTxStyle,
        masterPh?.lstStyle,
        layoutPh?.lstStyle
      ].filter(Boolean)

      const fallbackColor = styleRefs.fontColor || (fill?.type === 'solid' && isDarkColor(fill.color) ? '#ffffff' : null)
      const txBodyNode = firstChildByLocal(node, 'txBody')
      const text = parseTxBody(txBodyNode, ctx, styleChain, role, slideNumber, fallbackColor)

      items.push({
        kind: tag === 'cxnSp' || prst === 'line' || prst.includes('Connector') ? 'line' : 'shape',
        xfrm,
        prst,
        roundRadius,
        fill,
        border,
        text
      })
      continue
    }

    if (tag === 'pic') {
      const phInfo = getPlaceholderInfo(node)
      if (isTemplate && phInfo) continue

      const layoutPh = findMatchingPlaceholder(layout?.placeholders, phInfo)
      const masterPh = findMatchingPlaceholder(master?.placeholders, phInfo)
      const spPr = firstChildByLocal(node, 'spPr')
      let xfrm = parseXfrm(firstChildByLocal(spPr, 'xfrm')) || layoutPh?.xfrm || masterPh?.xfrm
      if (!xfrm) continue
      if (groupXfrm) xfrm = mapChildXfrm(xfrm, groupXfrm)

      const blipFill = firstChildByLocal(node, 'blipFill')
      const blip = firstChildByLocal(blipFill, 'blip')
      const embedId = findBlipEmbedId(blip)
      const mediaTarget = embedId ? rels?.get(embedId)?.target : null
      const dataUri = await loadImageDataUri(zip, mediaTarget, imageCache)
      if (!dataUri) continue

      const srcRect = firstChildByLocal(blipFill, 'srcRect')
      const crop = srcRect ? {
        l: (numAttr(srcRect, 'l') ?? 0) / 100000,
        t: (numAttr(srcRect, 't') ?? 0) / 100000,
        r: (numAttr(srcRect, 'r') ?? 0) / 100000,
        b: (numAttr(srcRect, 'b') ?? 0) / 100000
      } : null

      const border = parseBorder(firstChildByLocal(spPr, 'ln'), ctx)
      const prst = attr(firstChildByLocal(spPr, 'prstGeom'), 'prst') || 'rect'

      items.push({
        kind: 'pic',
        xfrm,
        dataUri,
        crop,
        border,
        prst
      })
      continue
    }

    if (tag === 'graphicFrame') {
      let xfrm = parseXfrm(firstChildByLocal(node, 'xfrm'))
      if (!xfrm) continue
      if (groupXfrm) xfrm = mapChildXfrm(xfrm, groupXfrm)

      const graphic = firstChildByLocal(node, 'graphic')
      const graphicData = firstChildByLocal(graphic, 'graphicData')
      const uri = attr(graphicData, 'uri') || ''
      const tbl = graphicData ? firstChildByLocal(graphicData, 'tbl') : null

      if (tbl) {
        items.push(parseTable(tbl, xfrm, ctx, slideNumber))
      } else if (uri.includes('chart')) {
        items.push({ kind: 'fallback', fallbackType: 'chart', xfrm })
      } else if (uri.includes('diagram')) {
        items.push({ kind: 'fallback', fallbackType: 'diagram', xfrm })
      }
    }
  }

  return items
}

function isDarkColor(cssColor) {
  if (!cssColor) return false
  if (cssColor.startsWith('#')) {
    const rgb = hexToRgb(cssColor)
    if (!rgb) return false
    const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
    return lum < 0.45
  }
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/.exec(cssColor)
  if (!m) return false
  const alpha = m[4] !== undefined ? Number(m[4]) : 1
  if (alpha < 0.4) return false
  const lum = (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255
  return lum < 0.45
}

function collectPlaceholders(spTreeNode, ctx) {
  const byIdx = new Map()
  const byType = new Map()
  if (!spTreeNode) return { byIdx, byType }

  for (const node of unwrapTreeNodes(spTreeNode)) {
    const tag = localName(node)
    if (tag !== 'sp' && tag !== 'pic') continue
    const ph = getPlaceholderInfo(node)
    if (!ph) continue
    const spPr = firstChildByLocal(node, 'spPr')
    const txBody = firstChildByLocal(node, 'txBody')
    const info = {
      xfrm: parseXfrm(firstChildByLocal(spPr, 'xfrm')),
      prstGeom: firstChildByLocal(spPr, 'prstGeom'),
      spPr,
      lstStyle: parseLstStyle(firstChildByLocal(txBody, 'lstStyle'), ctx)
    }
    if (ph.idx !== null && !byIdx.has(ph.idx)) byIdx.set(ph.idx, info)
    if (ph.type && !byType.has(ph.type)) byType.set(ph.type, info)
  }

  return { byIdx, byType }
}

async function resolveBackground(doc, ctx, rels, zip, imageCache) {
  const cSld = firstChildByLocal(doc?.documentElement, 'cSld')
  const bg = firstChildByLocal(cSld, 'bg')
  if (!bg) return null

  const bgPr = firstChildByLocal(bg, 'bgPr')
  if (bgPr) {
    const fill = parseSpPrFill(bgPr, ctx, rels)
    if (!fill) return null
    if (fill.type === 'image') {
      const dataUri = await loadImageDataUri(zip, fill.target, imageCache)
      return dataUri ? { type: 'image', dataUri } : null
    }
    return fill
  }

  const bgRef = firstChildByLocal(bg, 'bgRef')
  if (bgRef) {
    const idx = numAttr(bgRef, 'idx') ?? 0
    const phClr = findColorChild(bgRef, ctx)
    if (idx >= 1 && idx <= ctx.theme.fillStyles.length) {
      return parseFillElement(ctx.theme.fillStyles[idx - 1], ctx, rels, phClr)
    }
    if (idx >= 1001 && idx - 1001 < ctx.theme.bgFillStyles.length) {
      return parseFillElement(ctx.theme.bgFillStyles[idx - 1001], ctx, rels, phClr)
    }
    if (phClr) return { type: 'solid', color: phClr.css, alpha: phClr.alpha }
  }

  return null
}

function extractNotesText(notesDoc) {
  if (!notesDoc?.documentElement) return ''
  const cSld = firstChildByLocal(notesDoc.documentElement, 'cSld')
  const spTree = firstChildByLocal(cSld, 'spTree')
  if (!spTree) return ''

  const lines = []
  for (const node of unwrapTreeNodes(spTree)) {
    if (localName(node) !== 'sp') continue
    const ph = getPlaceholderInfo(node)
    if (ph && (ph.type === 'sldImg' || ph.type === 'sldNum')) continue
    const txBody = firstChildByLocal(node, 'txBody')
    if (!txBody) continue
    for (const p of childrenByLocal(txBody, 'p')) {
      const chunks = []
      for (const child of elementChildren(p)) {
        const name = localName(child)
        if (name === 'r') {
          const t = firstChildByLocal(child, 't')
          if (t?.textContent) chunks.push(t.textContent)
        } else if (name === 'br') {
          chunks.push('\n')
        } else if (name === 'fld') {
          if (attr(child, 'type') === 'slidenum') continue
          const t = firstChildByLocal(child, 't')
          if (t?.textContent) chunks.push(t.textContent)
        }
      }
      const line = chunks.join('').trimEnd()
      if (line.length > 0 || lines.length > 0) lines.push(line)
    }
  }
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

export async function parsePptx(bytes, options = {}) {
  const parseXml = options.parseXml || defaultParseXml
  const zip = await JSZip.loadAsync(bytes)

  const presPath = 'ppt/presentation.xml'
  const presDoc = await readXml(zip, presPath, parseXml)
  if (!presDoc?.documentElement) {
    throw new Error('Missing ppt/presentation.xml')
  }

  const presRoot = presDoc.documentElement
  const sldSz = firstChildByLocal(presRoot, 'sldSz')
  const cx = numAttr(sldSz, 'cx')
  const cy = numAttr(sldSz, 'cy')
  const width = cx && cx > 0 ? Math.round(emuToPx(cx)) : 960
  const height = cy && cy > 0 ? Math.round(emuToPx(cy)) : 540

  const presRels = await readRels(zip, presPath, parseXml)

  let defaultTheme = parseTheme(null)
  for (const rel of presRels.values()) {
    if (rel.type.endsWith('/theme')) {
      const themeDoc = await readXml(zip, rel.target, parseXml)
      if (themeDoc) {
        defaultTheme = parseTheme(themeDoc)
        break
      }
    }
  }
  if (defaultTheme.fillStyles.length === 0) {
    const fallbackThemeDoc = await readXml(zip, 'ppt/theme/theme1.xml', parseXml)
    if (fallbackThemeDoc) defaultTheme = parseTheme(fallbackThemeDoc)
  }

  const defaultTextStyle = parseLstStyle(
    firstChildByLocal(presRoot, 'defaultTextStyle'),
    { theme: defaultTheme, clrMap: DEFAULT_CLR_MAP }
  )

  const slidePaths = []
  const sldIdLst = firstChildByLocal(presRoot, 'sldIdLst')
  if (sldIdLst) {
    for (const sldId of childrenByLocal(sldIdLst, 'sldId')) {
      const rId = attr(sldId, 'id')
      const rel = rId ? presRels.get(rId) : null
      if (rel?.target) slidePaths.push(rel.target)
    }
  }
  if (slidePaths.length === 0) {
    const fallbackSlides = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/(\d+)\.xml$/i)?.[1] || 0)
        const nb = Number(b.match(/(\d+)\.xml$/i)?.[1] || 0)
        return na - nb
      })
    slidePaths.push(...fallbackSlides)
  }

  const masterCache = new Map()
  const layoutCache = new Map()
  const imageCache = new Map()

  async function loadMaster(masterPath) {
    if (!masterPath) return null
    if (masterCache.has(masterPath)) return masterCache.get(masterPath)
    const doc = await readXml(zip, masterPath, parseXml)
    if (!doc?.documentElement) {
      masterCache.set(masterPath, null)
      return null
    }
    const rels = await readRels(zip, masterPath, parseXml)
    let theme = defaultTheme
    for (const rel of rels.values()) {
      if (rel.type.endsWith('/theme')) {
        const tDoc = await readXml(zip, rel.target, parseXml)
        if (tDoc) {
          theme = parseTheme(tDoc)
          break
        }
      }
    }
    const clrMap = parseClrMap(firstChildByLocal(doc.documentElement, 'clrMap'))
    const ctx = { theme, clrMap, defaultTextStyle }
    const txStylesNode = firstChildByLocal(doc.documentElement, 'txStyles')
    const txStyles = txStylesNode ? {
      titleStyle: parseLstStyle(firstChildByLocal(txStylesNode, 'titleStyle'), ctx),
      bodyStyle: parseLstStyle(firstChildByLocal(txStylesNode, 'bodyStyle'), ctx),
      otherStyle: parseLstStyle(firstChildByLocal(txStylesNode, 'otherStyle'), ctx)
    } : null

    const cSld = firstChildByLocal(doc.documentElement, 'cSld')
    const spTree = firstChildByLocal(cSld, 'spTree')
    const placeholders = collectPlaceholders(spTree, ctx)
    const background = await resolveBackground(doc, ctx, rels, zip, imageCache)
    const master = { doc, rels, theme, clrMap, txStyles, placeholders, background, spTree, decoShapes: null }
    master.decoShapes = await parseSpTree(spTree, {
      zip, ctx, rels, master, layout: null, slideNumber: null, isTemplate: true, groupXfrm: null, imageCache
    })
    masterCache.set(masterPath, master)
    return master
  }

  async function loadLayout(layoutPath) {
    if (!layoutPath) return null
    if (layoutCache.has(layoutPath)) return layoutCache.get(layoutPath)
    const doc = await readXml(zip, layoutPath, parseXml)
    if (!doc?.documentElement) {
      layoutCache.set(layoutPath, null)
      return null
    }
    const rels = await readRels(zip, layoutPath, parseXml)
    let masterPath = null
    for (const rel of rels.values()) {
      if (rel.type.endsWith('/slideMaster')) {
        masterPath = rel.target
        break
      }
    }
    const master = await loadMaster(masterPath)
    const baseClrMap = master?.clrMap || DEFAULT_CLR_MAP
    const clrMapOvr = firstChildByLocal(doc.documentElement, 'clrMapOvr')
    const overrideMap = clrMapOvr ? firstChildByLocal(clrMapOvr, 'overrideClrMapping') : null
    const clrMap = overrideMap ? parseClrMap(overrideMap, baseClrMap) : baseClrMap
    const theme = master?.theme || defaultTheme
    const ctx = { theme, clrMap, defaultTextStyle }
    const showMasterSp = attr(doc.documentElement, 'showMasterSp') !== '0'
    const cSld = firstChildByLocal(doc.documentElement, 'cSld')
    const spTree = firstChildByLocal(cSld, 'spTree')
    const placeholders = collectPlaceholders(spTree, ctx)
    const background = await resolveBackground(doc, ctx, rels, zip, imageCache)
    const layout = { doc, rels, master, clrMap, theme, showMasterSp, placeholders, background, decoShapes: null }
    layout.decoShapes = await parseSpTree(spTree, {
      zip, ctx, rels, master, layout, slideNumber: null, isTemplate: true, groupXfrm: null, imageCache
    })
    layoutCache.set(layoutPath, layout)
    return layout
  }

  const slides = []
  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i]
    const slideNumber = i + 1
    const slideDoc = await readXml(zip, slidePath, parseXml)
    if (!slideDoc?.documentElement) continue
    const rels = await readRels(zip, slidePath, parseXml)

    let layoutPath = null
    let notesPath = null
    for (const rel of rels.values()) {
      if (rel.type.endsWith('/slideLayout')) layoutPath = rel.target
      else if (rel.type.endsWith('/notesSlide')) notesPath = rel.target
    }

    const layout = await loadLayout(layoutPath)
    const master = layout?.master || null
    const theme = layout?.theme || defaultTheme
    const baseClrMap = layout?.clrMap || master?.clrMap || DEFAULT_CLR_MAP
    const clrMapOvr = firstChildByLocal(slideDoc.documentElement, 'clrMapOvr')
    const overrideMap = clrMapOvr ? firstChildByLocal(clrMapOvr, 'overrideClrMapping') : null
    const clrMap = overrideMap ? parseClrMap(overrideMap, baseClrMap) : baseClrMap
    const ctx = { theme, clrMap, defaultTextStyle }

    const showMasterSp = attr(slideDoc.documentElement, 'showMasterSp') !== '0'
    const background =
      (await resolveBackground(slideDoc, ctx, rels, zip, imageCache)) ||
      layout?.background ||
      master?.background ||
      { type: 'solid', color: '#ffffff', alpha: 1 }

    const cSld = firstChildByLocal(slideDoc.documentElement, 'cSld')
    const spTree = firstChildByLocal(cSld, 'spTree')
    const ownElements = await parseSpTree(spTree, {
      zip, ctx, rels, master, layout, slideNumber, isTemplate: false, groupXfrm: null, imageCache
    })

    const elements = []
    if (showMasterSp && layout?.showMasterSp && master?.decoShapes?.length) {
      elements.push(...master.decoShapes)
    }
    if (showMasterSp && layout?.decoShapes?.length) {
      elements.push(...layout.decoShapes)
    }
    elements.push(...ownElements)

    let notes = ''
    if (notesPath) {
      const notesDoc = await readXml(zip, notesPath, parseXml)
      notes = extractNotesText(notesDoc)
    }

    slides.push({
      index: slideNumber,
      background,
      elements,
      notes
    })
  }

  return { width, height, slides }
}
