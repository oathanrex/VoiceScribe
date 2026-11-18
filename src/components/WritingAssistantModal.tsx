import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Zap,
  Check,
  X,
  Volume2,
  ArrowRight,
  TrendingUp,
  Sliders,
  Type,
  FileCheck,
} from 'lucide-react';
import {
  analyzeWriting,
  applySingleFix,
  applyAllImprovements,
  adjustTone,
  type WritingIssue,
  type IssueCategory,
} from '../utils/writingIntelligence';

interface WritingAssistantModalProps {
  open: boolean;
  content: string;
  onUpdateContent: (newContent: string) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
  languageCode?: string;
}

export const WritingAssistantModal: React.FC<WritingAssistantModalProps> = ({
  open,
  content,
  onUpdateContent,
  onClose,
  languageCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [toneNotice, setToneNotice] = useState<string | null>(null);

  const scoreData = useMemo(() => analyzeWriting(content, languageCode), [content, languageCode]);
  const { overall, correctness, clarity, engagement, delivery, detectedTone, issues } = scoreData;

  const filteredIssues = useMemo(() => {
    if (selectedCategory === 'all') return issues;
    return issues.filter((i) => i.category === selectedCategory);
  }, [issues, selectedCategory]);

  if (!open) return null;

  const handleApplyFix = (issue: WritingIssue) => {
    const updated = applySingleFix(content, issue);
    onUpdateContent(updated);
    setToneNotice(`Fixed: "${issue.original}" → "${issue.replacement}"`);
    setTimeout(() => setToneNotice(null), 2200);
  };

  const handleApplyAll = () => {
    const updated = applyAllImprovements(content, issues);
    onUpdateContent(updated);
    setToneNotice(`All ${issues.length} improvements applied successfully!`);
    setTimeout(() => setToneNotice(null), 2500);
  };

  const handleToneChange = (targetTone: 'professional' | 'direct' | 'casual' | 'academic') => {
    const updated = adjustTone(content, targetTone);
    onUpdateContent(updated);
    setToneNotice(`Tone adjusted to ${targetTone.toUpperCase()}!`);
    setTimeout(() => setToneNotice(null), 2400);
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (sc >= 65) return 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-600 dark:text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getCategoryBadge = (cat: IssueCategory) => {
    switch (cat) {
      case 'correctness':
        return {
          label: 'Correctness',
          classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'clarity':
        return {
          label: 'Clarity',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'engagement':
        return {
          label: 'Vocabulary',
          classes: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'anti-ai':
        return {
          label: 'Anti-AI Guardian',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="writing-assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="writing-assistant-title" className="text-base font-semibold text-foreground">
                  Writing Intelligence Suite
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary rounded-full uppercase tracking-wider">
                  Pro Assistant
                </span>
              </div>
              <p className="text-xs text-muted">
                Grammar correctness, conciseness, vocabulary upgrades &amp; anti-AI human guardian
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Action Notice Banner */}
        {toneNotice && (
          <div className="mx-5 my-2.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{toneNotice}</span>
          </div>
        )}

        {/* Dashboard: Score Ring & 4 Pillars */}
        <div className="px-5 py-4 border-b border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(
                overall
              )}`}
            >
              <span className="text-2xl font-extrabold font-mono tracking-tight">{overall}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold">Score</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {overall >= 85 ? 'Publication Ready' : overall >= 65 ? 'Good Progress' : 'Needs Polish'}
                </span>
                <span className="text-xs text-muted">
                  · {issues.length} {issues.length === 1 ? 'suggestion' : 'suggestions'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted font-mono flex-wrap">
                <span>Correctness: <strong>{correctness}%</strong></span>
                <span>Clarity: <strong>{clarity}%</strong></span>
                <span>Vocab: <strong>{engagement}%</strong></span>
                <span>Human Flow: <strong>{delivery}%</strong></span>
              </div>
            </div>
          </div>

          {issues.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAll}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>Fix All ({issues.length} Improvements)</span>
            </button>
          )}
        </div>

        {/* Tone Adjuster Bar */}
        <div className="px-5 py-2.5 border-b border-border bg-surface-hover/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Tone: <strong>{detectedTone}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted text-[11px] hidden sm:inline">Rewrite As:</span>
            {(['direct', 'professional', 'casual', 'academic'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleToneChange(t)}
                className="px-2 py-0.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-foreground text-[11px] capitalize transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-border px-5 gap-2 bg-surface overflow-x-auto text-xs">
          {(
            [
              { id: 'all', label: `All (${issues.length})` },
              { id: 'correctness', label: `Correctness (${issues.filter((i) => i.category === 'correctness').length})` },
              { id: 'clarity', label: `Clarity (${issues.filter((i) => i.category === 'clarity').length})` },
              { id: 'engagement', label: `Vocabulary (${issues.filter((i) => i.category === 'engagement').length})` },
              { id: 'anti-ai', label: `Anti-AI (${issues.filter((i) => i.category === 'anti-ai').length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`py-3 px-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
                selectedCategory === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Issues List Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-sm">
          {filteredIssues.length === 0 ? (
            !content.trim() ? (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Your Document is Empty
                  </h3>
                  <p className="text-xs text-muted max-w-sm mt-1">
                    Type or dictate notes in VoiceScribe to get real-time grammar, clarity, and Anti-AI feedback.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let sample = "We was going to the office in order to complete teh project. It was a very good meeting, and i am agree that we must delve into the rich tapestry of ideas — without further ado.";
                    if (languageCode?.startsWith('hi')) {
                      sample = "हम वहाँ जा रहे थे क्युकि समय कम था । यह बहुत अच्छा प्रयास है और हमे समृद्ध ताने-बाने को बिना किसी देरी के समझना चाहिए।";
                    } else if (languageCode?.startsWith('es')) {
                      sample = "Nosotros trabajamos con el fin de avanzar en el rico tapiz sin más preámbulos. Fue una reunion muy buena y habia mucho entusiasmo.";
                    } else if (languageCode?.startsWith('fr')) {
                      sample = "Nous travaillons afin de progresser dans une riche tapisserie sans plus attendre. C'est très bon et nous allons plonger dans les détails.";
                    }
                    onUpdateContent(sample);
                    setToneNotice("Sample test draft loaded with grammar & clarity issues!");
                    setTimeout(() => setToneNotice(null), 2500);
                  }}
                  className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all"
                >
                  Load Sample Text with Grammar Issues to Test
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Zero Issues in This Category!
                  </h3>
                  <p className="text-xs text-muted max-w-sm mt-1">
                    Your text is crisp, grammatically sound, and free of automated AI clichés.
                  </p>
                </div>
              </div>
            )
          ) : (
            filteredIssues.map((issue) => {
              const badge = getCategoryBadge(issue.category);
              return (
                <div
                  key={issue.id}
                  className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{issue.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="line-through text-rose-500/80 font-mono text-xs bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {issue.original}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {issue.replacement}
                      </span>
                    </div>

                    <p className="text-xs text-muted">{issue.description}</p>
                    <p className="text-[11px] text-muted/80 font-mono italic">{issue.context}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyFix(issue)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-muted">
          <span>Client-side natural language processing &bull; Zero server data logging</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
