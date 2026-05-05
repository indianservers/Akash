"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSkyAudio() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const playClick = useCallback(() => {
    if (!enabled) return;
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 740;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }, [enabled, getContext]);

  useEffect(() => {
    if (!enabled) {
      ambientRef.current?.gain.gain.exponentialRampToValueAtTime(0.0001, contextRef.current?.currentTime ?? 0);
      ambientRef.current?.osc.stop((contextRef.current?.currentTime ?? 0) + 0.2);
      ambientRef.current = null;
      return;
    }

    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 83;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.012, ctx.currentTime + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    ambientRef.current = { osc, gain };

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.25);
    };
  }, [enabled, getContext]);

  return { audioEnabled: enabled, setAudioEnabled: setEnabled, playClick };
}
