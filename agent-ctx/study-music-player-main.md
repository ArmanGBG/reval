# Task: study-music-player — Work Record

## Summary
Implemented a functional Study Music Player (ambient sound generator) in the Reval Tools Hub,
replacing the placeholder Focus Music modal content with a Web Audio API–based player that
generates 6 ambient sound presets with no external audio files.

## Files Changed
1. **`src/components/tools/StudyMusicPlayer.tsx`** (NEW)
   - Client component generating ambient sounds via Web Audio API.
   - 6 presets: 🌧️ باران (white→lowpass), 🌊 امواج (brown→lowpass + LFO swell), 🍃 نسیم
     (white→highpass), 🔥 آتش (brown→lowpass), 📚 کتابخانه (pink→lowpass), ☕ کافه (brown→bandpass).
   - Noise generators: white, pink (Paul Kellet), brown (integrated).
   - Audio graph per preset: `BufferSource → BiquadFilter → waveGain → volumeGain → destination`,
     with an optional `OscillatorNode` LFO modulating `waveGain.gain` for ocean-wave swells.
   - Grid view (2-col mobile / 3-col desktop) → click preset → "now playing" view with
     pulsing emoji + concentric animated rings, volume slider (custom-styled range with
     accent fill), play/pause, and 5/10/15/20-min auto-stop timer pills with live
     MM:SS countdown in Persian digits.
   - `AudioContext` created lazily on user gesture (preset click) — respects autoplay policy.
   - Pause uses `ctx.suspend()`; resume uses `ctx.resume()`.
   - Full cleanup on unmount: stops source, disconnects nodes, closes AudioContext,
     clears timer interval.
   - Graceful fallback UI when `AudioContext` is unsupported.
   - RTL, dark cinema design tokens (`--accent`, `--accent-glow`, `--bg-deep`,
     `--foreground-muted`, `--gold`, etc.), `toPersianDigits` for all numbers.

2. **`src/app/globals.css`** (EDIT)
   - Appended `.study-music-slider` styles (webkit + moz thumb/track) using accent + glow vars.

3. **`src/components/tools/ToolsHub.tsx`** (EDIT)
   - Imported `StudyMusicPlayer`.
   - Replaced `{activeTool === 'music' && <FocusMusicTool />}` with `<StudyMusicPlayer />`.
   - Removed the now-dead `FocusMusicTool` function (store-based placeholder that played no audio).
   - Pruned unused lucide imports (`Play`, `Pause`, `Download`, `SkipForward`).

## Verification
- `bunx tsc --noEmit` → 0 errors in project source (only 2 pre-existing errors in
  `skills/` folder, unrelated to this task).
- `bun run lint` → 0 errors, 0 warnings.
- Dev server compiles cleanly (`dev.log` shows successful compiles with no new errors).

## Notes for Future Agents
- The Zustand store still exposes `tracks / currentTrack / isPlaying / setCurrentTrack /
  setIsPlaying / togglePlay` — left in place to avoid breaking other potential consumers;
  the music modal no longer uses them.
- All audio is generated procedurally; no network/audio assets required.
