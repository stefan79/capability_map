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

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; items: string[] };

const parseBlocks = (markdown?: string): Block[] => {
  if (!markdown) return [];
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = (): void => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flush();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

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
  return blocks;
};

const renderBlocks = (blocks: Block[]): string => {
  const htmlBlocks = blocks.map((block) => {
    if (block.type === 'heading') {
      const headingLevel = Math.min(6, block.level + 2); // keep headings small inside tooltips
      return `<h${headingLevel}>${renderInline(block.text)}</h${headingLevel}>`;
    }
    if (block.type === 'list') {
      const items = block.items.map((item) => `<li>${renderInline(item)}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    const content = block.lines.map((line) => renderInline(line)).join('<br />');
    return `<p>${content}</p>`;
  });
  return htmlBlocks.join('');
};

const extractFirstSection = (blocks: Block[]): Block[] => {
  if (!blocks.length) return [];
  const firstHeadingIndex = blocks.findIndex((b) => b.type === 'heading');
  if (firstHeadingIndex === -1) {
    return blocks.length ? [blocks[0]] : [];
  }
  const firstHeading = blocks[firstHeadingIndex] as Extract<Block, { type: 'heading' }>;
  const section: Block[] = [firstHeading];
  for (let i = firstHeadingIndex + 1; i < blocks.length; i += 1) {
    const next = blocks[i];
    if (next.type === 'heading' && next.level <= firstHeading.level) break;
    section.push(next);
  }
  return section;
};

/**
 * Render full markdown to HTML (headings, paragraphs, and simple unordered lists).
 */
export const renderMarkdown = (markdown?: string): string => renderBlocks(parseBlocks(markdown));

/**
 * Render only the first section (first heading and its content) to HTML.
 */
export const renderMarkdownFirstSection = (markdown?: string): string =>
  renderBlocks(extractFirstSection(parseBlocks(markdown)));
