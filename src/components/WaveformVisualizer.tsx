import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isListening: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

export function WaveformVisualizer({ isListening, analyserRef }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 96;
    const height = 24;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 16;
    const barWidth = 3;
    const gap = (width - barCount * barWidth) / (barCount - 1);

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.fillStyle = isDark ? 'rgba(148, 175, 168, 0.35)' : 'rgba(84, 112, 105, 0.32)';
      for (let i = 0; i < barCount; i++) {
        const barHeight = 3;
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        ctx.fill();
      }
    };

    if (!isListening) {
      drawStatic();
      return;
    }

    let rafId = 0;
    const bufferLength = analyserRef.current?.frequencyBinCount ?? 64;
    const dataArray = new Uint8Array(bufferLength);
    let phase = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const rootStyle = getComputedStyle(document.documentElement);
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.fillStyle =
        rootStyle.getPropertyValue('--pfx-danger').trim() || (isDark ? '#F87171' : '#DC2626');

      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      phase += 0.14;
      for (let i = 0; i < barCount; i++) {
        let normalized = 0.18;
        if (analyser) {
          const idx = Math.min(dataArray.length - 1, Math.floor((i / barCount) * (dataArray.length * 0.6)));
          normalized = Math.max(0.16, dataArray[idx] / 255);
        } else {
          // Gentle fallback wave if microphone analyser isn't attached yet
          normalized = 0.25 + 0.2 * Math.sin(phase + i * 0.55);
        }
        const barHeight = Math.max(3, Math.min(height - 2, normalized * height));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isListening, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="audio-waveform"
      aria-hidden="true"
      className="w-12 sm:w-24 h-6 shrink-0"
    />
  );
}
