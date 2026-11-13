export type ExportFormat = 'txt' | 'md' | 'pdf' | 'doc';

export function sanitizeExportFilename(title: string, extension: string): string {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F_-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleaned || 'voicescribe-note'}.${extension}`;
}

export function buildPlainTextContent(title: string, plainText: string): string {
  const trimmedTitle = title.trim();
  const body = plainText.trim();
  if (trimmedTitle && body) {
    return `${trimmedTitle}\n\n${body}\n`;
  }
  if (trimmedTitle) {
    return `${trimmedTitle}\n`;
  }
  return body ? `${body}\n` : '';
}

function decodeBasicEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/**
 * Converts contentEditable HTML + plain fallback into clean Markdown.
 */
export function buildMarkdownContent(title: string, htmlContent: string, plainText: string): string {
  let body = '';

  if (htmlContent && htmlContent.trim()) {
    body = htmlContent
      // Inline formatting first so lists preserve **bold** and *italic*
      .replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, '**$1**')
      .replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, '*$1*')
      // Ordered lists
      .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
        let idx = 1;
        return (
          '\n' +
          inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_lm, item: string) => {
            const cleanItem = decodeBasicEntities(item.replace(/<[^>]+>/g, '').trim());
            return `${idx++}. ${cleanItem}\n`;
          }) +
          '\n'
        );
      })
      // Unordered lists
      .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) => {
        return (
          '\n' +
          inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_lm, item: string) => {
            const cleanItem = decodeBasicEntities(item.replace(/<[^>]+>/g, '').trim());
            return `- ${cleanItem}\n`;
          }) +
          '\n'
        );
      })
      // Block & line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div)>/gi, '\n\n')
      .replace(/<(?:p|div)[^>]*>/gi, '')
      // Strip remaining tags
      .replace(/<[^>]+>/g, '');

    body = decodeBasicEntities(body)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else {
    body = plainText.trim();
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle && body) {
    return `# ${trimmedTitle}\n\n${body}\n`;
  }
  if (trimmedTitle) {
    return `# ${trimmedTitle}\n`;
  }
  return body ? `${body}\n` : '';
}

/**
 * Generates a Word-compatible HTML document (.doc) preserving title and formatting.
 */
export function buildWordDocumentContent(
  title: string,
  htmlContent: string,
  plainText: string
): string {
  const safeTitle = (title.trim() || 'Untitled note')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const bodyHtml =
    htmlContent && htmlContent.trim()
      ? htmlContent
      : plainText
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #0f172a; }
    h1 { font-size: 18pt; margin-bottom: 12pt; color: #0f172a; }
    p { margin: 0 0 10pt 0; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${bodyHtml}
</body>
</html>`;
}

function escapePdfText(str: string): string {
  // PDF Type1 Helvetica supports WinAnsi/ASCII cleanly; replace unsupported non-Latin1 chars gracefully
  const asciiSafe = str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
  return asciiSafe
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxChars: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates a valid multi-page PDF 1.4 binary string (Uint8Array) using standard Helvetica.
 */
export function buildPdfBytes(title: string, plainText: string): Uint8Array {
  const rawParagraphs = plainText.split('\n');
  const wrappedBodyLines: string[] = [];
  for (const para of rawParagraphs) {
    if (para.trim() === '') {
      wrappedBodyLines.push('');
    } else {
      wrappedBodyLines.push(...wrapLine(para.trim(), 82));
    }
  }

  const linesPerPage = 44;
  const pages: { titleLine?: string; lines: string[] }[] = [];
  const trimmedTitle = title.trim();

  if (wrappedBodyLines.length === 0) {
    pages.push({ titleLine: trimmedTitle || 'Untitled note', lines: [] });
  } else {
    let cursor = 0;
    let isFirst = true;
    while (cursor < wrappedBodyLines.length) {
      const cap = isFirst && trimmedTitle ? linesPerPage - 3 : linesPerPage;
      pages.push({
        titleLine: isFirst && trimmedTitle ? trimmedTitle : undefined,
        lines: wrappedBodyLines.slice(cursor, cursor + cap),
      });
      cursor += cap;
      isFirst = false;
    }
  }

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font Regular, 4: Font Bold
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const pageObjIds: number[] = [];
  const baseObjId = 5;
  pages.forEach((_, idx) => {
    pageObjIds.push(baseObjId + idx * 2);
  });

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`
  );
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
  );

  pages.forEach((page, idx) => {
    const pageObjId = baseObjId + idx * 2;
    const contentObjId = pageObjId + 1;

    const commands: string[] = [];
    let y = 742;

    if (page.titleLine) {
      commands.push('BT');
      commands.push('/F2 18 Tf');
      commands.push(`54 ${y} Td`);
      commands.push(`(${escapePdfText(page.titleLine)}) Tj`);
      commands.push('ET');
      y -= 34;
    }

    commands.push('BT');
    commands.push('/F1 11 Tf');
    commands.push(`1 0 0 1 54 ${y} Tm`);
    commands.push('15 TL');
    for (const line of page.lines) {
      commands.push(`(${escapePdfText(line)}) Tj`);
      commands.push('T*');
    }
    commands.push('ET');

    const streamStr = commands.join('\n');
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream\nendobj\n`
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Encode 1:1 as WinAnsi/Latin-1 single bytes so pdf.length matches exact byte offsets
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof window !== 'undefined') {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    URL.revokeObjectURL(url);
  }
}

export function exportDraftAs(
  format: ExportFormat,
  title: string,
  htmlContent: string,
  plainText: string
): void {
  const filename = sanitizeExportFilename(title, format);
  if (format === 'txt') {
    const txt = buildPlainTextContent(title, plainText);
    triggerBlobDownload(new Blob([txt], { type: 'text/plain;charset=utf-8' }), filename);
    return;
  }
  if (format === 'md') {
    const md = buildMarkdownContent(title, htmlContent, plainText);
    triggerBlobDownload(new Blob([md], { type: 'text/markdown;charset=utf-8' }), filename);
    return;
  }
  if (format === 'doc') {
    const docHtml = buildWordDocumentContent(title, htmlContent, plainText);
    triggerBlobDownload(new Blob([docHtml], { type: 'application/msword;charset=utf-8' }), filename);
    return;
  }
  const pdfBytes = buildPdfBytes(title, plainText);
  const buffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  triggerBlobDownload(new Blob([buffer], { type: 'application/pdf' }), filename);
}
