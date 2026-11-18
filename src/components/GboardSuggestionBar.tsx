import React from 'react';
import { Sparkles, Globe, ArrowRight } from 'lucide-react';
import { SpeechLanguage } from '../data/languages';
import { isTransliterationSupported, getTransliterationSuggestions } from '../utils/transliterate';

interface GboardSuggestionBarProps {
  selectedLanguage: SpeechLanguage;
  lastWord: string;
  transliterateEnabled: boolean;
  onToggleTransliterate: () => void;
  onSelectSuggestion: (suggestion: string) => void;
  onInsertPunctuation: (punc: string) => void;
}

export const GboardSuggestionBar: React.FC<GboardSuggestionBarProps> = ({
  selectedLanguage,
  lastWord,
  transliterateEnabled,
  onToggleTransliterate,
  onSelectSuggestion,
  onInsertPunctuation,
}) => {
  const isIndic = isTransliterationSupported(selectedLanguage.code);

  // Compute suggestions based on last word and active language
  const suggestions = React.useMemo(() => {
    if (!lastWord || !lastWord.trim()) {
      if (selectedLanguage.code.startsWith('hi')) {
        return ['नमस्ते', 'धन्यवाद', 'कृपया'];
      }
      if (selectedLanguage.code.startsWith('es')) {
        return ['hola', 'gracias', 'por favor'];
      }
      if (selectedLanguage.code.startsWith('fr')) {
        return ['bonjour', 'merci', "s'il vous plaît"];
      }
      return ['VoiceScribe', 'dictate', 'notes'];
    }

    if (transliterateEnabled && /[a-zA-Z]/.test(lastWord)) {
      return getTransliterationSuggestions(lastWord);
    }

    return [lastWord];
  }, [lastWord, selectedLanguage.code, transliterateEnabled]);

  // Language-specific 1-tap punctuation marks
  const punctuationMarks = React.useMemo(() => {
    if (selectedLanguage.code.startsWith('hi') || selectedLanguage.code.startsWith('mr')) {
      return ['।', ',', '?', '!'];
    }
    if (selectedLanguage.code.startsWith('es')) {
      return ['.', ',', '¿', '¡', '?'];
    }
    if (selectedLanguage.code.startsWith('ar') || selectedLanguage.code.startsWith('ur')) {
      return ['۔', '،', '؟', '!'];
    }
    return ['.', ',', '?', '!', ';'];
  }, [selectedLanguage.code]);

  return (
    <div
      data-testid="gboard-suggestion-bar"
      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface-hover/40 border-b border-border/60 text-xs select-none overflow-x-auto transition-all"
    >
      {/* Suggestions Chips (Left / Center) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted/70 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="hidden sm:inline">Suggestions</span>
        </span>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {suggestions.map((sug, idx) => (
            <button
              key={`${sug}-${idx}`}
              type="button"
              onClick={() => onSelectSuggestion(sug)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-border hover:border-primary/40 hover:bg-accent-soft/50 text-foreground transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-2xs"
            >
              <span>{sug}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Punctuation & Transliterate Toggle (Right) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1-tap punctuation buttons */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5">
          {punctuationMarks.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onInsertPunctuation(p)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-semibold bg-surface border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors active:scale-90"
              title={`Insert "${p}"`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Gboard Phonetic Transliteration Toggle (A → अ) */}
        {isIndic && (
          <button
            type="button"
            onClick={onToggleTransliterate}
            title={
              transliterateEnabled
                ? 'Gboard Transliteration Active: Typing "namaste" becomes "नमस्ते"'
                : 'Turn on Gboard Transliteration (ABC → हिन्दी)'
            }
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
              transliterateEnabled
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-surface text-muted hover:text-foreground border-border'
            }`}
          >
            <span>A → अ</span>
            <span className="text-[9px] font-mono uppercase opacity-90">
              {transliterateEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
