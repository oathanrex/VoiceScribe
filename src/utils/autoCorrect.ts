export interface AutoCorrectChange {
  from: string;
  to: string;
}

export interface AutoCorrectResult {
  text: string;
  changes: AutoCorrectChange[];
}

const PHONETIC_TYPOS: Record<string, string> = {
  // Common ASR / phonetic spelling slips
  alot: 'a lot',
  teh: 'the',
  hte: 'the',
  adn: 'and',
  taht: 'that',
  waht: 'what',
  wich: 'which',
  becuase: 'because',
  beacuse: 'because',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  beleive: 'believe',
  beleived: 'believed',
  seperate: 'separate',
  seperated: 'separated',
  seperately: 'separately',
  definately: 'definitely',
  definatly: 'definitely',
  occured: 'occurred',
  occurence: 'occurrence',
  acommodate: 'accommodate',
  accomodate: 'accommodate',
  untill: 'until',
  tommorow: 'tomorrow',
  tomorow: 'tomorrow',
  goverment: 'government',
  enviroment: 'environment',
  wierd: 'weird',
  freind: 'friend',
  freinds: 'friends',
  thier: 'their',
  calender: 'calendar',
  publically: 'publicly',
  buisness: 'business',
  necesary: 'necessary',
  neccessary: 'necessary',
  wether: 'whether',
  persue: 'pursue',
  refered: 'referred',
  truely: 'truly',
  arguement: 'argument',
  maintainance: 'maintenance',
  pronounciation: 'pronunciation',
  noone: 'no one',
  everytime: 'every time',
  infront: 'in front',
  aswell: 'as well',
  thankyou: 'thank you',
  atleast: 'at least',
  // Missing-apostrophe spoken contractions
  im: "I'm",
  ive: "I've",
  ill: "I'll",
  dont: "don't",
  cant: "can't",
  wont: "won't",
  isnt: "isn't",
  didnt: "didn't",
  wasnt: "wasn't",
  werent: "weren't",
  hasnt: "hasn't",
  havent: "haven't",
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  shouldnt: "shouldn't",
  youre: "you're",
  theyre: "they're",
  thats: "that's",
  whats: "what's",
  heres: "here's",
  theres: "there's",
};

const PROPER_NOUN_CASING: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  january: 'January',
  february: 'February',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
};

function preserveWordCase(original: string, replacement: string): string {
  // Keep intentional I'm / I've / I'll casing intact unless entire token was shouted
  if (replacement.startsWith("I'")) {
    return replacement;
  }
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (/^[A-Z]/.test(original)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Fixes lightweight phonetic typos and common dictation casing errors
 * (standalone lowercase "i", inverted leading caps like "THis" -> "This",
 * lowercase weekdays/months, and lowercase letters immediately after sentence punctuation).
 */
export function autoCorrectText(rawText: string): AutoCorrectResult {
  if (!rawText) {
    return { text: rawText, changes: [] };
  }

  const changes: AutoCorrectChange[] = [];

  // 1. Word-level phonetic typo, contraction, and pronoun/proper-noun casing pass
  let updated = rawText.replace(/\b([A-Za-z]+(?:'[A-Za-z]+)?)\b/g, (word) => {
    // Fix standalone lowercase "i" or lowercase "i'm / i've / i'll / i'd"
    if (word === 'i') {
      changes.push({ from: word, to: 'I' });
      return 'I';
    }
    if (/^i'(?:m|ve|ll|d)$/i.test(word) && word[0] === 'i') {
      const fixed = 'I' + word.slice(1).toLowerCase();
      changes.push({ from: word, to: fixed });
      return fixed;
    }

    const lower = word.toLowerCase();

    // Note: "ill" can be a valid word ("feel ill"), so only fix "ill" when apostrophe isn't needed?
    // Actually skip ambiguous "ill" so "feeling ill" is never corrupted to "feeling I'll"!
    if (lower !== 'ill' && Object.prototype.hasOwnProperty.call(PHONETIC_TYPOS, lower)) {
      const replacement = preserveWordCase(word, PHONETIC_TYPOS[lower]);
      if (replacement !== word) {
        changes.push({ from: word, to: replacement });
        return replacement;
      }
    }

    if (Object.prototype.hasOwnProperty.call(PROPER_NOUN_CASING, lower)) {
      const proper = PROPER_NOUN_CASING[lower];
      if (word !== proper && word === lower) {
        changes.push({ from: word, to: proper });
        return proper;
      }
    }

    // Fix accidental double-leading caps like "THis" or "HEllo" (2 uppercase followed by >=2 lowercase)
    if (/^[A-Z]{2}[a-z]{2,}$/.test(word)) {
      const fixed = word.charAt(0) + word.slice(1).toLowerCase();
      changes.push({ from: word, to: fixed });
      return fixed;
    }

    // Fix accidental inverse caps like "tHIS" -> "This" (1 lowercase followed by >=2 uppercase)
    if (/^[a-z][A-Z]{2,}$/.test(word)) {
      const fixed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      changes.push({ from: word, to: fixed });
      return fixed;
    }

    return word;
  });

  // 2. Capitalize lowercase letters right after sentence-ending punctuation inside the segment
  updated = updated.replace(/([.!?।]\s+|\n+)([a-z])/g, (_match, prefix: string, ch: string) => {
    const upper = ch.toUpperCase();
    changes.push({ from: ch, to: upper });
    return prefix + upper;
  });

  return { text: updated, changes };
}
