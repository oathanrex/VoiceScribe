<div align="center">

# 🎙️ VoiceScribe
### The Universal Speech-to-Text Studio & Real-Time Voice Typing Engine for 100+ Languages

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-success.svg?style=for-the-badge&logo=github)](https://oathanrex.github.io/VoiceScribe/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20On--Device-brightgreen.svg?style=for-the-badge&logo=shield)](https://oathanrex.github.io/VoiceScribe/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Curated by Oathan Rex](https://img.shields.io/badge/Author-Oathan%20Rex-0d6e52.svg?style=for-the-badge)](https://github.com/oathanrex)

*A distraction-free, privacy-first voice dictation studio that transcribes continuous long-form speech in real-time with hands-free punctuation, multilingual voice commands in 20+ languages, audio visualizer, auto-correct, active line focus, and multi-format document export.*

[Explore Live Demo](https://oathanrex.github.io/VoiceScribe/) • [Voice Commands Guide](#-hands-free-multilingual-voice-commands) • [Key Capabilities](#-key-features) • [Browser Compatibility](#-browser-support) • [Local Setup](#-quick-start)

---

</div>

## 🌟 Why VoiceScribe?

Most speech-to-text tools suffer from critical flaws:
- They upload sensitive voice recordings to remote cloud servers.
- They halt recording after brief silences or disconnect mid-thought.
- Punctuation commands only work in English, forcing multilingual writers to manually type symbols.
- Cluttered user interfaces distract from the flow state of long writing sessions.

**VoiceScribe** solves this with an uncompromising focus on **writer ergonomics, multilingual accessibility, and zero-compromise privacy**:

```
[ Spoken Voice Audio ]
        │
        ▼ (Web Speech API - 100% Client-Side)
[ Continuous Recognition Engine ] ──► [ Real-Time Audio Meter / Analyser ]
        │
        ├──► [ Multilingual Voice Command Parser (20+ Languages) ]
        │         ├── Insert Punctuation (., !, ?, ।, ۔, etc.)
        │         ├── Control Actions (Newline, Paragraph, Stop, Clear, Copy)
        │         └── Currency & Math Symbols (₹, $, €, £, %, @)
        │
        ├──► [ Real-time Phonetic Auto-Correct & Capitalization ]
        │
        ▼
[ Canvas & Distraction-Free Zen Editor ]
        │
        ├── Active Line Glow / Focus Mode
        ├── Pomodoro Focus Timer & Daily Word Goals
        ├── Real-Time Top Words & Readability Metrics
        └── Multi-Format Export (PDF, Word, Markdown, Plain Text, Web Share)
```

---

## 🎯 Key Features

### 1. 100+ Global Languages & Regional Dialects
- Comprehensive coverage including **English (US, UK, IN, AU, CA)**, **हिन्दी (Hindi)**, **বাংলা (Bengali)**, **Español**, **Français**, **Deutsch**, **Italiano**, **Português**, **Русский**, **العربية (Arabic)**, **தமிழ் (Tamil)**, **తెలుగు (Telugu)**, **मराठी (Marathi)**, **ગુજરાતી (Gujarati)**, **ਪੰਜਾਬੀ (Punjabi)**, **اردو (Urdu)**, **日本語 (Japanese)**, **中文 (Chinese)**, **Türkçe**, **Nederlands**, **Polski**, and 80+ more.
- Instant search and language switching with automatic script and direction adjustments (LTR and RTL).

### 2. Hands-Free Multilingual Voice Commands
Speak naturally while dictating without lifting your fingers from the keyboard or microphone:
- **English**: Say *"new line"*, *"new paragraph"*, *"comma"*, *"full stop"*, *"question mark"*, *"stop listening"*, *"clear everything"*.
- **हिन्दी (Hindi)**: बोलें *"नई पंक्ति"*, *"नया अनुच्छेद"*, *"पूर्ण विराम"*, *"अल्पविराम"*, *"प्रश्न चिन्ह"*, *"डिक्टेशन रोको"*, *"सब साफ़ करो"*.
- **Español**: Di *"nueva línea"*, *"nuevo párrafo"*, *"punto"*, *"coma"*, *"signo de interrogación"*, *"detener dictado"*.
- **Français**: Dites *"nouvelle ligne"*, *"nouveau paragraphe"*, *"point"*, *"virgule"*, *"point d'interrogation"*, *"arrêter la dictée"*.
- **বাংলা (Bengali)**: বলুন *"নতুন লাইন"*, *"নতুন অনুচ্ছেদ"*, *"দাঁড়ি"*, *"কমা"*, *"প্রশ্নবোধক চিহ্ন"*.
- **اردو (Urdu)**: بولیں *"نئی سطر"*, *"نیا پیراگراف"*, *"ختمہ"*, *"سکتہ"*, *"سوالیہ نشان"*.
- Interactive **Quick Punctuation Reference** chips: Click any card to insert it directly into your draft.

### 3. Focus & Ergonomics
- **Active Focus Glow**: Real-time line highlighting so your eyes never lose track of where speech is being transcribed.
- **Pomodoro Focus Timer**: Built-in 25-minute sprints and countdown timer to supercharge writing velocity.
- **Daily Word Count Goals**: Set daily targets (500, 1000, 2000 words) with instant visual celebration feedback.
- **Typography Sizing & Font Stack**: Instant switching between Sans, Serif (Editorial), and Monospace typography.

### 4. Text-to-Speech (TTS) & Audio Playback
- Read aloud your transcribed notes with adjustable playback rate (0.5x, 1x, 1.25x, 1.5x, 2x).
- Segment-synchronized highlighting as the synthesized voice reads each sentence aloud.

### 5. Multi-Format Professional Export
- **Export to PDF**: Produces a clean, formatted PDF document directly in-browser.
- **Export to Word (.docx)**: Preserves rich HTML headings and formatting for Microsoft Word.
- **Export to Markdown (.md)** & **Plain Text (.txt)**: Clean export for developers, Obsidian, and Notion.
- **Native Web Share**: Instantly share drafts via WhatsApp, Slack, Gmail, or native OS share sheets.

### 6. 100% Client-Side Privacy Guarantee
- No audio recordings or transcripts are ever transmitted to or stored on our servers.
- Automatic version history and draft autosave stored locally in your browser's encrypted LocalStorage.

---

## 🌐 Browser Support

VoiceScribe relies on the standard **W3C Web Speech API**. For the best continuous dictation experience, use browsers with native speech engines:

| Browser | Windows | macOS | Linux | Android | iOS |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Google Chrome** | ✅ 100% Full Support | ✅ 100% Full Support | ✅ 100% Full Support | ✅ Full Support | ⚠️ WebKit Limited |
| **Microsoft Edge** | ✅ 100% Full Support | ✅ 100% Full Support | ✅ 100% Full Support | ✅ Full Support | ⚠️ WebKit Limited |
| **Brave Browser** | ✅ 100% Full Support | ✅ 100% Full Support | ✅ 100% Full Support | ✅ Full Support | ⚠️ WebKit Limited |
| **Safari** | — | ⚠️ Limited Dictation | — | — | ⚠️ Siri Engine |

---

## ⚡ Quick Start & Local Development

### Prerequisites
- Node.js 18.0 or higher
- npm or bun

### 1. Clone & Install
```bash
git clone https://github.com/oathanrex/VoiceScribe.git
cd VoiceScribe
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

### 3. Run Automated Unit Tests (63/63 Passing)
```bash
npm test
```

### 4. Production Build
```bash
npm run build
```

---

## 🤝 Contributing

Contributions, language expansions, and new voice command heuristics are welcomed!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AddMoreLanguages`).
3. Commit your Changes (`git commit -m 'feat(commands): add Telugu voice punctuation'`).
4. Ensure all tests pass (`npm test`).
5. Open a Pull Request.

---

## 📄 License & Author

Created with ❤️ by **[Oathan Rex](https://github.com/oathanrex)** under the **[MIT License](LICENSE)**.
Explore more developer tools and utilities on **[oathanrex.github.io](https://oathanrex.github.io/)**.
