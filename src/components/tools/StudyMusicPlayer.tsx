'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, Volume2, Timer as TimerIcon, X } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian-date';
import { toast } from 'sonner';

// ===== Preset definitions =====
type NoiseKind = 'white' | 'pink' | 'brown';
type FilterKind = BiquadFilterType;

interface Preset {
  id: string;
  name: string;
  emoji: string;
  color: string;
  noise: NoiseKind;
  filterType: FilterKind;
  filterFreq: number;
  q: number;
  // Optional slow gain modulation (LFO) for swelling effects (e.g. waves)
  lfo?: { freq: number; depth: number };
  // Output trim to keep levels comfortable per preset
  trim: number;
}

const PRESETS: Preset[] = [
  {
    id: 'rain',
    name: 'باران',
    emoji: '🌧️',
    color: 'var(--accent)',
    noise: 'white',
    filterType: 'lowpass',
    filterFreq: 2400,
    q: 0.7,
    trim: 0.55,
  },
  {
    id: 'ocean',
    name: 'امواج',
    emoji: '🌊',
    color: 'var(--accent)',
    noise: 'brown',
    filterType: 'lowpass',
    filterFreq: 700,
    q: 0.5,
    lfo: { freq: 0.12, depth: 0.4 },
    trim: 0.85,
  },
  {
    id: 'forest',
    name: 'نسیم',
    emoji: '🍃',
    color: 'var(--accent)',
    noise: 'white',
    filterType: 'highpass',
    filterFreq: 2000,
    q: 0.4,
    trim: 0.32,
  },
  {
    id: 'fire',
    name: 'آتش',
    emoji: '🔥',
    color: 'var(--accent)',
    noise: 'brown',
    filterType: 'lowpass',
    filterFreq: 900,
    q: 0.6,
    trim: 0.75,
  },
  {
    id: 'library',
    name: 'کتابخانه',
    emoji: '📚',
    color: 'var(--accent)',
    noise: 'pink',
    filterType: 'lowpass',
    filterFreq: 1100,
    q: 0.5,
    trim: 0.28,
  },
  {
    id: 'cafe',
    name: 'کافه',
    emoji: '☕',
    color: '#D97706',
    noise: 'brown',
    filterType: 'bandpass',
    filterFreq: 480,
    q: 0.35,
    trim: 0.7,
  },
];

const TIMER_OPTIONS = [5, 10, 15, 20] as const;

// ===== Noise buffer generators =====
function createNoiseBuffer(
  ctx: AudioContext,
  type: NoiseKind,
  seconds = 3
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    // Paul Kellet's refined pink noise filter
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    // brown — integrated white noise (rumble / crackle-like)
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

// ===== Component =====
export default function StudyMusicPlayer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [audioSupported, setAudioSupported] = useState(true);

  // Web Audio refs
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const waveGainRef = useRef<GainNode | null>(null);
  const volumeGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const currentPresetIdRef = useRef<string | null>(null);

  // Timer interval
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect Web Audio API support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      setAudioSupported(false);
    }
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      teardownSource();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (ctxRef.current) {
        try {
          void ctxRef.current.close();
        } catch {
          /* no-op */
        }
        ctxRef.current = null;
      }
    };
  }, []);

  const selectedPreset = PRESETS.find((p) => p.id === selectedId) || null;

  const ensureContext = useCallback((): AudioContext | null => {
    if (!audioSupported) return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      setAudioSupported(false);
      return null;
    }
    if (!ctxRef.current) {
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, [audioSupported]);

  const teardownSource = useCallback(() => {
    // Stop and disconnect source/filter/gains/lfo
    try {
      if (sourceRef.current) {
        try {
          sourceRef.current.onended = null;
          sourceRef.current.stop();
        } catch {
          /* already stopped */
        }
        try {
          sourceRef.current.disconnect();
        } catch {
          /* no-op */
        }
        sourceRef.current = null;
      }
    } catch {
      /* no-op */
    }
    try {
      lfoRef.current?.stop();
    } catch {
      /* no-op */
    }
    try {
      filterRef.current?.disconnect();
      waveGainRef.current?.disconnect();
      volumeGainRef.current?.disconnect();
      lfoGainRef.current?.disconnect();
    } catch {
      /* no-op */
    }
    sourceRef.current = null;
    filterRef.current = null;
    waveGainRef.current = null;
    volumeGainRef.current = null;
    lfoRef.current = null;
    lfoGainRef.current = null;
    currentPresetIdRef.current = null;
  }, []);

  const buildSource = useCallback(
    (preset: Preset) => {
      const ctx = ensureContext();
      if (!ctx) return false;

      // Resume in case it was suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {
          /* no-op */
        });
      }

      // Tear down any previous graph
      try {
        if (sourceRef.current) {
          try {
            sourceRef.current.onended = null;
            sourceRef.current.stop();
          } catch {
            /* no-op */
          }
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        try {
          lfoRef.current?.stop();
        } catch {
          /* no-op */
        }
        lfoRef.current = null;
        filterRef.current?.disconnect();
        waveGainRef.current?.disconnect();
        volumeGainRef.current?.disconnect();
        lfoGainRef.current?.disconnect();
      } catch {
        /* no-op */
      }

      // Build noise source
      const buffer = createNoiseBuffer(ctx, preset.noise, 3);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Filter shaping
      const filter = ctx.createBiquadFilter();
      filter.type = preset.filterType;
      filter.frequency.value = preset.filterFreq;
      filter.Q.value = preset.q;

      // waveGain: base + optional LFO modulation (oscillates between base-depth .. base+depth)
      const waveGain = ctx.createGain();
      const baseWave = 0.6;
      waveGain.gain.value = baseWave;

      // volumeGain: user volume × preset trim
      const volumeGain = ctx.createGain();
      const targetVol = (volume / 100) * preset.trim;
      volumeGain.gain.value = targetVol;

      // Graph: source → filter → waveGain → volumeGain → destination
      source.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(volumeGain);
      volumeGain.connect(ctx.destination);

      // Optional LFO for swelling effects (e.g. ocean waves)
      if (preset.lfo) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = preset.lfo.freq;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = preset.lfo.depth * baseWave;
        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);
        lfo.start();
        lfoRef.current = lfo;
        lfoGainRef.current = lfoGain;
      }

      source.start();

      sourceRef.current = source;
      filterRef.current = filter;
      waveGainRef.current = waveGain;
      volumeGainRef.current = volumeGain;
      currentPresetIdRef.current = preset.id;
      return true;
    },
    [ensureContext, volume]
  );

  const startTimer = useCallback(
    (minutes: number) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerMinutes(minutes);
      setTimeLeft(minutes * 60);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished — auto-stop
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            // Stop playback
            const ctx = ctxRef.current;
            if (ctx && ctx.state === 'running') {
              void ctx.suspend().catch(() => {
                /* no-op */
              });
            }
            setIsPlaying(false);
            setTimerMinutes(null);
            toast.success('زمان تمرکز تموم شد! 🌿');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    []
  );

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerMinutes(null);
    setTimeLeft(0);
  }, []);

  const handleSelectPreset = useCallback(
    async (preset: Preset) => {
      setSelectedId(preset.id);
      const ok = buildSource(preset);
      if (ok) {
        setIsPlaying(true);
        // If a timer was active, keep counting (don't reset)
      } else {
        setIsPlaying(false);
        toast.error('مرورگر شما از پخش صدا پشتیبانی نمی‌کنه');
      }
    },
    [buildSource]
  );

  const handleTogglePlay = useCallback(async () => {
    if (!selectedPreset) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (isPlaying) {
      // Pause → suspend context
      try {
        await ctx.suspend();
      } catch {
        /* no-op */
      }
      setIsPlaying(false);
      // Pause the timer countdown too (visual freeze), keep timerMinutes
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    } else {
      // Resume — if source was torn down (shouldn't be, but be safe), rebuild
      if (!sourceRef.current || currentPresetIdRef.current !== selectedPreset.id) {
        buildSource(selectedPreset);
      } else {
        try {
          await ctx.resume();
        } catch {
          /* no-op */
        }
      }
      setIsPlaying(true);
      // Resume timer countdown if a timer is set and time remains
      if (timerMinutes && timeLeft > 0) {
        const remaining = timeLeft;
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              const c = ctxRef.current;
              if (c && c.state === 'running') {
                void c.suspend().catch(() => {
                  /* no-op */
                });
              }
              setIsPlaying(false);
              setTimerMinutes(null);
              toast.success('زمان تمرکز تموم شد! 🌿');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        // Restore remaining (it was already in state, just restart interval)
        void remaining;
      }
    }
  }, [isPlaying, selectedPreset, buildSource, timerMinutes, timeLeft]);

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolume(v);
      const ctx = ctxRef.current;
      const gain = volumeGainRef.current;
      if (!ctx || !gain || !selectedPreset) return;
      const target = (v / 100) * selectedPreset.trim;
      // Smooth ramp to avoid clicks
      const now = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(target, now + 0.05);
      } catch {
        gain.gain.value = target;
      }
    },
    [selectedPreset]
  );

  const handleBack = useCallback(() => {
    // Stop playback and return to grid
    teardownSource();
    if (ctxRef.current && ctxRef.current.state === 'running') {
      void ctxRef.current.suspend().catch(() => {
        /* no-op */
      });
    }
    setIsPlaying(false);
    clearTimer();
    setSelectedId(null);
  }, [teardownSource, clearTimer]);

  const handleSetTimer = useCallback(
    (minutes: number) => {
      if (timerMinutes === minutes) {
        clearTimer();
        return;
      }
      startTimer(minutes);
    },
    [timerMinutes, startTimer, clearTimer]
  );

  // Format remaining time as MM:SS in Persian digits
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${toPersianDigits(String(m).padStart(2, '0'))}:${toPersianDigits(
      String(s).padStart(2, '0')
    )}`;
  };

  // ===== Unsupported fallback =====
  if (!audioSupported) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
          <Volume2 className="w-7 h-7 text-[var(--accent)]" />
        </div>
        <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
          پخش صدا پشتیبانی نمی‌شه
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          متأسفانه مرورگر شما از Web Audio API پشتیبانی نمی‌کنه.
          <br />
          لطفاً از یک مرورگر مدرن استفاده کن.
        </p>
      </div>
    );
  }

  // ===== Grid view (preset selection) =====
  if (!selectedPreset) {
    return (
      <div>
        <p className="text-xs text-[var(--foreground-subtle)] mb-3 px-1 uppercase tracking-wider font-semibold">
          یه صدا انتخاب کن
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map((preset, index) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              onClick={() => handleSelectPreset(preset)}
              className="group surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 flex flex-col items-center gap-3 text-center min-h-[130px] justify-center"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: 'var(--accent-soft)',
                  boxShadow: 'none',
                }}
              >
                <span className="leading-none">{preset.emoji}</span>
              </div>
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {preset.name}
              </span>
            </motion.button>
          ))}
        </div>
        <p className="text-[11px] text-[var(--foreground-subtle)] mt-4 text-center leading-relaxed">
          صداها به‌صورت زنده با Web Audio API ساخته می‌شن — نیاز به اینترنت نداری.
        </p>
      </div>
    );
  }

  // ===== Now Playing view =====
  const timerActive = timerMinutes !== null && timeLeft > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="self-start flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-4 -mt-1"
      >
        <ChevronRight className="w-3.5 h-3.5 flip-rtl" />
        <span>تغییر صدا</span>
      </button>

      {/* Pulsing emoji + ring */}
      <div className="relative flex items-center justify-center mb-5">
        <AnimatePresence>
          {isPlaying && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full"
                style={{
                  border: '1.5px solid var(--border-strong)',
                }}
              />
              <motion.div
                key="ring2"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 1.2, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full"
                style={{
                  border: '1.5px solid var(--border)',
                }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            isPlaying
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={
            isPlaying
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          className="relative w-28 h-28 rounded-full flex items-center justify-center text-6xl"
          style={{
            background: 'var(--accent-soft)',
            boxShadow: 'inset 0 0 0 1px var(--border-strong)',
          }}
        >
          <span className="leading-none">{selectedPreset.emoji}</span>
        </motion.div>
      </div>

      {/* Sound name */}
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
        {selectedPreset.name}
      </h3>
      <p className="text-xs text-[var(--foreground-muted)] mb-5">
        {isPlaying ? 'در حال پخش' : 'متوقف شده'}
      </p>

      {/* Timer countdown (if active) */}
      <AnimatePresence>
        {timerActive && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-[var(--gold-soft)] border border-[var(--gold)]/20"
          >
            <TimerIcon className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span className="text-xs font-semibold text-[var(--gold)] tabular-nums tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play / Pause */}
      <button
        onClick={handleTogglePlay}
        className="glow-hover btn-hover w-16 h-16 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors mb-6"
        aria-label={isPlaying ? 'توقف' : 'پخش'}
      >
        {isPlaying ? (
          <Pause className="w-7 h-7" />
        ) : (
          <Play className="w-7 h-7 mr-1" />
        )}
      </button>

      {/* Volume slider */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>بلندی صدا</span>
          </span>
          <span className="text-xs font-semibold text-[var(--foreground)] tabular-nums">
            {toPersianDigits(volume)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="study-music-slider"
          style={{
            background: `linear-gradient(to left, var(--accent) ${volume}%, rgba(255,255,255,0.08) ${volume}%)`,
          }}
          aria-label="بلندی صدا"
        />
      </div>

      {/* Timer options */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5">
            <TimerIcon className="w-3.5 h-3.5" />
            <span>تایمر توقف خودکار</span>
          </span>
          {timerMinutes !== null && (
            <button
              onClick={clearTimer}
              className="text-[11px] text-[var(--foreground-subtle)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>لغو</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TIMER_OPTIONS.map((mins) => {
            const isActive = timerMinutes === mins;
            return (
              <button
                key={mins}
                onClick={() => handleSetTimer(mins)}
                className={`py-2 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'surface-1 border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
                }`}
              >
                {toPersianDigits(mins)}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--foreground-subtle)] mt-2 text-center leading-relaxed">
          {timerActive
            ? `پخش بعد از ${toPersianDigits(timerMinutes!)} دقیقه خودکار متوقف می‌شه`
            : 'برای توقف خودکار، زمان رو انتخاب کن'}
        </p>
      </div>
    </div>
  );
}
