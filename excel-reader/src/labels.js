const LABELS = {
  en: {
    filterPlaceholder: 'Filter rows…',
    filterAriaLabel: 'Filter rows',
    clearFilter: 'Clear filter',
    rows: 'rows',
    rowSingular: 'row',
    of: 'of',
    cols: 'cols',
    colSingular: 'col',
    headerRow: 'Header row',
    headerRowTitle: 'Use first row as column headers',
    wrap: 'Wrap',
    wrapTitle: 'Wrap cell text',
    clearSort: 'Clear sort',
    clearSortColumn: column => `Clear sort (${column})`,
    formula: 'Formula',
    value: 'Value',
    selectCell: 'Select a cell to inspect its formula or value',
    emptySheet: 'Empty sheet',
    emptyWorkbook: 'This workbook has no sheets.',
    loadMoreRows: (remainingText, batchText, remaining, batch) =>
      remaining > batch
        ? `Load more rows (+${batchText}, ${remainingText} remaining)`
        : `Load more rows (${remainingText} remaining)`,
    noMatchingRows: 'No matching rows',
    sheets: 'Sheets',
    opening: 'Opening workbook…',
    tooLargeBytes: 'This workbook exceeds the 32 MiB size limit.',
    openFailed: 'Could not open this workbook. It may be corrupted, password-protected, or unsupported.',
    boundedNotice: (rows, cols) => `Display bounded to ${rows} rows × ${cols} columns.`
  },
  'zh-CN': {
    filterPlaceholder: '筛选行…',
    filterAriaLabel: '筛选行',
    clearFilter: '清除筛选',
    rows: '行',
    rowSingular: '行',
    of: '/',
    cols: '列',
    colSingular: '列',
    headerRow: '首行标题',
    headerRowTitle: '将第一行作为列标题',
    wrap: '自动换行',
    wrapTitle: '单元格自动换行',
    clearSort: '清除排序',
    clearSortColumn: column => `清除按“${column}”排序`,
    formula: '公式',
    value: '值',
    selectCell: '选择一个单元格以查看公式或内容',
    emptySheet: '空工作表',
    emptyWorkbook: '此工作簿没有工作表。',
    loadMoreRows: (remainingText, batchText, remaining, batch) =>
      remaining > batch
        ? `加载更多行（+${batchText}，剩余 ${remainingText} 行）`
        : `加载更多行（剩余 ${remainingText} 行）`,
    noMatchingRows: '没有匹配的行',
    sheets: '工作表',
    opening: '正在打开工作簿…',
    tooLargeBytes: '此工作簿超过 32 MiB 大小限制。',
    openFailed: '无法打开此工作簿。文件可能已损坏、受密码保护或不受支持。',
    boundedNotice: (rows, cols) => `显示范围已限制为 ${rows} 行 × ${cols} 列。`
  },
  'zh-TW': {
    filterPlaceholder: '篩選列…',
    filterAriaLabel: '篩選列',
    clearFilter: '清除篩選',
    rows: '列',
    rowSingular: '列',
    of: '/',
    cols: '欄',
    colSingular: '欄',
    headerRow: '首列標題',
    headerRowTitle: '將第一列作為欄位標題',
    wrap: '自動換行',
    wrapTitle: '儲存格自動換行',
    clearSort: '清除排序',
    clearSortColumn: column => `清除依「${column}」排序`,
    formula: '公式',
    value: '值',
    selectCell: '選取儲存格以檢視公式或內容',
    emptySheet: '空白工作表',
    emptyWorkbook: '此活頁簿沒有工作表。',
    loadMoreRows: (remainingText, batchText, remaining, batch) =>
      remaining > batch
        ? `載入更多列（+${batchText}，尚餘 ${remainingText} 列）`
        : `載入更多列（尚餘 ${remainingText} 列）`,
    noMatchingRows: '沒有符合的列',
    sheets: '工作表',
    opening: '正在開啟活頁簿…',
    tooLargeBytes: '此活頁簿超過 32 MiB 大小限制。',
    openFailed: '無法開啟此活頁簿。檔案可能已損毀、受密碼保護或不支援。',
    boundedNotice: (rows, cols) => `顯示範圍已限制為 ${rows} 列 × ${cols} 欄。`
  },
  ja: {
    filterPlaceholder: '行を絞り込む…',
    filterAriaLabel: '行を絞り込む',
    clearFilter: '絞り込みを解除',
    rows: '行',
    rowSingular: '行',
    of: '/',
    cols: '列',
    colSingular: '列',
    headerRow: '見出し行',
    headerRowTitle: '先頭行を列見出しとして扱う',
    wrap: '折り返し',
    wrapTitle: 'セル内のテキストを折り返す',
    clearSort: '並び替えを解除',
    clearSortColumn: column => `「${column}」の並び替えを解除`,
    formula: '数式',
    value: '値',
    selectCell: 'セルを選択して数式や値を確認',
    emptySheet: '空のシート',
    emptyWorkbook: 'このブックにはシートがありません。',
    loadMoreRows: (remainingText, batchText, remaining, batch) =>
      remaining > batch
        ? `さらに読み込む（+${batchText}、残り ${remainingText} 行）`
        : `さらに読み込む（残り ${remainingText} 行）`,
    noMatchingRows: '一致する行がありません',
    sheets: 'シート',
    opening: 'ブックを開いています…',
    tooLargeBytes: 'このブックは 32 MiB の上限を超えています。',
    openFailed: 'ブックを開けませんでした。破損しているか、パスワード保護または非対応の形式です。',
    boundedNotice: (rows, cols) => `表示は最大 ${rows} 行 × ${cols} 列に制限されています。`
  },
  fr: {
    filterPlaceholder: 'Filtrer les lignes…',
    filterAriaLabel: 'Filtrer les lignes',
    clearFilter: 'Effacer le filtre',
    rows: 'lignes',
    rowSingular: 'ligne',
    of: 'sur',
    cols: 'cols',
    colSingular: 'col',
    headerRow: 'Ligne d’en-tête',
    headerRowTitle: 'Utiliser la première ligne comme en-têtes',
    wrap: 'Renvoyer',
    wrapTitle: 'Renvoyer le texte à la ligne',
    clearSort: 'Effacer le tri',
    clearSortColumn: column => `Effacer le tri (${column})`,
    formula: 'Formule',
    value: 'Valeur',
    selectCell: 'Sélectionnez une cellule pour inspecter sa formule ou valeur',
    emptySheet: 'Feuille vide',
    emptyWorkbook: 'Ce classeur ne contient aucune feuille.',
    loadMoreRows: (remainingText, batchText, remaining, batch) =>
      remaining > batch
        ? `Charger plus de lignes (+${batchText}, ${remainingText} restantes)`
        : `Charger plus de lignes (${remainingText} restantes)`,
    noMatchingRows: 'Aucune ligne correspondante',
    sheets: 'Feuilles',
    opening: 'Ouverture du classeur…',
    tooLargeBytes: 'Ce classeur dépasse la limite de 32 Mio.',
    openFailed: 'Impossible d’ouvrir ce classeur. Il est peut-être corrompu, chiffré ou non pris en charge.',
    boundedNotice: (rows, cols) => `Affichage limité à ${rows} lignes × ${cols} colonnes.`
  }
}

export function resolveLocale(locale) {
  if (!locale || typeof locale !== 'string') return 'en'
  if (/^zh/iu.test(locale)) return /TW|HK|MO|Hant/iu.test(locale) ? 'zh-TW' : 'zh-CN'
  const base = locale.split('-')[0]?.toLowerCase()
  if (base === 'ja' || base === 'fr') return base
  return 'en'
}

export function excelLabels(locale) {
  return LABELS[resolveLocale(locale)]
}
