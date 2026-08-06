'use client';

import { useAppStore } from '@/lib/store';
import { Play, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MusicPlayer() {
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack, tracks } = useAppStore();

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-16 left-0 right-0 z-40 bg-white/5 backdrop-blur-xl border-t border-white/10 px-4 py-2"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentTrack.cover}</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">{currentTrack.title}</p>
              <p className="text-xs text-zinc-400">{currentTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-4">
                <div className="eq-bar w-1 bg-[#3EB489] rounded-full" />
                <div className="eq-bar w-1 bg-[#3EB489] rounded-full" />
                <div className="eq-bar w-1 bg-[#3EB489] rounded-full" />
                <div className="eq-bar w-1 bg-[#3EB489] rounded-full" />
                <div className="eq-bar w-1 bg-[#3EB489] rounded-full" />
              </div>
            )}
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-[#3EB489]/20 flex items-center justify-center text-[#3EB489] hover:bg-[#3EB489]/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={() => {
                const idx = tracks.findIndex((t) => t.id === currentTrack.id);
                const next = tracks[(idx + 1) % tracks.length];
                setCurrentTrack(next);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <SkipForward className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
