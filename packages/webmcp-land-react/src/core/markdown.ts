export function renderMarkdown(text: string, enableCodeCopy = true): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks — with optional copy button
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? `<span class="wmcp-code-lang">${lang}</span>` : ''
    const copyBtn = enableCodeCopy
      ? `<button class="wmcp-code-copy-btn" data-code="${encodeURIComponent(code.trimEnd())}" aria-label="Copy code" title="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>`
      : ''
    const header = (langLabel || copyBtn) ? `<div class="wmcp-code-header">${langLabel}${copyBtn}</div>` : ''
    return `<div class="wmcp-codeblock-wrapper">${header}<pre class="wmcp-codeblock"><code>${code.trimEnd()}</code></pre></div>`
  })

  const parts = html.split(/(<div class="wmcp-codeblock-wrapper">[\s\S]*?<\/div>)/)
  html = parts
    .map((part) => {
      if (part.startsWith('<div class="wmcp-codeblock-wrapper">')) return part

      // Inline code
      part = part.replace(/`([^`]+)`/g, '<code class="wmcp-inline-code">$1</code>')
      // Bold
      part = part.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      part = part.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      // Strikethrough
      part = part.replace(/~~(.+?)~~/g, '<del>$1</del>')
      // Headings
      part = part.replace(/^(#{1,3})\s+(.+)$/gm, (_, hashes, text) => {
        const level = hashes.length
        return `<h${level} class="wmcp-heading">${text}</h${level}>`
      })
      // Unordered lists
      part = part.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
      part = part.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="wmcp-list">$1</ul>')
      // Ordered lists
      part = part.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      // Links
      part = part.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a class="wmcp-link" href="$2" target="_blank" rel="noopener">$1</a>'
      )
      // Paragraphs
      part = part.replace(/\n{2,}/g, '</p><p>')

      return part
    })
    .join('')

  return html
}
