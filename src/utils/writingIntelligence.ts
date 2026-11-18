/**
 * VoiceScribe Writing Intelligence Suite
 * Advanced Grammar, Clarity, Vocabulary & Anti-AI-Slop Engine
 * Implements Grammarly Premium-grade text analysis, clarity rephrasing,
 * and human authenticity protection without robotic AI clichés.
 */

import { PHONETIC_TYPOS, PROPER_NOUN_CASING } from './autoCorrect';

export type IssueCategory = 'correctness' | 'clarity' | 'engagement' | 'anti-ai';

export interface WritingIssue {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  original: string;
  replacement: string;
  context: string;
  index: number;
}

export interface WritingScore {
  overall: number; // 0-100
  correctness: number;
  clarity: number;
  engagement: number;
  delivery: number;
  detectedTone: string;
  issues: WritingIssue[];
}

// 1. Correctness: Grammar, Homophones, Redundant words, Punctuation
interface RulePattern {
  regex: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  title: string;
  description: string;
  category: IssueCategory;
}

const CORRECTNESS_RULES: RulePattern[] = [
  // Subject-verb agreement & common grammatical slips
  {
    regex: /\b(they|we|you)\s+was\b/gi,
    replacement: '$1 were',
    title: 'Subject-Verb Agreement',
    description: 'Use "were" with plural pronouns (they, we, you).',
    category: 'correctness',
  },
  {
    regex: /\b(he|she|it)\s+have\b/gi,
    replacement: '$1 has',
    title: 'Subject-Verb Agreement',
    description: 'Use "has" with third-person singular subjects (he, she, it).',
    category: 'correctness',
  },
  {
    regex: /\b(he|she|it)\s+dont\b/gi,
    replacement: "$1 doesn't",
    title: 'Grammatical Concord',
    description: 'Use "doesn\'t" instead of "don\'t" with singular subjects.',
    category: 'correctness',
  },
  {
    regex: /\b(should|could|would)\s+of\b/gi,
    replacement: '$1 have',
    title: 'Grammar Slip',
    description: 'Did you mean "$1 have" instead of "$1 of"?',
    category: 'correctness',
  },

  // Homophone Confusions
  {
    regex: /\b(their)\s+(is|are|was|were)\b/gi,
    replacement: 'there $2',
    title: 'Confused Homophone',
    description: '"There" indicates location or existence, while "their" indicates possession.',
    category: 'correctness',
  },
  {
    regex: /\b(your)\s+(welcome|right|wrong|mistaken|correct)\b/gi,
    replacement: "you're $2",
    title: 'Missing Contraction',
    description: 'Use "you\'re" (you are) instead of the possessive "your".',
    category: 'correctness',
  },
  {
    regex: /\bits\s+(a|an|the|my|your|not|essential|important|crucial|clear|obvious)\b/gi,
    replacement: "it's $1",
    title: 'Contraction vs Possessive',
    description: 'Use "it\'s" as a contraction for "it is".',
    category: 'correctness',
  },
  {
    regex: /\b(then)\s+(him|her|me|us|them|any other|anyone|anybody)\b/gi,
    replacement: 'than $2',
    title: 'Comparison Slip',
    description: 'Use "than" for comparisons and "then" for time sequences.',
    category: 'correctness',
  },
  {
    regex: /\b(effect)\s+the\s+(outcome|result|decision|process|performance)\b/gi,
    replacement: 'affect the $2',
    title: 'Affect vs Effect',
    description: '"Affect" is typically a verb, while "effect" is typically a noun.',
    category: 'correctness',
  },

  // Double words / Stutter
  {
    regex: /\b(the|and|in|of|to|is|that)\s+\1\b/gi,
    replacement: '$1',
    title: 'Repeated Word',
    description: 'Duplicate consecutive word detected.',
    category: 'correctness',
  },

  // Missing Contraction Apostrophes
  {
    regex: /\b(cant|dont|wont|didnt|couldnt|shouldnt|wouldnt|hasnt|havent|isnt|arent)\b/gi,
    replacement: (match: string) => {
      const lower = match.toLowerCase();
      const map: Record<string, string> = {
        cant: "can't",
        dont: "don't",
        wont: "won't",
        didnt: "didn't",
        couldnt: "couldn't",
        shouldnt: "shouldn't",
        wouldnt: "wouldn't",
        hasnt: "hasn't",
        havent: "haven't",
        isnt: "isn't",
        arent: "aren't",
      };
      const res = map[lower] || match;
      return match[0] === match[0].toUpperCase()
        ? res[0].toUpperCase() + res.slice(1)
        : res;
    },
    title: 'Missing Apostrophe',
    description: 'Add an apostrophe to form standard contractions.',
    category: 'correctness',
  },

  // Past tense with auxiliary "did"
  {
    regex: /\b(did|didn't|did not)\s+went\b/gi,
    replacement: '$1 go',
    title: 'Double Past Tense',
    description: 'Use the base form of the verb ("go") after "did".',
    category: 'correctness',
  },
  {
    regex: /\b(did|didn't|did not)\s+saw\b/gi,
    replacement: '$1 see',
    title: 'Double Past Tense',
    description: 'Use the base form of the verb ("see") after "did".',
    category: 'correctness',
  },
  {
    regex: /\b(did|didn't|did not)\s+had\b/gi,
    replacement: '$1 have',
    title: 'Double Past Tense',
    description: 'Use the base form ("have") after "did".',
    category: 'correctness',
  },
  {
    regex: /\b(did|didn't|did not)\s+came\b/gi,
    replacement: '$1 come',
    title: 'Double Past Tense',
    description: 'Use the base form ("come") after "did".',
    category: 'correctness',
  },
  {
    regex: /\b(did|didn't|did not)\s+knew\b/gi,
    replacement: '$1 know',
    title: 'Double Past Tense',
    description: 'Use the base form ("know") after "did".',
    category: 'correctness',
  },
  {
    regex: /\b(does|doesn't|does not)\s+knows\b/gi,
    replacement: '$1 know',
    title: 'Subject-Verb Agreement',
    description: 'Use the base form ("know") after "does".',
    category: 'correctness',
  },
  {
    regex: /\b(does|doesn't|does not)\s+has\b/gi,
    replacement: '$1 have',
    title: 'Subject-Verb Agreement',
    description: 'Use the base form ("have") after "does".',
    category: 'correctness',
  },
  // Indian English & common dictation slips
  {
    regex: /\b(i|I)\s+(am\s+agree|'m\s+agree)\b/g,
    replacement: 'I agree',
    title: 'Grammar Concord',
    description: 'Use "I agree" rather than "I am agree".',
    category: 'correctness',
  },
  {
    regex: /\b(more\s+better)\b/gi,
    replacement: 'better',
    title: 'Double Comparative',
    description: '"Better" is already comparative; omit "more".',
    category: 'correctness',
  },
  {
    regex: /\b(most\s+best)\b/gi,
    replacement: 'best',
    title: 'Double Superlative',
    description: '"Best" is already superlative; omit "most".',
    category: 'correctness',
  },
  {
    regex: /\b(revert\s+back)\b/gi,
    replacement: 'reply',
    title: 'Redundant Phrase',
    description: 'Use "reply" or "respond" instead of "revert back".',
    category: 'correctness',
  },
  {
    regex: /\b(discuss\s+about)\b/gi,
    replacement: 'discuss',
    title: 'Redundant Preposition',
    description: '"Discuss" does not require the preposition "about".',
    category: 'correctness',
  },
  {
    regex: /\b(order\s+for)\s+(food|coffee|items|tea|lunch)\b/gi,
    replacement: 'order $1',
    title: 'Redundant Preposition',
    description: 'Use "order" directly without "for".',
    category: 'correctness',
  },
  {
    regex: /\b(cope\s+up\s+with)\b/gi,
    replacement: 'cope with',
    title: 'Idiomatic Preposition',
    description: 'The standard idiom is "cope with", not "cope up with".',
    category: 'correctness',
  },
  {
    regex: /\b(each\s+of\s+them)\s+were\b/gi,
    replacement: '$1 was',
    title: 'Subject-Verb Agreement',
    description: '"Each" is singular and takes the singular verb "was".',
    category: 'correctness',
  },
  // Capitalization of standalone pronoun "i"
  {
    regex: /\bi\b/g,
    replacement: 'I',
    title: 'Capitalization',
    description: 'The personal pronoun "I" should always be capitalized.',
    category: 'correctness',
  },
  // Spacing before punctuation
  {
    regex: /\s+([,.?!;:])(?=\s|$)/g,
    replacement: '$1',
    title: 'Punctuation Spacing',
    description: 'Remove redundant whitespace immediately before punctuation marks.',
    category: 'correctness',
  },
];

// 2. Clarity & Conciseness (Grammarly's Top Paid Feature)
const CLARITY_RULES: RulePattern[] = [
  {
    regex: /\bin order to\b/gi,
    replacement: 'to',
    title: 'Conciseness',
    description: 'Simplify "in order to" to the direct, punchy "to".',
    category: 'clarity',
  },
  {
    regex: /\bdue to the fact that\b/gi,
    replacement: 'because',
    title: 'Trim Wordiness',
    description: 'Replace wordy clause with "because".',
    category: 'clarity',
  },
  {
    regex: /\bat (this|the) (present )?(point in time|moment in time)\b/gi,
    replacement: 'now',
    title: 'Conciseness',
    description: 'Simplify to "now" or "currently".',
    category: 'clarity',
  },
  {
    regex: /\bfor the purpose of\b/gi,
    replacement: 'for',
    title: 'Wordy Phrase',
    description: 'Simplify "for the purpose of" to "for" or "to".',
    category: 'clarity',
  },
  {
    regex: /\bhas the ability to\b/gi,
    replacement: 'can',
    title: 'Direct Verb',
    description: 'Replace "has the ability to" with "can".',
    category: 'clarity',
  },
  {
    regex: /\bis able to\b/gi,
    replacement: 'can',
    title: 'Direct Verb',
    description: 'Replace "is able to" with "can".',
    category: 'clarity',
  },
  {
    regex: /\btake into consideration\b/gi,
    replacement: 'consider',
    title: 'Action Verb',
    description: 'Use the strong action verb "consider".',
    category: 'clarity',
  },
  {
    regex: /\bmake a decision\b/gi,
    replacement: 'decide',
    title: 'Strong Verb',
    description: 'Replace nominalization with "decide".',
    category: 'clarity',
  },
  {
    regex: /\breach an agreement\b/gi,
    replacement: 'agree',
    title: 'Direct Verb',
    description: 'Simplify to "agree".',
    category: 'clarity',
  },
  {
    regex: /\bin the event that\b/gi,
    replacement: 'if',
    title: 'Conciseness',
    description: 'Replace with "if".',
    category: 'clarity',
  },
  {
    regex: /\ba large number of\b/gi,
    replacement: 'many',
    title: 'Trim Wordiness',
    description: 'Simplify to "many".',
    category: 'clarity',
  },
  {
    regex: /\ba large amount of\b/gi,
    replacement: 'much',
    title: 'Trim Wordiness',
    description: 'Simplify to "much".',
    category: 'clarity',
  },
  {
    regex: /\bin spite of the fact that\b/gi,
    replacement: 'although',
    title: 'Conciseness',
    description: 'Replace with "although".',
    category: 'clarity',
  },
  {
    regex: /\butilize(d|s|ing)?\b/gi,
    replacement: (match: string) => {
      const lower = match.toLowerCase();
      const map: Record<string, string> = {
        utilize: 'use',
        utilized: 'used',
        utilizes: 'uses',
        utilizing: 'using',
      };
      const res = map[lower] || 'use';
      return match[0] === match[0].toUpperCase() ? res[0].toUpperCase() + res.slice(1) : res;
    },
    title: 'Plain Language',
    description: '"Use" is clearer and less pretentious than "utilize".',
    category: 'clarity',
  },
  {
    regex: /\bprior to\b/gi,
    replacement: 'before',
    title: 'Conciseness',
    description: 'Replace "prior to" with "before".',
    category: 'clarity',
  },
  {
    regex: /\bsubsequent to\b/gi,
    replacement: 'after',
    title: 'Conciseness',
    description: 'Replace "subsequent to" with "after".',
    category: 'clarity',
  },
];

// 3. Engagement & Vocabulary Upgrades (Grammarly Premium)
const ENGAGEMENT_RULES: RulePattern[] = [
  {
    regex: /\bvery good\b/gi,
    replacement: 'exceptional',
    title: 'Vibrant Vocabulary',
    description: 'Upgrade weak intensifier "very good" to "exceptional" or "superb".',
    category: 'engagement',
  },
  {
    regex: /\bvery bad\b/gi,
    replacement: 'detrimental',
    title: 'Strong Vocabulary',
    description: 'Upgrade "very bad" to "detrimental" or "flawed".',
    category: 'engagement',
  },
  {
    regex: /\bvery big\b/gi,
    replacement: 'substantial',
    title: 'Vivid Vocabulary',
    description: 'Upgrade "very big" to "substantial" or "immense".',
    category: 'engagement',
  },
  {
    regex: /\bvery small\b/gi,
    replacement: 'minimal',
    title: 'Precise Vocabulary',
    description: 'Upgrade "very small" to "minimal" or "negligible".',
    category: 'engagement',
  },
  {
    regex: /\bvery important\b/gi,
    replacement: 'crucial',
    title: 'Impactful Word Choice',
    description: 'Upgrade "very important" to "crucial", "vital", or "pivotal".',
    category: 'engagement',
  },
  {
    regex: /\bvery hard\b/gi,
    replacement: 'demanding',
    title: 'Stronger Adjective',
    description: 'Upgrade "very hard" to "demanding" or "rigorous".',
    category: 'engagement',
  },
  {
    regex: /\bvery easy\b/gi,
    replacement: 'straightforward',
    title: 'Professional Vocabulary',
    description: 'Upgrade "very easy" to "straightforward" or "effortless".',
    category: 'engagement',
  },
];

// 4. Human Authenticity & Anti-AI Guardian (Specifically Requested)
// Eliminates repetitive em-dashes and stereotypical AI detector trigger words.
const ANTI_AI_RULES: RulePattern[] = [
  // Em Dash normalization (Signature AI giveaway)
  {
    regex: /\s*—\s*/g,
    replacement: ', ',
    title: 'Remove Excessive Em-Dash',
    description: 'Frequent em-dashes (—) trigger AI detection classifiers. Replace with natural punctuation.',
    category: 'anti-ai',
  },
  {
    regex: /\s*--\s*/g,
    replacement: ', ',
    title: 'Normalize Double-Hyphen',
    description: 'Replace double hyphens with clean natural commas or sentence stops.',
    category: 'anti-ai',
  },

  // AI Cliche & Synthetic Buzzwords
  {
    regex: /\bdelve(s|d|ing)?\s+into\b/gi,
    replacement: 'examine',
    title: 'AI Detector Trigger Phrase',
    description: '"Delve into" is an overused AI signature phrase. Replace with "explore", "examine", or "study".',
    category: 'anti-ai',
  },
  {
    regex: /\b(rich\s+)?tapestry\s+of\b/gi,
    replacement: 'variety of',
    title: 'AI Cliché Word',
    description: '"Tapestry of" is heavily flagged by AI classifiers. Use "variety of" or "blend of".',
    category: 'anti-ai',
  },
  {
    regex: /\ba\s+testament\s+to\b/gi,
    replacement: 'evidence of',
    title: 'AI Cliché Phrase',
    description: 'Replace artificial phrase "a testament to" with "evidence of" or "proof of".',
    category: 'anti-ai',
  },
  {
    regex: /\bbeacon\s+of\s+hope\b/gi,
    replacement: 'encouraging example',
    title: 'Melodramatic AI Cliché',
    description: 'Replace "beacon of hope" with more authentic, grounded language.',
    category: 'anti-ai',
  },
  {
    regex: /\bin\s+today'?s\s+(fast-paced\s+)?(digital\s+)?(world|era|landscape)\b/gi,
    replacement: 'today',
    title: 'Tired AI Introduction',
    description: 'Cut filler opening phrase. Get straight to the point with "today" or "currently".',
    category: 'anti-ai',
  },
  {
    regex: /\bwithout\s+further\s+ado\b/gi,
    replacement: 'now',
    title: 'Filler Transition',
    description: 'Remove robotic filler phrase "without further ado".',
    category: 'anti-ai',
  },
  {
    regex: /\bit\s+is\s+worth\s+noting\s+that\b/gi,
    replacement: 'notably',
    title: 'Wordy AI Buffer',
    description: 'Simplify to "notably" or state the fact directly.',
    category: 'anti-ai',
  },
  {
    regex: /\bin\s+conclusion,?\s+(it\s+is\s+(important|crucial|essential)\s+to\s+remember\s+that)?/gi,
    replacement: 'in summary,',
    title: 'Robotic Essay Closer',
    description: 'Avoid repetitive AI concluding formula.',
    category: 'anti-ai',
  },
  {
    regex: /\bharness(ing)?\s+the\s+power\s+of\b/gi,
    replacement: 'using',
    title: 'AI Marketing Fluff',
    description: 'Replace "harnessing the power of" with direct verbs like "using" or "leveraging".',
    category: 'anti-ai',
  },
];

const ALL_RULES = [...CORRECTNESS_RULES, ...CLARITY_RULES, ...ENGAGEMENT_RULES, ...ANTI_AI_RULES];

/**
 * Scans text and generates full Grammarly-grade issue reports and score.
 */
export function analyzeWriting(text: string): WritingScore {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      overall: 100,
      correctness: 100,
      clarity: 100,
      engagement: 100,
      delivery: 100,
      detectedTone: 'Neutral',
      issues: [],
    };
  }

  const issues: WritingIssue[] = [];
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let issueCounter = 0;

  for (const rule of ALL_RULES) {
    const flags = rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g';
    const safeRegex = new RegExp(rule.regex.source, flags);
    const matches = Array.from(trimmed.matchAll(safeRegex));

    for (const match of matches) {
      if (match.index === undefined || match[0].length === 0) continue;
      issueCounter++;
      const matchedText = match[0];
      const matchIndex = match.index;

      // Calculate context snippet
      const start = Math.max(0, matchIndex - 25);
      const end = Math.min(trimmed.length, matchIndex + matchedText.length + 25);
      const context = '...' + trimmed.slice(start, end).trim() + '...';

      let replacementStr = '';
      if (typeof rule.replacement === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        replacementStr = (rule.replacement as any)(matchedText, match[1], match[2]);
      } else {
        replacementStr = matchedText.replace(safeRegex, rule.replacement);
      }

      issues.push({
        id: `issue_${issueCounter}`,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        original: matchedText,
        replacement: replacementStr,
        context,
        index: matchIndex,
      });
    }
  }

  // Scan word-level spelling mistakes from phonetic typos dictionary
  const wordRegex = /\b[A-Za-z']+\b/g;
  const wordMatches = Array.from(trimmed.matchAll(wordRegex));
  for (const wm of wordMatches) {
    if (wm.index === undefined || !wm[0]) continue;
    const word = wm[0];
    const lower = word.toLowerCase();
    const typoTarget = PHONETIC_TYPOS[lower];
    if (typoTarget && typoTarget.toLowerCase() !== lower) {
      // Don't duplicate if already caught by an existing rule at this index
      if (!issues.some((i) => i.index === wm.index)) {
        issueCounter++;
        let replacement = typoTarget;
        if (word[0] === word[0].toUpperCase() && word.length > 1) {
          replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        const start = Math.max(0, wm.index - 25);
        const end = Math.min(trimmed.length, wm.index + word.length + 25);
        issues.push({
          id: `typo_${issueCounter}`,
          category: 'correctness',
          title: 'Spelling Correction',
          description: `Spelling slip: Did you mean "${replacement}"?`,
          original: word,
          replacement,
          context: '...' + trimmed.slice(start, end).trim() + '...',
          index: wm.index,
        });
      }
    } else if (PROPER_NOUN_CASING[lower] && word !== PROPER_NOUN_CASING[lower] && !word.startsWith("I'")) {
      if (!issues.some((i) => i.index === wm.index)) {
        issueCounter++;
        const replacement = PROPER_NOUN_CASING[lower];
        const start = Math.max(0, wm.index - 25);
        const end = Math.min(trimmed.length, wm.index + word.length + 25);
        issues.push({
          id: `prop_${issueCounter}`,
          category: 'correctness',
          title: 'Proper Noun Capitalization',
          description: `Capitalize standard calendar term: "${replacement}".`,
          original: word,
          replacement,
          context: '...' + trimmed.slice(start, end).trim() + '...',
          index: wm.index,
        });
      }
    }
  }

  // Deduplicate overlapping issues
  const uniqueIssues = issues.filter(
    (issue, idx, self) =>
      idx === self.findIndex((t) => t.index === issue.index && t.original === issue.original)
  );

  // Calculate Pillar Scores
  const correctnessCount = uniqueIssues.filter((i) => i.category === 'correctness').length;
  const clarityCount = uniqueIssues.filter((i) => i.category === 'clarity').length;
  const engagementCount = uniqueIssues.filter((i) => i.category === 'engagement').length;
  const antiAiCount = uniqueIssues.filter((i) => i.category === 'anti-ai').length;

  // Penalize based on density per 100 words
  const density = (n: number) => Math.min(40, Math.round((n / Math.max(1, wordCount / 100)) * 12));

  const correctnessScore = Math.max(20, 100 - density(correctnessCount) * 2);
  const clarityScore = Math.max(25, 100 - density(clarityCount) * 1.5);
  const engagementScore = Math.max(30, 100 - density(engagementCount) * 1.2);
  const deliveryScore = Math.max(30, 100 - density(antiAiCount) * 2);

  const overall = Math.round(
    correctnessScore * 0.35 +
      clarityScore * 0.25 +
      engagementScore * 0.2 +
      deliveryScore * 0.2
  );

  // Detect Tone
  let detectedTone = 'Clear & Direct';
  const lower = trimmed.toLowerCase();
  if (lower.includes('research') || lower.includes('analysis') || lower.includes('demonstrate')) {
    detectedTone = 'Academic & Analytical';
  } else if (lower.includes('excited') || lower.includes('awesome') || lower.includes('hey') || lower.includes('thanks')) {
    detectedTone = 'Conversational & Friendly';
  } else if (lower.includes('ensure') || lower.includes('implement') || lower.includes('objective') || lower.includes('strategy')) {
    detectedTone = 'Professional & Confident';
  }

  return {
    overall: Math.min(100, Math.max(10, overall)),
    correctness: correctnessScore,
    clarity: clarityScore,
    engagement: engagementScore,
    delivery: deliveryScore,
    detectedTone,
    issues: uniqueIssues,
  };
}

/**
 * Applies a single issue improvement to text.
 */
export function applySingleFix(text: string, issue: WritingIssue): string {
  if (!issue.original) return text;
  // 1. Direct index match (exact location)
  if (
    typeof issue.index === 'number' &&
    issue.index >= 0 &&
    issue.index + issue.original.length <= text.length &&
    text.slice(issue.index, issue.index + issue.original.length) === issue.original
  ) {
    return (
      text.slice(0, issue.index) +
      issue.replacement +
      text.slice(issue.index + issue.original.length)
    );
  }
  // 2. Proximity search near expected index
  const searchStart = Math.max(0, (issue.index || 0) - 15);
  const searchEnd = Math.min(text.length, (issue.index || 0) + issue.original.length + 15);
  const localIdx = text.slice(searchStart, searchEnd).indexOf(issue.original);
  if (localIdx !== -1) {
    const actualIdx = searchStart + localIdx;
    return (
      text.slice(0, actualIdx) +
      issue.replacement +
      text.slice(actualIdx + issue.original.length)
    );
  }
  // 3. Fallback: first global occurrence
  const idx = text.indexOf(issue.original);
  if (idx !== -1) {
    return text.slice(0, idx) + issue.replacement + text.slice(idx + issue.original.length);
  }
  return text;
}

/**
 * Applies all non-conflicting suggestions in one click (Grammarly Instant Polish).
 */
export function applyAllImprovements(text: string, issues: WritingIssue[]): string {
  let result = text;
  // Sort from end to start so earlier indices don't shift
  const sorted = [...issues].sort((a, b) => b.index - a.index);
  for (const issue of sorted) {
    result = applySingleFix(result, issue);
  }
  return result;
}

/**
 * Tone Rewriting Presets (Grammarly Premium Tone Adjuster)
 */
export function adjustTone(
  text: string,
  targetTone: 'professional' | 'direct' | 'casual' | 'academic'
): string {
  let res = text;
  switch (targetTone) {
    case 'direct':
      // Cut all intensifiers and wordy fillers
      res = res
        .replace(/\b(really|very|actually|basically|essentially|literally)\s+/gi, '')
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\bdue to the fact that\b/gi, 'because')
        .replace(/\s*—\s*/g, ', ');
      break;
    case 'professional':
      // Upgrade colloquialisms and ensure clean formal syntax
      res = res
        .replace(/\bkinda\b/gi, 'somewhat')
        .replace(/\bgonna\b/gi, 'going to')
        .replace(/\bwanna\b/gi, 'want to')
        .replace(/\bASAP\b/gi, 'promptly')
        .replace(/\s*—\s*/g, '; ');
      break;
    case 'academic':
      // Emphasize analytical verbs
      res = res
        .replace(/\bshows\b/gi, 'demonstrates')
        .replace(/\bproves\b/gi, 'indicates')
        .replace(/\bgets\b/gi, 'obtains')
        .replace(/\blooks at\b/gi, 'examines');
      break;
    case 'casual':
      // Make friendly
      res = res
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bcommence\b/gi, 'start')
        .replace(/\bterminate\b/gi, 'stop');
      break;
  }
  return res;
}
