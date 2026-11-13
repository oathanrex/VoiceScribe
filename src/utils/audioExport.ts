import { sanitizeExportFilename, triggerBlobDownload } from './exportDraft';

export type AudioExportExtension = 'webm' | 'ogg' | 'm4a';

export interface AudioFormatChoice {
  mimeType: string;
  extension: AudioExportExtension;
}

export interface AudioExportSupportEnv {
  hasWindow?: boolean;
  hasSpeechSynthesis?: boolean;
  hasSpeechSynthesisUtterance?: boolean;
  hasMediaRecorder?: boolean;
  hasDisplayMedia?: boolean;
}

export interface SpeechAudioExportProgress {
  status: 'preparing' | 'recording';
  chunkIndex?: number;
  totalChunks?: number;
}

export interface SpeechAudioExportOptions {
  title: string;
  content: string;
  languageCode: string;
  rate?: number;
  onStateChange?: (progress: SpeechAudioExportProgress) => void;
}

export type SpeechAudioExportResult =
  | { status: 'saved'; filename: string; mimeType: string }
  | { status: 'cancelled'; message: string }
  | { status: 'unsupported'; message: string }
  | { status: 'no-audio-track'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export interface SpeechAudioExportHandle {
  promise: Promise<SpeechAudioExportResult>;
  cancel: () => void;
}

const CANDIDATE_AUDIO_FORMATS: AudioFormatChoice[] = [
  { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
  { mimeType: 'audio/webm', extension: 'webm' },
  { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
  { mimeType: 'audio/mp4', extension: 'm4a' },
];

export function isSpeechAudioExportSupported(env?: AudioExportSupportEnv): boolean {
  if (env) {
    return Boolean(
      env.hasWindow &&
        env.hasSpeechSynthesis &&
        env.hasSpeechSynthesisUtterance &&
        env.hasMediaRecorder &&
        env.hasDisplayMedia
    );
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const hasSpeechSynthesis =
    'speechSynthesis' in window && Boolean(window.speechSynthesis);
  const hasUtterance = typeof SpeechSynthesisUtterance !== 'undefined';
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasDisplayMedia = Boolean(
    navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );

  return hasSpeechSynthesis && hasUtterance && hasMediaRecorder && hasDisplayMedia;
}

export function pickSupportedAudioFormat(
  isTypeSupported?: (mimeType: string) => boolean
): AudioFormatChoice {
  if (typeof isTypeSupported === 'function') {
    for (const candidate of CANDIDATE_AUDIO_FORMATS) {
      try {
        if (isTypeSupported(candidate.mimeType)) {
          return candidate;
        }
      } catch {
        // Ignore browser quirks throwing on probe
      }
    }
  }
  return { mimeType: '', extension: 'webm' };
}

export function buildSpeechExportText(title: string, plainText: string): string {
  const trimmedTitle = title.trim();
  const trimmedBody = plainText.trim();
  if (trimmedTitle && trimmedBody) {
    const endsWithPunctuation = /[.!?।]$/.test(trimmedTitle);
    return endsWithPunctuation
      ? `${trimmedTitle} ${trimmedBody}`
      : `${trimmedTitle}. ${trimmedBody}`;
  }
  return trimmedTitle || trimmedBody;
}

export function splitSpeechChunks(text: string, maxChars = 200): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const limit = Math.max(40, maxChars);
  const paragraphs = normalized
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const para of paragraphs) {
    const sentences = para
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let buffer = '';
    for (const sentence of sentences) {
      if (sentence.length > limit) {
        if (buffer) {
          chunks.push(buffer);
          buffer = '';
        }
        const words = sentence.split(/\s+/);
        let wordBuf = '';
        for (const word of words) {
          if (word.length > limit) {
            if (wordBuf) {
              chunks.push(wordBuf);
              wordBuf = '';
            }
            for (let i = 0; i < word.length; i += limit) {
              chunks.push(word.slice(i, i + limit));
            }
          } else if (!wordBuf) {
            wordBuf = word;
          } else if (wordBuf.length + 1 + word.length <= limit) {
            wordBuf += ` ${word}`;
          } else {
            chunks.push(wordBuf);
            wordBuf = word;
          }
        }
        if (wordBuf) {
          chunks.push(wordBuf);
        }
      } else if (!buffer) {
        buffer = sentence;
      } else if (buffer.length + 1 + sentence.length <= limit) {
        buffer += ` ${sentence}`;
      } else {
        chunks.push(buffer);
        buffer = sentence;
      }
    }
    if (buffer) {
      chunks.push(buffer);
    }
  }

  return chunks;
}

function stopStreamTracks(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // Ignore already-stopped tracks
    }
  }
}

export function startSpeechAudioExport(
  options: SpeechAudioExportOptions
): SpeechAudioExportHandle {
  let cancelled = false;
  let activeStream: MediaStream | null = null;
  let activeRecorder: MediaRecorder | null = null;
  let resolvePendingWait: (() => void) | null = null;

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }
    if (resolvePendingWait) {
      const resolve = resolvePendingWait;
      resolvePendingWait = null;
      resolve();
    }
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      try {
        activeRecorder.stop();
      } catch {
        // Ignore stop errors
      }
    }
    stopStreamTracks(activeStream);
    activeStream = null;
  };

  const run = async (): Promise<SpeechAudioExportResult> => {
    if (!isSpeechAudioExportSupported()) {
      return {
        status: 'unsupported',
        message: 'Speech audio export is not supported in this browser.',
      };
    }

    const spokenText = buildSpeechExportText(options.title, options.content);
    if (!spokenText) {
      return {
        status: 'empty',
        message: 'Write or dictate some text before exporting audio.',
      };
    }

    options.onStateChange?.({ status: 'preparing' });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      const errorName = err instanceof DOMException ? err.name : '';
      if (cancelled || errorName === 'NotAllowedError' || errorName === 'AbortError') {
        return {
          status: 'cancelled',
          message: 'Audio export cancelled.',
        };
      }
      return {
        status: 'error',
        message: 'Could not start browser audio capture for speech export.',
      };
    }

    activeStream = stream;

    if (cancelled) {
      stopStreamTracks(stream);
      activeStream = null;
      return { status: 'cancelled', message: 'Audio export cancelled.' };
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      stopStreamTracks(stream);
      activeStream = null;
      return {
        status: 'no-audio-track',
        message:
          'No audio track was shared. Enable "Share tab audio" in the browser prompt to save audio.',
      };
    }

    const audioStream = new MediaStream(audioTracks);
    const isSupportedFn =
      typeof MediaRecorder.isTypeSupported === 'function'
        ? (mime: string) => MediaRecorder.isTypeSupported(mime)
        : undefined;
    const format = pickSupportedAudioFormat(isSupportedFn);

    let recorder: MediaRecorder;
    try {
      recorder = format.mimeType
        ? new MediaRecorder(audioStream, { mimeType: format.mimeType })
        : new MediaRecorder(audioStream);
    } catch {
      try {
        recorder = new MediaRecorder(audioStream);
      } catch {
        stopStreamTracks(stream);
        activeStream = null;
        return {
          status: 'error',
          message: 'Browser MediaRecorder failed to initialize audio recording.',
        };
      }
    }

    activeRecorder = recorder;
    const recordedParts: BlobPart[] = [];
    let finishedSpeaking = false;

    const recorderStoppedPromise = new Promise<void>((resolve) => {
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedParts.push(event.data);
        }
      };
      recorder.onstop = () => resolve();
      recorder.onerror = () => resolve();
    });

    const handleTrackEnded = () => {
      if (!finishedSpeaking && !cancelled) {
        cancel();
      }
    };
    audioTracks[0].addEventListener('ended', handleTrackEnded, { once: true });

    try {
      recorder.start(250);
    } catch {
      audioTracks[0].removeEventListener('ended', handleTrackEnded);
      stopStreamTracks(stream);
      activeStream = null;
      activeRecorder = null;
      return {
        status: 'error',
        message: 'Unable to start audio recording.',
      };
    }

    const chunks = splitSpeechChunks(spokenText, 200);
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore pre-speak cancel error
    }

    const speakSingleChunk = (chunk: string): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        if (cancelled) {
          resolve(false);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = options.languageCode;
        utterance.rate = options.rate ?? 1;

        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          if (resolvePendingWait === onCancelSignal) {
            resolvePendingWait = null;
          }
          resolve(ok);
        };

        const onCancelSignal = () => finish(false);
        resolvePendingWait = onCancelSignal;

        utterance.onend = () => finish(!cancelled);
        utterance.onerror = () => finish(false);

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          finish(false);
        }
      });

    for (let i = 0; i < chunks.length; i++) {
      if (cancelled) break;
      options.onStateChange?.({
        status: 'recording',
        chunkIndex: i + 1,
        totalChunks: chunks.length,
      });
      const ok = await speakSingleChunk(chunks[i]);
      if (!ok || cancelled) {
        break;
      }
    }

    if (!cancelled) {
      await new Promise<void>((resolve) => {
        resolvePendingWait = resolve;
        window.setTimeout(() => {
          if (resolvePendingWait === resolve) {
            resolvePendingWait = null;
          }
          resolve();
        }, 160);
      });
    }

    finishedSpeaking = true;
    audioTracks[0].removeEventListener('ended', handleTrackEnded);

    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // Ignore stop errors
      }
    }
    await recorderStoppedPromise;

    stopStreamTracks(stream);
    activeStream = null;
    activeRecorder = null;

    if (cancelled) {
      return { status: 'cancelled', message: 'Audio export cancelled.' };
    }

    const outputMime = recorder.mimeType || format.mimeType || 'audio/webm';
    const audioBlob = new Blob(recordedParts, { type: outputMime });
    if (audioBlob.size === 0) {
      return {
        status: 'error',
        message: 'No audio was captured. Make sure "Share tab audio" is enabled.',
      };
    }

    const filename = sanitizeExportFilename(options.title, format.extension);
    triggerBlobDownload(audioBlob, filename);

    return {
      status: 'saved',
      filename,
      mimeType: audioBlob.type,
    };
  };

  return {
    promise: run(),
    cancel,
  };
}
