import React, { useEffect } from 'react';
import { MediaItem } from '../types';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LightboxModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ media, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8">
        <div className="fixed inset-0" onClick={onClose} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-70 p-2 text-slate-300 hover:text-white bg-black/60 hover:bg-white/20 rounded-full border border-white/20 transition-all"
          title="關閉放大 (ESC)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Media Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-7xl max-h-[90vh] z-65 flex flex-col items-center justify-center pointer-events-auto"
        >
          {media.type === 'video' ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] object-contain border border-slate-700 shadow-2xl"
            />
          ) : (
            <img
              src={media.url}
              alt={media.caption || 'Expanded Media'}
              className="max-w-full max-h-[82vh] object-contain border border-slate-700 shadow-2xl select-none"
            />
          )}

          {media.caption && (
            <div className="mt-4 px-4 py-2 bg-black/70 border border-slate-800 text-center max-w-xl">
              <p className="text-xs sm:text-sm font-mono text-slate-300">
                {media.caption}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
