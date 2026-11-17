import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { SceneFocalElement, SceneVisualSpec } from '../types/jataka';

export type ArtworkMotif =
  | 'bodhi'
  | 'ocean'
  | 'desert'
  | 'river'
  | 'sky'
  | 'forest'
  | 'celestial'
  | 'rain';

interface AnimatedJatakaArtworkProps {
  src: string;
  alt: string;
  taleId: string;
  compact?: boolean;
  sceneKey?: string;
  className?: string;
  fallbackTitle?: string;
  sceneVisual?: SceneVisualSpec;
}

const LOOP_DURATION = 12;

function resolveMotif(taleId: string, sceneVisual?: SceneVisualSpec): ArtworkMotif {
  if (sceneVisual?.motif) return sceneVisual.motif;
  if (taleId === 'mahajanaka') return 'ocean';
  if (taleId === 'vannupatha') return 'desert';
  if (taleId === 'vanarinda' || taleId === 'bhuridatta') return 'river';
  if (taleId === 'kacchapa' || taleId === 'nemiraja') return 'sky';
  if (taleId === 'suvannasama' || taleId === 'temiya') return 'forest';
  if (taleId === 'vessantara') return 'rain';
  if (
    taleId === 'candakumara' ||
    taleId === 'narada' ||
    taleId === 'mahosadha' ||
    taleId === 'vidhura'
  ) {
    return 'celestial';
  }
  return 'bodhi';
}

interface CameraChoreography {
  scale: number[];
  x: string[];
  y: string[];
}

function getCameraChoreography(
  motif: ArtworkMotif,
  compact: boolean
): CameraChoreography {
  if (compact) {
    switch (motif) {
      case 'ocean':
        return {
          scale: [1.03, 1.09, 1.05, 1.03],
          x: ['0%', '-1.5%', '1.2%', '0%'],
          y: ['0%', '-1%', '0.8%', '0%'],
        };
      case 'sky':
        return {
          scale: [1.04, 1.1, 1.06, 1.04],
          x: ['-1.2%', '1.5%', '0%', '-1.2%'],
          y: ['1%', '-1.2%', '0%', '1%'],
        };
      default:
        return {
          scale: [1.03, 1.08, 1.05, 1.03],
          x: ['-0.8%', '1%', '-0.4%', '-0.8%'],
          y: ['0.6%', '-0.8%', '0.3%', '0.6%'],
        };
    }
  }

  switch (motif) {
    case 'ocean':
      return {
        scale: [1.06, 1.15, 1.11, 1.06],
        x: ['0%', '-2.8%', '2.2%', '0%'],
        y: ['0.8%', '-1.8%', '1.4%', '0.8%'],
      };
    case 'desert':
      return {
        scale: [1.05, 1.14, 1.09, 1.05],
        x: ['-2.5%', '2.6%', '-0.8%', '-2.5%'],
        y: ['0.5%', '-1.2%', '0.8%', '0.5%'],
      };
    case 'sky':
      return {
        scale: [1.07, 1.16, 1.1, 1.07],
        x: ['-2.6%', '2.6%', '0.4%', '-2.6%'],
        y: ['2.2%', '-2.5%', '-0.6%', '2.2%'],
      };
    case 'river':
      return {
        scale: [1.05, 1.13, 1.09, 1.05],
        x: ['1.8%', '-2.2%', '0.6%', '1.8%'],
        y: ['-0.5%', '1.5%', '-1%', '-0.5%'],
      };
    case 'forest':
      return {
        scale: [1.05, 1.13, 1.08, 1.05],
        x: ['0%', '2%', '-1.6%', '0%'],
        y: ['1.2%', '-1.6%', '0.6%', '1.2%'],
      };
    case 'rain':
      return {
        scale: [1.05, 1.13, 1.09, 1.05],
        x: ['-1.2%', '1.8%', '-0.4%', '-1.2%'],
        y: ['0.6%', '-1.6%', '0.8%', '0.6%'],
      };
    case 'celestial':
      return {
        scale: [1.05, 1.15, 1.1, 1.05],
        x: ['0%', '-1.8%', '1.8%', '0%'],
        y: ['1.6%', '-2%', '0.2%', '1.6%'],
      };
    case 'bodhi':
    default:
      return {
        scale: [1.05, 1.14, 1.09, 1.05],
        x: ['-1.4%', '1.8%', '-0.4%', '-1.4%'],
        y: ['1%', '-1.6%', '0.4%', '1%'],
      };
  }
}

const FLOATING_MOTES = [
  { id: 0, left: '14%', top: '22%', size: 4, delay: 0, duration: 5.8 },
  { id: 1, left: '32%', top: '38%', size: 3, delay: 1.1, duration: 6.4 },
  { id: 2, left: '54%', top: '18%', size: 5, delay: 0.6, duration: 7.2 },
  { id: 3, left: '72%', top: '30%', size: 3, delay: 2.0, duration: 5.5 },
  { id: 4, left: '84%', top: '46%', size: 4, delay: 1.5, duration: 6.8 },
  { id: 5, left: '42%', top: '58%', size: 3, delay: 2.6, duration: 6.1 },
];

const BODHI_LEAVES = [
  { id: 0, left: '18%', delay: 0, duration: 8.5, driftX: 28 },
  { id: 1, left: '48%', delay: 2.4, duration: 9.2, driftX: -24 },
  { id: 2, left: '76%', delay: 4.8, duration: 8.8, driftX: 20 },
];

const RAIN_STREAKS = [
  { id: 0, left: '12%', delay: 0, duration: 2.1 },
  { id: 1, left: '24%', delay: 0.5, duration: 1.9 },
  { id: 2, left: '37%', delay: 1.1, duration: 2.3 },
  { id: 3, left: '49%', delay: 0.3, duration: 2.0 },
  { id: 4, left: '62%', delay: 0.9, duration: 2.2 },
  { id: 5, left: '74%', delay: 1.4, duration: 1.85 },
  { id: 6, left: '86%', delay: 0.7, duration: 2.15 },
];

const FocalSilhouette: React.FC<{ element: SceneFocalElement; accent: string }> = ({
  element,
  accent,
}) => {
  switch (element) {
    case 'ship':
      return (
        <g fill={accent} fillOpacity="0.92">
          <path d="M135 190 Q200 218 265 190 L248 212 H152 Z" />
          <path d="M196 112 L196 192 H202 L202 112 Z" />
          <path d="M202 118 Q248 148 202 184 Z" />
          <path d="M196 126 Q162 150 196 178 Z" opacity="0.75" />
        </g>
      );
    case 'palace':
      return (
        <g fill={accent} fillOpacity="0.9">
          <path d="M200 76 L210 112 H190 Z" />
          <path d="M168 112 L200 94 L232 112 Z" />
          <path d="M150 132 L200 110 L250 132 Z" />
          <rect x="160" y="132" width="80" height="72" rx="2" />
          <path d="M188 204 V166 A12 12 0 0 1 212 166 V204 Z" fill="#142038" />
        </g>
      );
    case 'lotus':
      return (
        <g fill={accent} fillOpacity="0.92">
          <path d="M200 114 C216 144 218 176 200 196 C182 176 184 144 200 114 Z" />
          <path d="M164 134 C184 148 194 174 192 196 C170 186 156 160 164 134 Z" opacity="0.82" />
          <path d="M236 134 C216 148 206 174 208 196 C230 186 244 160 236 134 Z" opacity="0.82" />
          <path d="M140 164 C164 166 184 182 190 198 C162 198 142 184 140 164 Z" opacity="0.68" />
          <path d="M260 164 C236 166 216 182 210 198 C238 198 258 184 260 164 Z" opacity="0.68" />
        </g>
      );
    case 'scale':
      return (
        <g stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round">
          <line x1="200" y1="100" x2="200" y2="206" />
          <line x1="140" y1="126" x2="260" y2="126" />
          <path d="M140 126 L124 168 H156 Z" strokeWidth="2.5" />
          <path d="M260 126 L244 168 H276 Z" strokeWidth="2.5" />
          <path d="M122 168 Q140 184 158 168 Z" fill={accent} fillOpacity="0.8" />
          <path d="M242 168 Q260 184 278 168 Z" fill={accent} fillOpacity="0.8" />
        </g>
      );
    case 'naga':
      return (
        <g fill={accent} fillOpacity="0.9">
          <path d="M162 168 Q182 108 200 104 Q218 108 238 168 Q214 148 200 156 Q186 148 162 168 Z" />
          <path d="M142 204 Q170 184 200 198 Q230 212 258 190" stroke={accent} strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'deer':
    case 'elephant':
    case 'monkey':
    case 'sage':
      return (
        <g fill={accent} fillOpacity="0.9">
          <circle cx="200" cy="134" r="24" />
          <path d="M160 208 C162 174 178 162 200 162 C222 162 238 174 240 208 Z" />
          <circle cx="200" cy="134" r="36" fill="none" stroke={accent} strokeWidth="2" strokeOpacity="0.45" />
        </g>
      );
    case 'bodhi':
    default:
      return (
        <g fill={accent} fillOpacity="0.92">
          <path d="M200 84 C174 114 154 138 154 166 C154 190 174 208 200 208 C226 208 246 190 246 166 C246 138 226 114 200 84 Z" />
          <line x1="200" y1="110" x2="200" y2="218" stroke="#142038" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
  }
};

export const AnimatedJatakaArtwork: React.FC<AnimatedJatakaArtworkProps> = ({
  src,
  alt,
  taleId,
  compact = false,
  sceneKey,
  className = '',
  fallbackTitle,
  sceneVisual,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);
  const [cycleId, setCycleId] = useState(0);

  const motif = useMemo(
    () => resolveMotif(taleId, sceneVisual),
    [taleId, sceneVisual]
  );
  const choreography = useMemo(
    () => getCameraChoreography(motif, compact),
    [motif, compact]
  );

  const shouldAnimate = isPlaying && !imgFailed;
  const animKey = `${taleId}-${sceneKey || 'base'}-${cycleId}-${shouldAnimate ? 'play' : 'pause'}`;

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    setCycleId((c) => c + 1);
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  if (imgFailed && !sceneVisual) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-200 bg-gradient-to-br from-[#172554] to-[#0F172A] ${className}`}
      >
        <BookOpen className="w-8 h-8 text-amber-300 mb-2" aria-hidden="true" />
        <p className="font-serif text-base">{fallbackTitle || 'ศาลาชาดก'}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#142038] ${className}`}>
      {sceneVisual ? (
        <motion.div
          key={animKey}
          initial={
            shouldAnimate
              ? {
                  scale: choreography.scale[0],
                  x: choreography.x[0],
                  y: choreography.y[0],
                }
              : { scale: 1, x: '0%', y: '0%' }
          }
          animate={
            shouldAnimate
              ? {
                  scale: choreography.scale,
                  x: choreography.x,
                  y: choreography.y,
                }
              : { scale: 1, x: '0%', y: '0%' }
          }
          transition={
            shouldAnimate
              ? {
                  duration: compact ? LOOP_DURATION + 4 : LOOP_DURATION,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }
              : { duration: 0.35, ease: 'easeOut' }
          }
          className="w-full h-full will-change-transform select-none"
        >
          <svg
            viewBox="0 0 400 300"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={alt}
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={`sky-${taleId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sceneVisual.skyTop || '#142038'} />
                <stop offset="100%" stopColor={sceneVisual.skyBottom || '#273E6B'} />
              </linearGradient>
              <radialGradient id={`halo-${taleId}`} cx="50%" cy="46%" r="45%">
                <stop offset="0%" stopColor={sceneVisual.accentColor || '#FBBF24'} stopOpacity="0.34" />
                <stop offset="100%" stopColor={sceneVisual.accentColor || '#FBBF24'} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill={`url(#sky-${taleId})`} />
            <circle cx="200" cy="145" r="130" fill={`url(#halo-${taleId})`} />
            <circle
              cx="200"
              cy="148"
              r="76"
              fill="none"
              stroke={sceneVisual.accentColor || '#FBBF24'}
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />
            <path
              d="M0 245 Q90 212 195 238 T400 226 V300 H0 Z"
              fill="#0B1324"
              fillOpacity="0.58"
            />
            <path
              d="M0 264 Q120 242 250 262 T400 250 V300 H0 Z"
              fill="#070C17"
              fillOpacity="0.78"
            />
            <FocalSilhouette
              element={sceneVisual.focalElement}
              accent={sceneVisual.accentColor || '#FDE68A'}
            />
          </svg>
        </motion.div>
      ) : (
        <motion.img
          key={animKey}
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          initial={
            shouldAnimate
              ? {
                  scale: choreography.scale[0],
                  x: choreography.x[0],
                  y: choreography.y[0],
                }
              : { scale: 1, x: '0%', y: '0%' }
          }
          animate={
            shouldAnimate
              ? {
                  scale: choreography.scale,
                  x: choreography.x,
                  y: choreography.y,
                }
              : { scale: 1, x: '0%', y: '0%' }
          }
          transition={
            shouldAnimate
              ? {
                  duration: compact ? LOOP_DURATION + 4 : LOOP_DURATION,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }
              : { duration: 0.35, ease: 'easeOut' }
          }
          className="w-full h-full object-cover will-change-transform select-none"
        />
      )}

      {sceneVisual && !compact && (
        <div className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-xs text-[11px] font-medium text-amber-100 border border-white/15">
          <Sparkles className="w-3 h-3 text-amber-300" aria-hidden="true" />
          <span>{sceneVisual.settingLabel}</span>
        </div>
      )}

      {/* Atmospheric Layer: Golden Light / Moonlight Sweep */}
      {shouldAnimate && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              motif === 'ocean' || motif === 'desert' || motif === 'river'
                ? 'radial-gradient(circle at 60% 35%, rgba(253, 230, 138, 0.16), transparent 60%)'
                : 'radial-gradient(circle at 45% 25%, rgba(254, 243, 199, 0.22), transparent 62%)',
          }}
          animate={{ opacity: [0.35, 0.85, 0.45, 0.35], scale: [1, 1.08, 1.02, 1] }}
          transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
        />
      )}

      {/* Motif-specific Atmospheric Effects (compositor-only transform & opacity) */}
      {shouldAnimate && (motif === 'bodhi' || motif === 'forest') && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {BODHI_LEAVES.map((leaf) => (
            <motion.svg
              key={leaf.id}
              viewBox="0 0 24 24"
              className="absolute w-3.5 h-3.5 text-amber-200/75"
              style={{ left: leaf.left, top: '-8%' }}
              animate={{
                y: ['0%', '480%'],
                x: [0, leaf.driftX, -leaf.driftX * 0.5, leaf.driftX * 0.3],
                rotate: [0, 35, -20, 15],
                opacity: [0, 0.85, 0.7, 0],
              }}
              transition={{
                duration: leaf.duration,
                delay: leaf.delay,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            >
              <path
                fill="currentColor"
                d="M12 2C9 6.5 5 10.2 5 14.2C5 17.8 8 20.5 12 20.5C16 20.5 19 17.8 19 14.2C19 10.2 15 6.5 12 2ZM12 20.5V23"
              />
            </motion.svg>
          ))}
        </div>
      )}

      {shouldAnimate && motif === 'rain' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {RAIN_STREAKS.map((drop) => (
            <motion.div
              key={drop.id}
              className="absolute w-px h-7 bg-gradient-to-b from-transparent via-amber-200/80 to-amber-100/90"
              style={{ left: drop.left, top: '-12%' }}
              animate={{
                y: ['0%', '520%'],
                x: [0, -14],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                duration: drop.duration,
                delay: drop.delay,
                ease: 'linear',
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      )}

      {shouldAnimate && (motif === 'ocean' || motif === 'river') && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 overflow-hidden">
          <motion.div
            className="w-[140%] h-full -ml-[20%] opacity-35"
            style={{
              background:
                'repeating-linear-gradient(175deg, transparent 0px, transparent 14px, rgba(254, 243, 199, 0.24) 15px, transparent 17px)',
            }}
            animate={{ x: ['-4%', '4%', '-4%'], y: ['2%', '-2%', '2%'] }}
            transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity }}
          />
        </div>
      )}

      {shouldAnimate && (motif === 'desert' || motif === 'sky' || motif === 'celestial') && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {FLOATING_MOTES.map((mote) => (
            <motion.span
              key={mote.id}
              className="absolute rounded-full bg-amber-100/85"
              style={{
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
              }}
              animate={{
                y: [0, -16, 4, 0],
                x: [0, 10, -6, 0],
                opacity: [0.15, 0.9, 0.35, 0.15],
                scale: [0.8, 1.35, 0.9, 0.8],
              }}
              transition={{
                duration: mote.duration,
                delay: mote.delay,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      )}

      {/* Full-mode Interactive Controls & Timeline Scrim */}
      {!compact && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
          />

          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'หยุดภาพเคลื่อนไหว' : 'เล่นภาพเคลื่อนไหว'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-[#1C1917]/75 hover:bg-[#1C1917]/90 border border-white/20 rounded-md backdrop-blur-xs transition-colors whitespace-nowrap"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" aria-hidden="true" />
                  <span>หยุดเคลื่อนไหว</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" aria-hidden="true" />
                  <span>เล่นภาพเคลื่อนไหว</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReplay}
              aria-label="เล่นแอนิเมชั่นซ้ำ"
              title="เล่นแอนิเมชั่นซ้ำ"
              className="inline-flex items-center justify-center p-1.5 text-white bg-[#1C1917]/75 hover:bg-[#1C1917]/90 border border-white/20 rounded-md backdrop-blur-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Compositor-only (scaleX) progress bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/20"
          >
            <motion.div
              key={`bar-${animKey}`}
              className="h-full bg-amber-300/90 origin-left"
              initial={{ scaleX: 0 }}
              animate={shouldAnimate ? { scaleX: [0, 1] } : { scaleX: 0 }}
              transition={
                shouldAnimate
                  ? {
                      duration: LOOP_DURATION,
                      ease: 'linear',
                      repeat: Infinity,
                    }
                  : { duration: 0.2 }
              }
            />
          </div>
        </>
      )}
    </div>
  );
};
