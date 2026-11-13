import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendDraftVersion,
  MAX_DRAFT_VERSIONS,
  shouldRecordAutosaveVersion,
} from './versionHistory';

test('appendDraftVersion skips empty drafts and deduplicates identical consecutive states', () => {
  const emptyResult = appendDraftVersion([], { id: 'n1', title: ' ', content: '', htmlContent: '' });
  assert.equal(emptyResult.length, 0);

  const first = appendDraftVersion(
    [],
    { id: 'n1', title: 'Notes', content: 'Hello world', htmlContent: '<p>Hello world</p>' },
    { source: 'manual', now: 1000 }
  );
  assert.equal(first.length, 1);
  assert.equal(first[0].wordCount, 2);
  assert.equal(first[0].source, 'manual');

  const dup = appendDraftVersion(
    first,
    { id: 'n1', title: 'Notes', content: 'Hello world', htmlContent: '<p>Hello world</p>' },
    { source: 'autosave', now: 2000 }
  );
  assert.equal(dup.length, 1);
});

test('appendDraftVersion keeps only the latest 5 saves in newest-first order', () => {
  let history = [] as ReturnType<typeof appendDraftVersion>;
  for (let i = 1; i <= 7; i++) {
    history = appendDraftVersion(
      history,
      { id: 'n1', title: `Draft ${i}`, content: `Version ${i} content`, htmlContent: `Version ${i} content` },
      { source: 'manual', now: i * 1000 }
    );
  }
  assert.equal(history.length, MAX_DRAFT_VERSIONS);
  assert.equal(history[0].title, 'Draft 7');
  assert.equal(history[4].title, 'Draft 3');
});

test('shouldRecordAutosaveVersion throttles tiny edits within 12s while capturing meaningful changes', () => {
  const latest = appendDraftVersion(
    [],
    { id: 'n1', title: 'T', content: 'Initial text', htmlContent: 'Initial text' },
    { source: 'autosave', now: 10000 }
  )[0];

  assert.equal(
    shouldRecordAutosaveVersion(
      latest,
      { id: 'n1', title: 'T', content: 'Initial text!', htmlContent: 'Initial text!' },
      12000
    ),
    false
  );

  assert.equal(
    shouldRecordAutosaveVersion(
      latest,
      {
        id: 'n1',
        title: 'T',
        content: 'Initial text with a full additional sentence appended.',
        htmlContent: 'Initial text with a full additional sentence appended.',
      },
      12000
    ),
    true
  );

  assert.equal(
    shouldRecordAutosaveVersion(
      latest,
      { id: 'n1', title: 'T', content: 'Initial text!', htmlContent: 'Initial text!' },
      25000
    ),
    true
  );
});
