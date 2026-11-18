import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeWriting,
  applySingleFix,
  applyAllImprovements,
  adjustTone,
} from './writingIntelligence';

test('analyzeWriting flags correctness slips (subject-verb, homophones, contractions)', () => {
  const sample = 'They was going there. Dont worry about its cover.';
  const report = analyzeWriting(sample);
  
  assert.ok(report.issues.length >= 2);
  const categories = report.issues.map((i) => i.category);
  assert.ok(categories.includes('correctness'));

  const fixed = applyAllImprovements(sample, report.issues);
  assert.ok(fixed.includes('They were'));
  assert.ok(fixed.includes("Don't"));
});

test('analyzeWriting trims wordy phrases (Clarity & Conciseness)', () => {
  const sample = 'We did this in order to make a decision due to the fact that time was short.';
  const report = analyzeWriting(sample);

  const clarityIssues = report.issues.filter((i) => i.category === 'clarity');
  assert.ok(clarityIssues.length >= 2);

  const fixed = applyAllImprovements(sample, report.issues);
  assert.ok(fixed.includes('to decide because'));
});

test('analyzeWriting detects and removes AI clichés and em dashes (Anti-AI Guardian)', () => {
  const sample = 'We must delve into the rich tapestry of life — without further ado.';
  const report = analyzeWriting(sample);

  const antiAiIssues = report.issues.filter((i) => i.category === 'anti-ai');
  assert.ok(antiAiIssues.length >= 2);

  const fixed = applyAllImprovements(sample, report.issues);
  assert.ok(!fixed.includes('delve into'));
  assert.ok(!fixed.includes('—'));
});

test('applySingleFix updates only target issue correctly', () => {
  const text = 'I want to utilize this tool.';
  const report = analyzeWriting(text);
  const issue = report.issues.find((i) => i.original.toLowerCase() === 'utilize')!;

  const fixed = applySingleFix(text, issue);
  assert.equal(fixed, 'I want to use this tool.');
});

test('adjustTone applies tone transformation correctly', () => {
  const raw = 'We really need this in order to succeed ASAP — thanks.';
  const direct = adjustTone(raw, 'direct');
  assert.ok(!direct.includes('really'));
  assert.ok(direct.includes('to succeed'));
  assert.ok(!direct.includes('—'));
});

test('analyzeWriting detects spelling slips from phonetic dictionary and grammar idioms', () => {
  const text = 'We was very good at teh office.';
  const report = analyzeWriting(text);
  assert.ok(report.issues.length >= 3);
});

test('analyzeWriting analyzes Hindi Devanagari grammar, clarity, and Anti-AI clichés', () => {
  const hindiText = 'हम वहाँ जा रहे थे क्युकि समय कम था । यह बहुत अच्छा प्रयास है और हमे समृद्ध ताने-बाने को बिना किसी देरी के समझना चाहिए।';
  const report = analyzeWriting(hindiText, 'hi-IN');
  assert.ok(report.issues.length >= 4);

  const categories = report.issues.map((i) => i.category);
  assert.ok(categories.includes('correctness'));
  assert.ok(categories.includes('anti-ai'));
  assert.ok(categories.includes('engagement'));

  const fixed = applyAllImprovements(hindiText, report.issues);
  assert.ok(fixed.includes('क्योंकि'));
  assert.ok(fixed.includes('उत्कृष्ट'));
  assert.ok(fixed.includes('विविधता'));
  assert.ok(fixed.includes('अब'));
});

test('analyzeWriting analyzes Spanish clarity and Anti-AI clichés', () => {
  const spanishText = 'Nosotros trabajamos con el fin de avanzar en el rico tapiz sin más preámbulos.';
  const report = analyzeWriting(spanishText, 'es-ES');
  assert.ok(report.issues.length >= 3);

  const fixed = applyAllImprovements(spanishText, report.issues);
  assert.ok(fixed.includes('para'));
  assert.ok(fixed.includes('gran diversidad'));
  assert.ok(fixed.includes('ahora'));
});
