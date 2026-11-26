const labels = {
  en: {
    previous: 'Previous page', next: 'Next page', page: 'Page', zoom: 'Zoom', width: 'Fit width', fit: 'Fit page',
    opening: 'Opening PDF…', drawing: 'Loading page…', unreadable: 'Can’t read this PDF. Reopen the file to try again.',
    invalid: 'This file could not be opened as a PDF.', empty: 'This PDF is empty.',
    locked: 'This PDF is password-protected.', pageError: 'This page could not be displayed.'
  },
  'zh-CN': {
    previous: '上一页', next: '下一页', page: '页码', zoom: '缩放', width: '适合宽度', fit: '适合整页',
    opening: '正在打开 PDF…', drawing: '正在加载页面…', unreadable: '无法读取此 PDF。请重新打开文件再试。',
    invalid: '此文件不是可读取的 PDF。', empty: '此 PDF 为空。', locked: '此 PDF 受密码保护。', pageError: '无法显示此页。'
  },
  'zh-TW': {
    previous: '上一頁', next: '下一頁', page: '頁碼', zoom: '縮放', width: '符合寬度', fit: '符合整頁',
    opening: '正在開啟 PDF…', drawing: '正在載入頁面…', unreadable: '無法讀取此 PDF。請重新開啟檔案再試一次。',
    invalid: '此檔案不是可讀取的 PDF。', empty: '此 PDF 為空。', locked: '此 PDF 受密碼保護。', pageError: '無法顯示此頁。'
  },
  fr: {
    previous: 'Page précédente', next: 'Page suivante', page: 'Page', zoom: 'Zoom', width: 'Ajuster à la largeur', fit: 'Page entière',
    opening: 'Ouverture du PDF…', drawing: 'Chargement de la page…', unreadable: 'Lecture impossible. Rouvrez le fichier pour réessayer.',
    invalid: 'Impossible d’ouvrir ce fichier PDF.', empty: 'Ce PDF est vide.', locked: 'Ce PDF est protégé par un mot de passe.', pageError: 'Impossible d’afficher cette page.'
  },
  ja: {
    previous: '前のページ', next: '次のページ', page: 'ページ', zoom: 'ズーム', width: '幅に合わせる', fit: 'ページ全体',
    opening: 'PDF を開いています…', drawing: 'ページを読み込み中…', unreadable: 'PDF を読み込めません。ファイルを開き直してください。',
    invalid: 'このファイルは PDF として開けません。', empty: 'この PDF は空です。', locked: 'この PDF はパスワードで保護されています。', pageError: 'このページは表示できません。'
  }
}

export function readerLabels(locale) {
  if (/^zh/i.test(locale)) return labels[/TW|HK|Hant/i.test(locale) ? 'zh-TW' : 'zh-CN']
  return labels[locale?.split('-')[0]] || labels.en
}
