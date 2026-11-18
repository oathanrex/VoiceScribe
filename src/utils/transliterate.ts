/**
 * VoiceScribe Gboard-Style Phonetic Transliteration Engine
 * Converts Romanized / Hinglish text into authentic Devanagari script in real-time,
 * mimicking Google Keyboard's "ABC → हिन्दी" phonetic typing experience.
 */

// 1. High-frequency colloquial & conversational vocabulary dictionary
const CONVERSATIONAL_MAP: Record<string, string[]> = {
  namaste: ['नमस्ते', 'नमस्‍ते', 'namaste'],
  namaskar: ['नमस्कार', 'नमस्कारम', 'namaskar'],
  kaise: ['कैसे', 'कैंसे', 'kaise'],
  kaisa: ['कैसा', 'कैंसा', 'kaisa'],
  kaisi: ['कैसी', 'कैंसी', 'kaisi'],
  hai: ['है', 'हैं', 'hai'],
  hain: ['हैं', 'है', 'hain'],
  ho: ['हो', 'हों', 'ho'],
  hoon: ['हूँ', 'हुँ', 'hoon'],
  hun: ['हूँ', 'हुन', 'hun'],
  tha: ['था', 'ठा', 'tha'],
  the: ['थे', 'ठे', 'the'],
  thi: ['थी', 'ठी', 'thi'],
  aap: ['आप', 'अप', 'aap'],
  ap: ['आप', 'अप', 'ap'],
  hum: ['हम', 'हुम', 'hum'],
  tum: ['तुम', 'तुमने', 'tum'],
  main: ['मैं', 'मेन', 'main'],
  mai: ['मैं', 'मै', 'mai'],
  mera: ['मेरा', 'मेरां', 'mera'],
  meri: ['मेरी', 'मेरीं', 'meri'],
  mere: ['मेरे', 'मेरें', 'mere'],
  tera: ['तेरा', 'तेरां', 'tera'],
  teri: ['तेरी', 'तेरीं', 'teri'],
  tere: ['तेरे', 'तेरें', 'tere'],
  uska: ['उसका', 'उसकां', 'uska'],
  uski: ['उसकी', 'उसकीं', 'uski'],
  uske: ['उसके', 'उस्कें', 'uske'],
  unka: ['उनका', 'उनकां', 'unka'],
  unki: ['उनकी', 'उनकीं', 'unki'],
  unke: ['उनके', 'उन्कें', 'unke'],
  kya: ['क्या', 'क्यां', 'kya'],
  kyun: ['क्यों', 'क्युं', 'kyun'],
  kyu: ['क्यों', 'क्यु', 'kyu'],
  kyon: ['क्यों', 'क्यो', 'kyon'],
  kab: ['कब', 'कभ', 'kab'],
  kahan: ['कहाँ', 'कहा', 'kahan'],
  kaha: ['कहा', 'कहाँ', 'kaha'],
  kaun: ['कौन', 'कौन्', 'kaun'],
  kitna: ['कितना', 'कितनां', 'kitna'],
  kitni: ['कितनी', 'कितनीं', 'kitni'],
  kitne: ['कितने', 'किंतने', 'kitne'],
  nahi: ['नहीं', 'नहि', 'nahi'],
  nahin: ['नहीं', 'नहिं', 'nahin'],
  na: ['ना', 'न', 'na'],
  mat: ['मत', 'मत्', 'mat'],
  bhi: ['भी', 'भि', 'bhi'],
  aur: ['और', 'औरं', 'aur'],
  ya: ['या', 'याँ', 'ya'],
  lekin: ['लेकिन', 'लेकिन्', 'lekin'],
  par: ['पर', 'पर्', 'par'],
  achha: ['अच्छा', 'अछा', 'achha'],
  accha: ['अच्छा', 'अछा', 'accha'],
  achhi: ['अच्छी', 'अछी', 'achhi'],
  acchi: ['अच्छी', 'अछी', 'acchi'],
  achhe: ['अच्छे', 'अछे', 'achhe'],
  acche: ['अच्छे', 'अछे', 'acche'],
  bahut: ['बहुत', 'बहोत', 'bahut'],
  bahot: ['बहुत', 'बहोत', 'bahot'],
  shukriya: ['शुक्रिया', 'सुक्रिया', 'shukriya'],
  dhanyawad: ['धन्यवाद', 'धन्यवाद्', 'dhanyawad'],
  dhanyavad: ['धन्यवाद', 'धन्यवाद्', 'dhanyavad'],
  alvida: ['अलविदा', 'अल्विदा', 'alvida'],
  dost: ['दोस्त', 'दोस्ती', 'dost'],
  yaar: ['यार', 'यारी', 'yaar'],
  bhai: ['भाई', 'भाइ', 'bhai'],
  behan: ['बहन', 'बहेन', 'behan'],
  ghar: ['घर', 'घर्', 'ghar'],
  kaam: ['काम', 'कांम', 'kaam'],
  samay: ['समय', 'समयं', 'samay'],
  aaj: ['आज', 'आज़', 'aaj'],
  kal: ['कल', 'कल्', 'kal'],
  parso: ['परसों', 'परसो', 'parso'],
  subah: ['सुबह', 'सुबहा', 'subah'],
  shaam: ['शाम', 'शामें', 'shaam'],
  raat: ['रात', 'रात्', 'raat'],
  din: ['दिन', 'दिन्', 'din'],
  kripya: ['कृपया', 'कृप्या', 'kripya'],
  kripyaa: ['कृपया', 'कृप्या', 'kripyaa'],
  zaroor: ['ज़रूर', 'जरूर', 'zaroor'],
  jarur: ['ज़रूर', 'जरूर', 'jarur'],
  khush: ['खुश', 'ख़ुश', 'khush'],
  madad: ['मदद', 'मदद्', 'madad'],
  baat: ['बात', 'बात्', 'baat'],
  suno: ['सुनो', 'सुनों', 'suno'],
  bolo: ['बोलो', 'बोलों', 'bolo'],
  dekho: ['देखो', 'देखों', 'dekho'],
  samjho: ['समझो', 'समझों', 'samjho'],
  likho: ['लिखो', 'लिखों', 'likho'],
  padho: ['पढ़ो', 'पढो', 'padho'],
  chalo: ['चलो', 'चलों', 'chalo'],
  aao: ['आओ', 'आव', 'aao'],
  jao: ['जाओ', 'जाव', 'jao'],
  karo: ['करो', 'करों', 'karo'],
  shuru: ['शुरू', 'सुरु', 'shuru'],
  khatam: ['खत्म', 'ख़त्म', 'khatam'],
  sahi: ['सही', 'सहि', 'sahi'],
  galat: ['ग़लत', 'गलत', 'galat'],
  thik: ['ठीक', 'ठिक', 'thik'],
  theek: ['ठीक', 'ठिक', 'theek'],
  haan: ['हाँ', 'हां', 'haan'],
  ha: ['हाँ', 'हा', 'ha'],
  batao: ['बताओ', 'बताव', 'batao'],
  pata: ['पता', 'पतां', 'pata'],
  wala: ['वाला', 'वालां', 'wala'],
  wali: ['वाली', 'वालीं', 'wali'],
  wale: ['वाले', 'वालें', 'wale'],
  sab: ['सब', 'सब्', 'sab'],
  kuch: ['कुछ', 'कुच्छ', 'kuch'],
  koi: ['कोई', 'कोइ', 'koi'],
  hamesha: ['हमेशा', 'हमेसा', 'hamesha'],
  kabhi: ['कभी', 'कभि', 'kabhi'],
  abhi: ['अभी', 'अभि', 'abhi'],
  pehle: ['पहले', 'पेहले', 'pehle'],
  baad: ['बाद', 'बाद्', 'baad'],
  saath: ['साथ', 'सात्', 'saath'],
  paas: ['पास', 'पास्', 'paas'],
  door: ['दूर', 'दुर्', 'door'],
  aage: ['आगे', 'आगें', 'aage'],
  peeche: ['पीछे', 'पिछे', 'peeche'],
  upar: ['ऊपर', 'उपर', 'upar'],
  neeche: ['नीचे', 'निचे', 'neeche'],
  andar: ['अंदर', 'अन्दर', 'andar'],
  bahar: ['बाहर', 'बाहर्', 'bahar'],
  thoda: ['थोड़ा', 'थोडा', 'thoda'],
  jyada: ['ज़्यादा', 'ज्यादा', 'jyada'],
  zyada: ['ज़्यादा', 'ज्यादा', 'zyada'],
  ziyada: ['ज़्यादा', 'ज्यादा', 'ziyada'],
  kam: ['कम', 'कम्', 'kam'],
  bharat: ['भारत', 'भारत्', 'bharat'],
  india: ['इंडिया', 'इण्डिया', 'india'],
  hindi: ['हिन्दी', 'हिंदी', 'hindi'],
  english: ['इंग्लिश', 'अंग्रेज़ी', 'english'],
  video: ['वीडियो', 'विडियो', 'video'],
  voice: ['वॉइस', 'वाइस', 'voice'],
  scribe: ['स्क्राइब', 'स्क्राईब', 'scribe'],
  audio: ['ऑडियो', 'आडियो', 'audio'],
  keyboard: ['कीबोर्ड', 'किबोर्ड', 'keyboard'],
  google: ['गूगल', 'गुगल', 'google'],
};

// 2. Algorithmic ITRANS / Phonetic Character Map for unseen words
const CONSONANT_MAP: [string, string][] = [
  ['kkh', 'क्ख'],
  ['ggh', 'ग्घ'],
  ['cch', 'च्छ'],
  ['jjh', 'ज्झ'],
  ['tth', 'त्थ'],
  ['ddh', 'द्ध'],
  ['pph', 'प्फ'],
  ['bbh', 'ब्भ'],
  ['ksh', 'क्ष'],
  ['jny', 'ज्ञ'],
  ['gya', 'ज्ञा'],
  ['tra', 'त्र'],
  ['shr', 'श्र'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['chh', 'छ'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['shh', 'ष'],
  ['ng', 'ङ'],
  ['ny', 'ञ'],
  ['k', 'क'],
  ['g', 'ग'],
  ['j', 'ज'],
  ['z', 'ज़'],
  ['f', 'फ़'],
  ['q', 'क़'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['x', 'क्स'],
];

const INDEPENDENT_VOWELS: [string, string][] = [
  ['aaa', 'आ'],
  ['aa', 'आ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['ee', 'ई'],
  ['oo', 'ऊ'],
  ['a', 'अ'],
  ['i', 'इ'],
  ['u', 'उ'],
  ['e', 'ए'],
  ['o', 'ओ'],
];

const DEPENDENT_VOWELS: [string, string][] = [
  ['aaa', 'ा'],
  ['aa', 'ा'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['a', ''],
  ['i', 'ि'],
  ['u', 'ु'],
  ['e', 'े'],
  ['o', 'ो'],
];

/**
 * Phonetically transliterates a single Romanized token into Devanagari using standard phonetic rules.
 */
export function phoneticTransliterateWord(word: string): string {
  const lower = word.toLowerCase();
  if (CONVERSATIONAL_MAP[lower]) {
    return CONVERSATIONAL_MAP[lower][0];
  }

  let result = '';
  let i = 0;
  const len = lower.length;

  while (i < len) {
    const isStart = i === 0;

    // Check independent vowel at word start or after vowel
    if (isStart) {
      let matchedVowel = false;
      for (const [vowel, dev] of INDEPENDENT_VOWELS) {
        if (lower.startsWith(vowel, i)) {
          result += dev;
          i += vowel.length;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    // Check consonants
    let matchedConsonant = false;
    for (const [con, dev] of CONSONANT_MAP) {
      if (lower.startsWith(con, i)) {
        i += con.length;
        matchedConsonant = true;

        // Check if followed by vowel
        let matchedMatra = false;
        for (const [vowel, matra] of DEPENDENT_VOWELS) {
          if (lower.startsWith(vowel, i)) {
            result += dev + matra;
            i += vowel.length;
            matchedMatra = true;
            break;
          }
        }

        // If at end of word or before another consonant, decide halant or inherent 'a'
        if (!matchedMatra) {
          if (i < len && /[bcdfghjklmnpqrstvwxyz]/i.test(lower[i])) {
            // Conjunct with halant
            result += dev + '्';
          } else {
            // Final consonant (inherent a dropped or preserved in modern Hindi)
            result += dev;
          }
        }
        break;
      }
    }

    if (!matchedConsonant) {
      // Non-consonant, non-vowel or special character
      result += lower[i];
      i++;
    }
  }

  return result || word;
}

/**
 * Returns top 3 candidate suggestions for a word in Gboard prediction style:
 * [Top Devanagari, Alternative Devanagari / phonetic, Original English]
 */
export function getTransliterationSuggestions(word: string): string[] {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  if (CONVERSATIONAL_MAP[lower]) {
    const suggestions = [...CONVERSATIONAL_MAP[lower]];
    if (!suggestions.includes(trimmed)) {
      suggestions.push(trimmed);
    }
    return suggestions.slice(0, 3);
  }

  const generated = phoneticTransliterateWord(lower);
  return [generated, trimmed];
}

/**
 * Transliterates an entire string or sentence into Devanagari.
 * Preserves spaces, punctuation, numbers, and existing Devanagari text.
 */
export function transliterateText(text: string): string {
  if (!text) return '';

  return text.replace(/[a-zA-Z]+/g, (match) => {
    return phoneticTransliterateWord(match);
  });
}

/**
 * Checks if the given language code is an Indic / Transliteration-supported language.
 */
export function isTransliterationSupported(langCode?: string): boolean {
  if (!langCode) return false;
  const prefix = langCode.toLowerCase().split(/[-_]/)[0];
  return ['hi', 'mr', 'ne', 'bn', 'gu', 'pa', 'ur', 'ta', 'te', 'kn', 'ml'].includes(prefix);
}
