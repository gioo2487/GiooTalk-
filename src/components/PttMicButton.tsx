import React, { useEffect, useRef, useState } from "react";
import { playPttPressSound, playPttReleaseSound } from "../utils/walkieAudio";

interface PttMicButtonProps {
  channelName: string;
  onStartTalking?: () => void;
  onStopTalking?: (durationMs: number) => void;
}

const BAR_COUNT = 15;

export const PttMicButton: React.FC<PttMicButtonProps> = ({
  channelName,
  onStartTalking,
  onStopTalking,
}) => {
  const [isTalking, setIsTalking] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(8));

  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopMeter = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setBars(Array(BAR_COUNT).fill(8));
  };

  const startMeter = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Sin getUserMedia");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const nextBars = Array.from({ length: BAR_COUNT }, (_, idx) => {
          const bin = dataArray[idx % dataArray.length] || 0;
          const normalized = bin / 255;
          return Math.max(8, Math.min(42, Math.round(8 + normalized * 34)));
        });

        setBars(nextBars);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      const tickFallback = () => {
        const t = performance.now() / 110;
        const center = (BAR_COUNT - 1) / 2;
        const nextBars = Array.from({ length: BAR_COUNT }, (_, idx) => {
          const distFactor = 1 - Math.abs(idx - center) / (center + 1);
          const wave = Math.abs(Math.sin(t + idx * 0.55));
          return Math.max(8, Math.min(40, Math.round(8 + wave * distFactor * 30)));
        });
        setBars(nextBars);
        rafRef.current = requestAnimationFrame(tickFallback);
      };
      rafRef.current = requestAnimationFrame(tickFallback);
    }
  };

  const handlePressStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isTalking) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    startTimeRef.current = Date.now();
    setIsTalking(true);
    playPttPressSound();
    startMeter();
    onStartTalking?.();
  };

  const handlePressEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTalking) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const elapsed = Date.now() - startTimeRef.current;
    setIsTalking(false);
    stopMeter();
    playPttReleaseSound();
    onStopTalking?.(elapsed);
  };

  useEffect(() => {
    return () => stopMeter();
  }, []);

  return (
    <div className="gioo-ptt-stage">
      <div className="gioo-wave-container" aria-hidden="true">
        {bars.map((height, i) => (
          <span
            key={i}
            className="gioo-wave-bar"
            style={{ height: `${isTalking ? height : 8}px` }}
          />
        ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Mantén presionado para hablar en ${channelName}`}
        className={`gioo-ptt-ring ${isTalking ? "talking" : ""}`}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
      >
        <div className="gioo-ptt-core">
          <span aria-hidden="true">🎙️</span>
        </div>
      </div>

      <div className="gioo-ptt-label">
        {isTalking
          ? `TRANSMITIENDO EN ${channelName.toUpperCase()}...`
          : `MANTÉN PRESIONADO PARA HABLAR · ${channelName}`}
      </div>
    </div>
  );
};
