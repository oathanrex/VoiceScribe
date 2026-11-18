import { useMemo, useState } from 'react';
import { ArrowUpRight, Globe, Search, Sparkles } from 'lucide-react';
import {
  SUPPORTED_COMMAND_LANGUAGES,
  VOICE_COMMANDS,
  VoiceCommandCategory,
  VoiceCommandItem,
  getVoiceCommandsForLanguage,
} from '../data/voiceCommands';
import { SpeechLanguage } from '../data/languages';
import { getPunctuationCommands } from '../utils/voiceCommands';

interface CommandsViewProps {
  onInsertToken: (token: string) => void;
  activeLanguage?: SpeechLanguage;
}

type FilterCategory = 'all' | VoiceCommandCategory;

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'punctuation', label: 'Punctuation' },
  { id: 'control', label: 'Formatting & Control' },
  { id: 'symbols', label: 'Symbols' },
];

export function CommandsView({ onInsertToken, activeLanguage }: CommandsViewProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    if (activeLanguage?.code) {
      const prefix = activeLanguage.code.toLowerCase().split(/[-_]/)[0];
      const match = SUPPORTED_COMMAND_LANGUAGES.find((l) => l.code === prefix);
      return match ? match.code : 'all';
    }
    return 'all';
  });
  const [query, setQuery] = useState('');

  const punctuationCommands = useMemo(
    () => getPunctuationCommands(selectedLang),
    [selectedLang]
  );

  const baseCommands = useMemo(
    () => getVoiceCommandsForLanguage(selectedLang),
    [selectedLang]
  );

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseCommands.filter((cmd) => {
      if (category !== 'all' && cmd.category !== category) return false;
      if (!q) return true;
      return (
        cmd.phrases.some((p) => p.toLowerCase().includes(q)) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.outputLabel.toLowerCase().includes(q)
      );
    });
  }, [baseCommands, category, query]);

  const handleActionClick = (cmd: VoiceCommandItem) => {
    if (cmd.insertText) {
      onInsertToken(cmd.insertText);
    } else if (cmd.action === 'newline') {
      onInsertToken('\n');
    } else if (cmd.action === 'newparagraph') {
      onInsertToken('\n\n');
    }
  };

  const currentLangLabel = useMemo(() => {
    const found = SUPPORTED_COMMAND_LANGUAGES.find((l) => l.code === selectedLang);
    return found ? `${found.flag} ${found.name}` : 'All Languages';
  }, [selectedLang]);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Voice Commands & Punctuation</span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              {VOICE_COMMANDS.length} Commands
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Hands-free voice editing in 20+ languages. Speak punctuation naturally or say control phrases while dictating.
          </p>
        </div>

        {activeLanguage && (
          <div className="px-3 py-1.5 rounded-lg bg-well border border-border text-xs flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Globe className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="text-muted">Dictation Language:</span>
            <span className="font-medium text-foreground">{activeLanguage.name}</span>
          </div>
        )}
      </div>

      {/* Language Switcher Bar */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Select Command Language
        </label>
        <div
          role="tablist"
          aria-label="Supported voice command languages"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin"
        >
          {SUPPORTED_COMMAND_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-surface text-muted hover:text-foreground border-border hover:border-border/80'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supported Punctuation Keywords Quick Reference */}
      <section
        aria-labelledby="punctuation-keywords-heading"
        data-testid="punctuation-keywords-section"
        className="bg-surface border border-border/80 rounded-2xl shadow-surface p-5 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h2
              id="punctuation-keywords-heading"
              className="font-display text-base font-semibold text-foreground"
            >
              Quick Punctuation Reference ({currentLangLabel})
            </h2>
          </div>
          <p className="text-xs text-muted">
            Click any card to insert it directly into your active draft canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {punctuationCommands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => handleActionClick(cmd)}
              aria-label={`Insert punctuation ${cmd.outputLabel} using keyword ${cmd.phrases[0]}`}
              className="w-full px-3.5 py-2.5 rounded-control bg-well/45 hover:bg-well border border-border/70 hover:border-primary/40 text-left flex items-center justify-between gap-3 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {cmd.phrases.map((p) => `“${p}”`).join(', ')}
                </p>
                <p className="mt-0.5 text-[11px] text-muted truncate">
                  {cmd.description}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-primary shrink-0">
                {cmd.outputLabel}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Category & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div
          role="group"
          aria-label="Command categories"
          className="inline-flex items-center gap-1 p-1 bg-well border border-border/60 rounded-card overflow-x-auto"
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-surface text-foreground shadow-surface font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phrases or behavior..."
            aria-label="Filter voice commands"
            className="w-full pl-9 pr-3 py-2 min-h-[38px] text-sm bg-surface text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Clean Commands Table */}
      <div className="bg-surface border border-border/80 rounded-2xl shadow-surface overflow-hidden">
        {filteredCommands.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No voice commands match “{query}” in {currentLangLabel}. Try choosing another category or selecting "All Languages".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold text-muted bg-well/30">
                  <th scope="col" className="py-3 px-5">
                    Symbol / Action
                  </th>
                  <th scope="col" className="py-3 px-5">
                    Say Spoken Phrase
                  </th>
                  <th scope="col" className="py-3 px-5 hidden sm:table-cell">
                    Functionality
                  </th>
                  <th scope="col" className="py-3 px-5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {filteredCommands.map((cmd) => {
                  const canInsert = Boolean(
                    cmd.insertText || cmd.action === 'newline' || cmd.action === 'newparagraph'
                  );
                  return (
                    <tr
                      key={cmd.id}
                      className="hover:bg-well/50 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono text-sm font-semibold text-foreground whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-well border border-border/80 text-primary">
                          {cmd.outputLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-foreground/90 font-medium">
                        <div className="flex flex-wrap gap-1.5">
                          {cmd.phrases.map((p) => (
                            <span
                              key={p}
                              className="inline-block px-2 py-0.5 rounded text-xs bg-well/60 border border-border/60 text-foreground"
                            >
                              “{p}”
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-muted text-xs hidden sm:table-cell">
                        {cmd.description}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {canInsert ? (
                          <button
                            type="button"
                            onClick={() => handleActionClick(cmd)}
                            aria-label={`Insert ${cmd.outputLabel} into note`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent-soft rounded-control transition-colors"
                          >
                            <span>Insert</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                            Voice Control
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quiet privacy note */}
      <p className="mt-5 text-xs text-muted leading-relaxed">
        🔒 100% Client-Side Privacy: Your voice audio is processed directly through the browser Web Speech API. Zero audio recordings or transcript data are ever stored on external servers.
      </p>
    </div>
  );
}
