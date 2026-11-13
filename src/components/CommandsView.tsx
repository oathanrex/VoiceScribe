import { useMemo, useState } from 'react';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { VOICE_COMMANDS, VoiceCommandCategory, VoiceCommandItem } from '../data/voiceCommands';
import { getPunctuationCommands } from '../utils/voiceCommands';

interface CommandsViewProps {
  onInsertToken: (token: string) => void;
}

type FilterCategory = 'all' | VoiceCommandCategory;

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'punctuation', label: 'Punctuation' },
  { id: 'control', label: 'Formatting & Control' },
  { id: 'symbols', label: 'Symbols' },
];

export function CommandsView({ onInsertToken }: CommandsViewProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [query, setQuery] = useState('');
  const punctuationCommands = useMemo(() => getPunctuationCommands(), []);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOICE_COMMANDS.filter((cmd) => {
      if (category !== 'all' && cmd.category !== category) return false;
      if (!q) return true;
      return (
        cmd.phrases.some((p) => p.toLowerCase().includes(q)) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.outputLabel.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const handleActionClick = (cmd: VoiceCommandItem) => {
    if (cmd.insertText) {
      onInsertToken(cmd.insertText);
    } else if (cmd.action === 'newline') {
      onInsertToken('\n');
    } else if (cmd.action === 'newparagraph') {
      onInsertToken('\n\n');
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Voice Commands
        </h1>
        <p className="mt-1 text-sm text-muted">
          Speak any phrase below while dictating. Prefix punctuation with “add” or “insert” if preferred.
        </p>
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
              Supported Punctuation Keywords
            </h2>
          </div>
          <p className="text-xs text-muted">
            Click any keyword card to insert it directly into your active draft.
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

      {/* Filter & Search Bar */}
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
                    ? 'bg-surface text-foreground shadow-surface'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter commands..."
            aria-label="Filter voice commands"
            className="w-full pl-9 pr-3 py-2 min-h-[38px] text-sm bg-surface text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Clean Commands Table */}
      <div className="bg-surface border border-border/80 rounded-2xl shadow-surface overflow-hidden">
        {filteredCommands.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No voice commands match “{query}”.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-medium text-muted">
                  <th scope="col" className="py-3 px-5">
                    Result
                  </th>
                  <th scope="col" className="py-3 px-5">
                    Say this
                  </th>
                  <th scope="col" className="py-3 px-5 hidden sm:table-cell">
                    Behavior
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
                      <td className="py-3 px-5 font-mono text-sm font-medium text-foreground whitespace-nowrap">
                        {cmd.outputLabel}
                      </td>
                      <td className="py-3 px-5 text-foreground/90">
                        {cmd.phrases.map((p) => `“${p}”`).join(', ')}
                      </td>
                      <td className="py-3 px-5 text-muted hidden sm:table-cell">
                        {cmd.description}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
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
                          <span className="text-xs text-muted/80">
                            Voice only
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

      {/* Quiet compatibility & privacy note */}
      <p className="mt-5 text-xs text-muted leading-relaxed">
        100% browser-local note storage. Live speech recognition runs via the Web Speech API in Google Chrome and Microsoft Edge.
      </p>
    </div>
  );
}
