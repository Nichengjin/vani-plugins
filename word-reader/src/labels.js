const dictionaries = {
  en: {
    outlineToggle: 'Toggle document outline',
    outline: 'Outline',
    noHeadings: 'No headings in document',
    findPlaceholder: 'Find in document…',
    findAriaLabel: 'Find in document',
    prevMatch: 'Previous match',
    nextMatch: 'Next match',
    clearSearch: 'Clear search',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resetZoom: 'Reset zoom',
    opening: 'Opening document…',
    tooLargeBytes: 'This document exceeds the 32 MiB reader limit.',
    openFailed: 'Could not open this Word document. Only valid .docx files are supported.',
    emptyDoc: 'This document has no readable content.',
    matchCount(current, total) {
      return `${current} of ${total}`
    },
    formatStats(words, headings, tables, fmt) {
      const w = `${fmt.format(words)} ${words === 1 ? 'word' : 'words'}`
      const h = `${fmt.format(headings)} ${headings === 1 ? 'heading' : 'headings'}`
      const t = `${fmt.format(tables)} ${tables === 1 ? 'table' : 'tables'}`
      return `${w} · ${h} · ${t}`
    }
  },
  'zh-CN': {
    outlineToggle: '切换文档大纲',
    outline: '大纲',
    noHeadings: '文档中没有标题',
    findPlaceholder: '在文档中查找…',
    findAriaLabel: '在文档中查找',
    prevMatch: '上一个匹配项',
    nextMatch: '下一个匹配项',
    clearSearch: '清除搜索',
    zoomOut: '缩小',
    zoomIn: '放大',
    resetZoom: '重置缩放',
    opening: '正在打开文档…',
    tooLargeBytes: '此文档超过了 32 MiB 的阅读大小上限。',
    openFailed: '无法打开此 Word 文档。仅支持有效的 .docx 文件。',
    emptyDoc: '此文档没有可读取的内容。',
    matchCount(current, total) {
      return `${current} / ${total}`
    },
    formatStats(words, headings, tables, fmt) {
      return `${fmt.format(words)} 词 · ${fmt.format(headings)} 个标题 · ${fmt.format(tables)} 个表格`
    }
  },
  'zh-TW': {
    outlineToggle: '切換文件大綱',
    outline: '大綱',
    noHeadings: '文件中沒有標題',
    findPlaceholder: '在文件中尋找…',
    findAriaLabel: '在文件中尋找',
    prevMatch: '上一個相符項目',
    nextMatch: '下一個相符項目',
    clearSearch: '清除搜尋',
    zoomOut: '縮小',
    zoomIn: '放大',
    resetZoom: '重設縮放',
    opening: '正在開啟文件…',
    tooLargeBytes: '此文件超過 32 MiB 的閱讀大小上限。',
    openFailed: '無法開啟此 Word 文件。僅支援有效的 .docx 檔案。',
    emptyDoc: '此文件沒有可讀取的內容。',
    matchCount(current, total) {
      return `${current} / ${total}`
    },
    formatStats(words, headings, tables, fmt) {
      return `${fmt.format(words)} 詞 · ${fmt.format(headings)} 個標題 · ${fmt.format(tables)} 個表格`
    }
  },
  ja: {
    outlineToggle: 'ドキュメントの見出し構成を切り替え',
    outline: 'アウトライン',
    noHeadings: 'ドキュメントに見出しがありません',
    findPlaceholder: 'ドキュメント内を検索…',
    findAriaLabel: 'ドキュメント内を検索',
    prevMatch: '前の一致',
    nextMatch: '次の一致',
    clearSearch: '検索をクリア',
    zoomOut: '縮小',
    zoomIn: '拡大',
    resetZoom: 'ズームをリセット',
    opening: 'ドキュメントを開いています…',
    tooLargeBytes: 'このドキュメントは 32 MiB の閲覧上限を超えています。',
    openFailed: 'この Word ドキュメントを開けません。有効な .docx ファイルのみ対応しています。',
    emptyDoc: 'このドキュメントには読み取れる内容がありません。',
    matchCount(current, total) {
      return `${current} / ${total}`
    },
    formatStats(words, headings, tables, fmt) {
      return `${fmt.format(words)} 語 · 見出し ${fmt.format(headings)} · 表 ${fmt.format(tables)}`
    }
  },
  fr: {
    outlineToggle: 'Afficher ou masquer le plan',
    outline: 'Plan',
    noHeadings: 'Aucun titre dans le document',
    findPlaceholder: 'Rechercher dans le document…',
    findAriaLabel: 'Rechercher dans le document',
    prevMatch: 'Occurrence précédente',
    nextMatch: 'Occurrence suivante',
    clearSearch: 'Effacer la recherche',
    zoomOut: 'Zoom arrière',
    zoomIn: 'Zoom avant',
    resetZoom: 'Réinitialiser le zoom',
    opening: 'Ouverture du document…',
    tooLargeBytes: 'Ce document dépasse la limite de lecture de 32 Mio.',
    openFailed: 'Impossible d’ouvrir ce document Word. Seuls les fichiers .docx valides sont pris en charge.',
    emptyDoc: 'Ce document ne contient aucun contenu lisible.',
    matchCount(current, total) {
      return `${current} sur ${total}`
    },
    formatStats(words, headings, tables, fmt) {
      const w = `${fmt.format(words)} ${words <= 1 ? 'mot' : 'mots'}`
      const h = `${fmt.format(headings)} ${headings <= 1 ? 'titre' : 'titres'}`
      const t = `${fmt.format(tables)} ${tables <= 1 ? 'tableau' : 'tableaux'}`
      return `${w} · ${h} · ${t}`
    }
  }
}

export function resolveLocaleKey(locale) {
  if (typeof locale !== 'string' || !locale) return 'en'
  if (/^zh/i.test(locale)) return /TW|HK|Hant/i.test(locale) ? 'zh-TW' : 'zh-CN'
  const base = locale.split('-')[0].toLowerCase()
  return Object.hasOwn(dictionaries, base) ? base : 'en'
}

export function readerLabels(locale) {
  const key = resolveLocaleKey(locale)
  return { localeTag: key, ...dictionaries[key] }
}
