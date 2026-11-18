export interface AutoCorrectChange {
  from: string;
  to: string;
}

export interface AutoCorrectResult {
  text: string;
  changes: AutoCorrectChange[];
}

export const PHONETIC_TYPOS: Record<string, string> = {
  // Common ASR / phonetic spelling slips in English
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
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  hasnt: "hasn't",
  havent: "haven't",
  hadnt: "hadn't",
  doesnt: "doesn't",
  didnt: "didn't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
  wouldnt: "wouldn't",
  youre: "you're",
  theyre: "they're",
  weve: "we've",
  theyve: "they've",
  youve: "you've",
  whos: "who's",
  whats: "what's",
  wheres: "where's",
  whens: "when's",
  hows: "how's",
  theres: "there's",
  heres: "here's",
  lets: "let's",
  thats: "that's",
};

// Hindi / Devanagari common phonetic and speech-to-text slips (Gboard Style)
export const HINDI_TYPOS: Record<string, string> = {
  क्योकि: 'क्योंकि',
  क्युकि: 'क्योंकि',
  क्युकी: 'क्योंकि',
  क्योकी: 'क्योंकि',
  नही: 'नहीं',
  हमे: 'हमें',
  उन्होने: 'उन्होंने',
  इन्होने: 'इन्होंने',
  जिन्होने: 'जिन्होंने',
  कृप्या: 'कृपया',
  बहोत: 'बहुत',
  जादा: 'ज़्यादा',
  गलत: 'ग़लत',
  श्रीमति: 'श्रीमती',
  अपनें: 'अपने',
  चाहिऐ: 'चाहिए',
  दीजीए: 'दीजिए',
  कीजीए: 'कीजिए',
  परिक्षा: 'परीक्षा',
  दुकानदार: 'दुकानदार',
  कविन्द: 'कविंद्र',
  कविन्द्र: 'कविंद्र',
  प्रणाम: 'प्रणाम',
  नमस्कार: 'नमस्कार',
  धन्यवाद्: 'धन्यवाद',
  शुक्रिया: 'शुक्रिया',
};

// Spanish common typing/speech slips (accents and contractions)
export const SPANISH_TYPOS: Record<string, string> = {
  habia: 'había',
  tambien: 'también',
  despues: 'después',
  estan: 'están',
  estara: 'estará',
  facil: 'fácil',
  dificil: 'difícil',
  ademas: 'además',
  mas: 'más',
  aqui: 'aquí',
  alla: 'allá',
  corazon: 'corazón',
};

// French common typing/speech slips
export const FRENCH_TYPOS: Record<string, string> = {
  tres: 'très',
  deja: 'déjà',
  meme: 'même',
  apres: 'après',
  etre: 'être',
  plutot: 'plutôt',
  bientot: 'bientôt',
};

// German common typing/speech slips
export const GERMAN_TYPOS: Record<string, string> = {
  fur: 'für',
  uber: 'über',
  mochte: 'möchte',
  konnen: 'können',
  wurde: 'würde',
  spater: 'später',
};

export const PROPER_NOUN_CASING: Record<string, string> = {
  // Brand names & tech tools
  voicescribe: 'VoiceScribe',
  youtube: 'YouTube',
  github: 'GitHub',
  google: 'Google',
  microsoft: 'Microsoft',
  apple: 'Apple',
  android: 'Android',
  iphone: 'iPhone',
  ipad: 'iPad',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  html: 'HTML',
  css: 'CSS',
  pdf: 'PDF',
  api: 'API',
  // Days of week
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  // Months
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
};

function preserveWordCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Automatically corrects common phonetic typos, missing apostrophes, and casing issues
 * across supported languages (English, Hindi, Spanish, French, German), mimicking Gboard's
 * background typing intelligence.
 */
export function autoCorrectText(rawText: string, langCode?: string): AutoCorrectResult {
  if (!rawText) {
    return { text: rawText, changes: [] };
  }

  const changes: AutoCorrectChange[] = [];
  let updated = rawText;
  const langPrefix = langCode ? langCode.toLowerCase().split(/[-_]/)[0] : '';
  const hasDevanagari = /[\u0900-\u097F]/.test(rawText);

  // 1. Language-Specific Corrections
  if (langPrefix === 'hi' || langPrefix === 'mr' || hasDevanagari) {
    // Spacing hygiene before Hindi Purn Viram
    updated = updated.replace(/(\S)\s+([।])/g, (_match, char, purn) => {
      changes.push({ from: `${char} ${purn}`, to: `${char}${purn}` });
      return `${char}${purn}`;
    });

    // Word-level Devanagari corrections
    for (const [typo, fixed] of Object.entries(HINDI_TYPOS)) {
      const regex = new RegExp(`(?<=^|\\s)${typo}(?=$|\\s|[।!?,])`, 'g');
      if (regex.test(updated)) {
        updated = updated.replace(regex, fixed);
        changes.push({ from: typo, to: fixed });
      }
    }
  }

  if (langPrefix === 'es') {
    for (const [typo, fixed] of Object.entries(SPANISH_TYPOS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      updated = updated.replace(regex, (match) => {
        const rep = preserveWordCase(match, fixed);
        changes.push({ from: match, to: rep });
        return rep;
      });
    }
  }

  if (langPrefix === 'fr') {
    for (const [typo, fixed] of Object.entries(FRENCH_TYPOS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      updated = updated.replace(regex, (match) => {
        const rep = preserveWordCase(match, fixed);
        changes.push({ from: match, to: rep });
        return rep;
      });
    }
  }

  if (langPrefix === 'de') {
    for (const [typo, fixed] of Object.entries(GERMAN_TYPOS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      updated = updated.replace(regex, (match) => {
        const rep = preserveWordCase(match, fixed);
        changes.push({ from: match, to: rep });
        return rep;
      });
    }
  }

  // 2. English / Latin phonetic typos & casing pass
  updated = updated.replace(/\b([A-Za-z]+(?:'[A-Za-z]+)?)\b/g, (word) => {
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

    // Fix double-leading caps like "THis" -> "This"
    if (/^[A-Z]{2}[a-z]{2,}$/.test(word)) {
      const fixed = word.charAt(0) + word.slice(1).toLowerCase();
      changes.push({ from: word, to: fixed });
      return fixed;
    }

    // Fix inverse caps like "tHIS" -> "This"
    if (/^[a-z][A-Z]{2,}$/.test(word)) {
      const fixed = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      changes.push({ from: word, to: fixed });
      return fixed;
    }

    return word;
  });

  // 3. Capitalize lowercase letters right after sentence-ending punctuation inside the segment
  updated = updated.replace(/([.!?।]\s+|\n+)([a-z])/g, (_match, prefix: string, ch: string) => {
    const upper = ch.toUpperCase();
    changes.push({ from: ch, to: upper });
    return prefix + upper;
  });

  return { text: updated, changes };
}
