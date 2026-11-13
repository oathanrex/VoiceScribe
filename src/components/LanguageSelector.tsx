import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Search } from 'lucide-react';
import { SPEECH_LANGUAGES, SpeechLanguage } from '../data/languages';

interface LanguageSelectorProps {
  selectedLanguage: SpeechLanguage;
  onSelect: (language: SpeechLanguage) => void;
}

export function LanguageSelector({ selectedLanguage, onSelect }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPEECH_LANGUAGES;
    return SPEECH_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.searchTerms.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => searchInputRef.current?.focus(), 10);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dictation language: ${selectedLanguage.name}`}
        className="inline-flex items-center gap-2 min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground bg-surface border border-border hover:border-muted/60 rounded-control transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Globe className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[120px] sm:max-w-[155px]">{selectedLanguage.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-150 shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-72 sm:w-80 z-40 bg-surface border border-border rounded-card shadow-surface overflow-hidden"
          role="dialog"
          aria-label="Choose dictation language"
        >
          <div className="p-2.5 border-b border-border/70">
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 text-muted absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 100+ languages..."
                aria-label="Search languages"
                className="w-full pl-9 pr-3 py-2 text-sm bg-well text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <ul
            role="listbox"
            aria-label="Available languages"
            className="max-h-64 overflow-y-auto py-1.5 divide-y divide-border/50"
          >
            {filteredLanguages.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                No matching language found.
              </li>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.id === selectedLanguage.id;
                return (
                  <li key={lang.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(lang);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-accent-soft text-primary font-medium'
                          : 'text-foreground hover:bg-well/70'
                      }`}
                    >
                      <span className="truncate">{lang.name}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-muted/80">
                          {lang.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
