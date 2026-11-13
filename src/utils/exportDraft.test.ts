import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMarkdownContent,
  buildPdfBytes,
  buildPlainTextContent,
  buildWordDocumentContent,
  sanitizeExportFilename,
} from './exportDraft';

test('sanitizeExportFilename formats title safely across extensions', () => {
  assert.equal(sanitizeExportFilename('Q4 Product Sync!', 'txt'), 'q4-product-sync.txt');
  assert.equal(sanitizeExportFilename('Q4 Product Sync!', 'md'), 'q4-product-sync.md');
  assert.equal(sanitizeExportFilename('   ', 'pdf'), 'voicescribe-note.pdf');
  assert.equal(sanitizeExportFilename('Meeting Notes', 'doc'), 'meeting-notes.doc');
});

test('buildPlainTextContent formats title and body cleanly', () => {
  assert.equal(buildPlainTextContent('Sync Notes', 'Line one.'), 'Sync Notes\n\nLine one.\n');
  assert.equal(buildPlainTextContent('', 'Only body'), 'Only body\n');
});

test('buildMarkdownContent converts rich HTML formatting and lists cleanly', () => {
  const md = buildMarkdownContent(
    'Weekly Sync',
    '<p><b>Action</b> items:</p><ul><li>Ship <i>clean</i> UI</li><li>Test export</li></ul>',
    'Action items: Ship clean UI Test export'
  );
  assert.match(md, /^# Weekly Sync\n\n\*\*Action\*\* items:/);
  assert.match(md, /- Ship \*clean\* UI/);
  assert.match(md, /- Test export/);
});

test('buildWordDocumentContent outputs valid Word HTML structure', () => {
  const doc = buildWordDocumentContent('Draft Title', '<p>Hello world</p>', 'Hello world');
  assert.match(doc, /urn:schemas-microsoft-com:office:word/);
  assert.match(doc, /<h1>Draft Title<\/h1>/);
  assert.match(doc, /<p>Hello world<\/p>/);
});

test('buildPdfBytes generates valid PDF 1.4 header, EOF marker, and accurate xref offsets', () => {
  const bytes = buildPdfBytes('Café Notes 98°', 'First line of dictated text.\n\nNaïve résumé check.');
  const decoded = new TextDecoder('latin1').decode(bytes);
  assert.ok(decoded.startsWith('%PDF-1.4\n'));
  assert.ok(decoded.endsWith('%%EOF'));
  assert.match(decoded, /\(Café Notes 98°\) Tj/);
  assert.match(decoded, /\(Naïve résumé check\.\) Tj/);

  // Ensure startxref offset actually points to "xref\n" in raw byte stream
  const startXrefMatch = decoded.match(/startxref\n(\d+)\n%%EOF$/);
  assert.ok(startXrefMatch);
  const xrefPos = Number(startXrefMatch[1]);
  assert.equal(decoded.slice(xrefPos, xrefPos + 5), 'xref\n');
});
