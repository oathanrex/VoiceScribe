import { LegalSection } from './Footer';

interface GuideViewProps {
  section: LegalSection;
  onSectionChange: (section: LegalSection) => void;
  onBackToStudio: () => void;
}

const SECTIONS: { id: LegalSection; label: string }[] = [
  { id: 'article', label: 'Dictation Guide' },
  { id: 'about', label: 'About & Contact' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms of Use' },
];

export function GuideView({ section, onSectionChange, onBackToStudio }: GuideViewProps) {
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8">
      {/* Sub-navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div
          role="group"
          aria-label="Guide and compliance sections"
          className="inline-flex items-center gap-1 p-1 bg-well rounded-card border border-border/60 overflow-x-auto"
        >
          {SECTIONS.map((item) => {
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-surface text-foreground shadow-surface'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBackToStudio}
          className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-control transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          Open Dictation Studio
        </button>
      </div>

      <article className="bg-surface border border-border/80 rounded-2xl shadow-surface p-6 sm:p-10">
        {section === 'article' && (
          <div className="max-w-[66ch] mx-auto space-y-6 text-foreground">
            <header className="pb-5 border-b border-border/60">
              <p className="text-xs font-medium text-primary mb-2">Practical Writing Guide</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-foreground">
                Voice Typing Without the Clutter: A Practical Guide to Fast, Private Speech-to-Text
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
                Most of us think faster than we type, yet everyday writing still gets bottlenecked by
                keyboards, tiny mobile screens, and noisy note-taking apps. Here is how modern
                browser speech recognition works—and how to build a reliable voice-first writing
                habit.
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Why Voice Dictation Beats Raw Typing Speed for First Drafts
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                An average keyboard typist writes around 40 to 55 words per minute, stopping often to
                fix spelling slips or second-guess a phrase. Natural conversational speech flows at
                120 to 150 words per minute. Separating drafting from editing—capturing your ideas
                out loud first, then refining structure afterward—removes the blank-page friction
                that stalls emails, study notes, and long-form articles.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                VoiceScribe is built around that single workflow. Instead of burying the notepad
                beneath promotional banners or complex toolbars, the workspace opens straight to a
                clean sheet of paper. You pick your language, press <strong>Start Dictation</strong>
                , and watch spoken phrases settle directly onto the page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                How Browser Speech Recognition Works Under the Hood
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                When you start a session in Google Chrome or Microsoft Edge, VoiceScribe uses the
                browser’s built-in <strong>Web Speech API</strong>. Audio from your microphone is
                streamed securely over HTTPS to your browser’s speech recognition engine, which
                returns two streams of text: interim guesses that update as you finish a clause, and
                finalized phrases once a pause is detected.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Because VoiceScribe stores your drafts exclusively in your browser’s local storage,
                your written notes never sit in an external database. You stay in control of every
                word—and when a draft is ready, you can copy it, check word frequency in Draft
                Analytics, or export clean Markdown, Word, or PDF files.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Five Habits for Near-Zero Recognition Mistakes
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-[1.7] text-foreground/90">
                <li>
                  <strong>Speak in full clauses rather than isolated words:</strong> Speech models
                  use surrounding context to pick between homophones like <em>their</em>,{' '}
                  <em>there</em>, and <em>they’re</em>.
                </li>
                <li>
                  <strong>Use spoken punctuation cues:</strong> Saying “comma”, “full stop”,
                  “question mark”, or “new paragraph” keeps your hands off the keyboard while
                  structuring clean prose.
                </li>
                <li>
                  <strong>Keep the microphone close and steady:</strong> Earbuds or a simple USB
                  headset cut room echo dramatically compared to a distant laptop mic.
                </li>
                <li>
                  <strong>Switch to Readability or Focus Mode for long sessions:</strong> Narrowing
                  column width and opening line height reduces eye fatigue when reviewing multi-page
                  drafts.
                </li>
                <li>
                  <strong>Match the exact regional dialect:</strong> Selecting English (India),
                  English (UK), हिन्दी, or Español (México) tunes acoustic pronunciation models to
                  your natural cadence.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-2 border-t border-border/60">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Is VoiceScribe free to use without creating an account?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Yes. VoiceScribe requires no sign-up, subscription, or software installation. Open
                  the Studio in a supported browser and start dictating right away.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Why does live voice typing require an internet connection?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Modern browsers perform neural speech-to-text decoding via cloud acoustic models
                  so they can support over 100 languages accurately without downloading gigabytes of
                  language packs onto your device.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Can I dictate in Indian languages and right-to-left scripts?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Yes. VoiceScribe supports हिन्दी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ಕನ್ನಡ,
                  മലയാളം, ਪੰਜਾਬੀ, and automatically switches editor text direction to RTL for اردو,
                  العربية, فارسی, and עברית.
                </p>
              </div>
            </section>
          </div>
        )}

        {section === 'about' && (
          <div className="max-w-[66ch] mx-auto space-y-5 text-foreground">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">About VoiceScribe</h1>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              VoiceScribe is a lightweight, privacy-first speech-to-text workspace built for writers,
              students, journalists, and everyday communicators who want fast voice dictation
              without cluttered landing pages or forced logins.
            </p>
            <h2 className="text-lg font-semibold pt-2">Our Design Philosophy</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              We believe browser utilities should stay calm and respectful of your attention. Every
              control in the Studio—from Readability Mode and Focus Mode to local draft persistence
              and clean Markdown, PDF, and Word exports—is designed to keep you in flow.
            </p>
            <h2 className="text-lg font-semibold pt-2">Contact & Support</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              Have feedback, bug reports, or language requests? Reach our team directly by email at{' '}
              <a
                href="mailto:oathanrex@gmail.com"
                className="text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                oathanrex@gmail.com
              </a>
              .
            </p>
          </div>
        )}

        {section === 'privacy' && (
          <div className="max-w-[66ch] mx-auto space-y-5 text-foreground">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-muted tabular-nums">Last updated: November 2026</p>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              VoiceScribe respects your privacy and is designed so your written notes remain on your
              own device.
            </p>
            <h2 className="text-lg font-semibold pt-2">1. Local Storage of Your Notes</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              All drafts, saved notes, selected dictation languages, and display preferences are
              stored exclusively inside your browser’s <code>localStorage</code>. We do not collect,
              sync, or store your dictated text on our own servers.
            </p>
            <h2 className="text-lg font-semibold pt-2">2. Microphone & Speech Recognition</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              VoiceScribe requests microphone permission solely when you click{' '}
              <strong>Start Dictation</strong>. Audio is processed through your browser’s native Web
              Speech API (for example, Google’s speech recognition service in Chrome) over an
              encrypted HTTPS connection.
            </p>
            <h2 className="text-lg font-semibold pt-2">3. Cookies & Advertising Disclosures</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              If third-party advertising partners such as Google AdSense are enabled on this site,
              vendors may use cookies or similar identifiers to serve ads based on prior visits to
              this or other websites. Users may opt out of personalized advertising by visiting{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Google Ads Settings
              </a>{' '}
              or managing cookie permissions in their browser settings.
            </p>
            <h2 className="text-lg font-semibold pt-2">4. Contact</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              For privacy inquiries, contact{' '}
              <a
                href="mailto:oathanrex@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                oathanrex@gmail.com
              </a>
              .
            </p>
          </div>
        )}

        {section === 'terms' && (
          <div className="max-w-[66ch] mx-auto space-y-5 text-foreground">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Terms of Use</h1>
            <p className="text-xs text-muted tabular-nums">Last updated: November 2026</p>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              By using VoiceScribe, you agree to the following simple terms governing access to this
              browser-based dictation tool.
            </p>
            <h2 className="text-lg font-semibold pt-2">1. Service Availability</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              VoiceScribe is provided free of charge “as is”. Live speech-to-text accuracy and
              availability depend on your device microphone, internet connection, and browser Web
              Speech API support.
            </p>
            <h2 className="text-lg font-semibold pt-2">2. Ownership of Content</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              You retain 100% ownership and responsibility for all notes, articles, and exported
              documents you create in VoiceScribe. Because data resides locally in your browser,
              remember to export important documents before clearing site data.
            </p>
            <h2 className="text-lg font-semibold pt-2">3. Acceptable Use</h2>
            <p className="text-[15px] leading-[1.75] text-foreground/90">
              You agree not to abuse, reverse-engineer, or disrupt the service or attempt
              automated scraping against hosted resources.
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
