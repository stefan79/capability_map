const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderInline = (text: string): string => {
  let html = escapeHtml(text);
  // Bold (**strong**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (*emphasis*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
};

/**
 * Minimal markdown renderer for capability descriptions.
 * Supports paragraphs, line breaks, and simple unordered lists.
 * HTML is escaped before formatting to avoid injection.
 */
export const renderMarkdown = (markdown?: string): string => {
  if (!markdown) return '';

  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  type Block = { type: 'paragraph'; lines: string[] } | { type: 'list'; items: string[] };
  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = (): void => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isListItem = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    if (!trimmed) {
      flush();
      continue;
    }

    if (isListItem) {
      if (!current || current.type !== 'list') {
        flush();
        current = { type: 'list', items: [] };
      }
      const item = trimmed.replace(/^[-*]\s*/, '');
      current.items.push(item);
      continue;
    }

    if (!current || current.type !== 'paragraph') {
      flush();
      current = { type: 'paragraph', lines: [] };
    }
    current.lines.push(line);
  }
  flush();

  const htmlBlocks = blocks.map((block) => {
    if (block.type === 'list') {
      const items = block.items.map((item) => `<li>${renderInline(item)}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    const content = block.lines.map((line) => renderInline(line)).join('<br />');
    return `<p>${content}</p>`;
  });

  return htmlBlocks.join('');
};
