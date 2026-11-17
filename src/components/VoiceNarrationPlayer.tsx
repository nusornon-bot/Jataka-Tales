import React from 'react';
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAmbientMusic } from '../utils/ambientMusic';
import { NarrationSegment } from '../utils/speech';

interface VoiceNarrationPlayerProps {
  title: string;
  isSupported: boolean;
  isActive: boolean;
  isPaused: boolean;
  rate: number;
  onChangeRate: (rate: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  onChangeVoice: (uri: string) => void;
  segments: NarrationSegment[];
  currentSegmentIndex: number;
  onStart: () => void;
  onTogglePause: () => void;
  onStop: () => void;
  onPrevSegment: () => void;
  onNextSegment: () => void;
  onJumpToSegment: (index: number) => void;
}

export const VoiceNarrationPlayer: React.FC<VoiceNarrationPlayerProps> = ({
  title,
  isSupported,
  isActive,
  isPaused,
  rate,
  onChangeRate,
  voices,
  selectedVoiceURI,
  onChangeVoice,
  segments,
  currentSegmentIndex,
  onStart,
  onTogglePause,
  onStop,
  onPrevSegment,
  onNextSegment,
  onJumpToSegment,
}) => {
  const {
    isPlaying: isMusicPlaying,
    volume: musicVolume,
    setVolume: setMusicVolume,
    toggle: toggleMusic,
  } = useAmbientMusic();

  const totalCount = segments.length;
  const activeSegment = isActive ? segments[currentSegmentIndex] : null;
  const progressRatio =
    isActive && totalCount > 0 ? (currentSegmentIndex + 1) / totalCount : 0;

  return (
    <section
      aria-label="เครื่องเล่นเสียงบรรยายและดนตรีไทยคลอเบาๆ"
      className="bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300">
            <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>เสียงบรรยายนิทานชาดกและดนตรีบรรเลงไทย</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
            {!isSupported
              ? 'เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง แต่สามารถเปิดดนตรีบรรเลงไทยคลอการอ่านได้'
              : isActive && activeSegment
              ? `กำลังอ่าน: ${activeSegment.label} (${currentSegmentIndex + 1} / ${totalCount})`
              : `ฟังเรื่อง ${title} ครบตั้งแต่บทนำ เนื้อเรื่อง จนถึงข้อคิดธรรม (${totalCount} ช่วง)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMusic}
            title="เปิด/ปิดเสียงขิมและดนตรีไทยเพนทาโทนิกคลอเบาๆ"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
              isMusicPlaying
                ? 'bg-[#92400E] text-white border-[#92400E] dark:bg-amber-700 dark:border-amber-600'
                : 'bg-white dark:bg-[#232732] text-[#1C1917] dark:text-[#F3F0E6] border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
            }`}
          >
            {isMusicPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ปิดดนตรีคลอ</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                <span>ดนตรีไทยคลอ</span>
              </>
            )}
          </button>

          {isSupported && (
            <>
              {!isActive ? (
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  เริ่มฟังเรื่องนี้
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onPrevSegment}
                    disabled={currentSegmentIndex <= 0}
                    aria-label="ช่วงก่อนหน้า"
                    title="ช่วงก่อนหน้า"
                    className="p-2 text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] disabled:opacity-40 rounded-md transition-colors"
                  >
                    <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePause}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        ฟังต่อ
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                        พักชั่วคราว
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onNextSegment}
                    disabled={currentSegmentIndex >= totalCount - 1}
                    aria-label="ช่วงถัดไป"
                    title="ช่วงถัดไป"
                    className="p-2 text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] disabled:opacity-40 rounded-md transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={onStop}
                    aria-label="หยุดเสียงบรรยาย"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors whitespace-nowrap"
                  >
                    <Square className="w-3 h-3" aria-hidden="true" />
                    หยุด
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ambient Music Volume Control when active */}
      {isMusicPlaying && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-[#EFEAE0]/60 dark:bg-[#1E222D] text-xs text-stone-700 dark:text-stone-300">
          <span className="whitespace-nowrap font-medium">ระดับเสียงดนตรีไทย:</span>
          <input
            type="range"
            min={0.05}
            max={0.55}
            step={0.05}
            aria-label="ระดับเสียงดนตรีไทย"
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className="flex-1 min-w-[100px] max-w-[144px] accent-[#92400E] dark:accent-amber-400"
          />
          <span className="font-mono tabular-nums text-[11px]">
            {Math.round((musicVolume / 0.55) * 100)}%
          </span>
        </div>
      )}

      {/* Progress & Speed / Voice Settings */}
      {isSupported && (
        <div className="space-y-2.5 pt-2 border-t border-[#E4DEC9] dark:border-[#2E3442]">
          <div
            aria-hidden="true"
            className="h-1.5 w-full bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#1E3A8A] dark:bg-blue-400 origin-left transition-transform duration-300"
              style={{ transform: `scaleX(${progressRatio})` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {segments.map((seg, idx) => {
                const current = isActive && idx === currentSegmentIndex;
                return (
                  <button
                    key={`${seg.label}-${idx}`}
                    type="button"
                    onClick={() => onJumpToSegment(idx)}
                    className={`px-2 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                      current
                        ? 'bg-[#1E3A8A] text-white font-semibold'
                        : 'bg-white dark:bg-[#232732] text-stone-600 dark:text-stone-300 border border-[#DFD7C5] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
                    }`}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                aria-label="ความเร็วเสียงบรรยาย"
                value={rate}
                onChange={(e) => onChangeRate(Number(e.target.value))}
                className="px-2.5 py-1 text-xs bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] rounded-md text-[#1C1917] dark:text-[#F3F0E6]"
              >
                <option value={0.85}>ช้า 0.85x</option>
                <option value={1}>ปกติ 1.0x</option>
                <option value={1.15}>เร็ว 1.15x</option>
                <option value={1.25}>เร็วมาก 1.25x</option>
              </select>

              {voices.length > 1 && (
                <select
                  aria-label="เลือกเสียงผู้บรรยาย"
                  value={selectedVoiceURI}
                  onChange={(e) => onChangeVoice(e.target.value)}
                  className="max-w-full sm:max-w-[170px] truncate px-2.5 py-1 text-xs bg-white dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] rounded-md text-[#1C1917] dark:text-[#F3F0E6]"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
