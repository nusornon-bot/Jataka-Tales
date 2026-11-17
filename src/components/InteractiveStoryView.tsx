import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Square,
  BookOpen,
  Music,
  VolumeX,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import {
  FontSizePreference,
  InteractiveChoice,
  InteractiveStory,
  JatakaTale,
} from '../types/jataka';
import { JATAKA_TALES } from '../data/jatakaData';
import { useAmbientMusic } from '../utils/ambientMusic';
import { getSourceByTaleId } from '../utils/jatakaSource';
import { useThaiSpeech } from '../utils/speech';
import { AnimatedJatakaArtwork } from './AnimatedJatakaArtwork';

const NARRATIVE_SIZE_CLASSES: Record<FontSizePreference, string> = {
  sm: 'text-[15px] leading-[1.8]',
  md: 'text-[16px] leading-[1.85]',
  lg: 'text-[19px] leading-[1.95]',
};

interface InteractiveStoryViewProps {
  stories: InteractiveStory[];
  tales?: JatakaTale[];
  activeStoryId: string;
  onSelectStory: (storyId: string) => void;
  onOpenTaleInLibrary: (taleId: string) => void;
  onOpen547Catalog: () => void;
  onGoToQuiz: () => void;
  onStoryCompleted?: (storyId: string) => void;
}

export const InteractiveStoryView: React.FC<InteractiveStoryViewProps> = ({
  stories,
  tales = JATAKA_TALES,
  activeStoryId,
  onSelectStory,
  onOpenTaleInLibrary,
  onOpen547Catalog,
  onGoToQuiz,
  onStoryCompleted,
}) => {
  const { fontSize } = useAppState();
  const { isPlaying: isMusicPlaying, toggle: toggleMusic } = useAmbientMusic();

  const story: InteractiveStory =
    stories.find((s) => s.id === activeStoryId) || stories[0];
  const matchedTale = tales.find((t) => t.id === story.taleId);

  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<InteractiveChoice | null>(
    null
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [virtueScores, setVirtueScores] = useState({
    mindfulness: 20,
    perseverance: 20,
    wisdom: 20,
  });
  const [choiceHistory, setChoiceHistory] = useState<
    Array<{ sceneTitle: string; choiceLabel: string; isBodhisattaWay: boolean }>
  >([]);

  const { isSupported, isSpeaking, speakingId, speak, stop } = useThaiSpeech();

  const currentScene = story.scenes[sceneIndex] || story.scenes[0];

  useEffect(() => {
    stop();
    setSceneIndex(0);
    setSelectedChoice(null);
    setIsCompleted(false);
    setVirtueScores({ mindfulness: 20, perseverance: 20, wisdom: 20 });
    setChoiceHistory([]);
  }, [activeStoryId, stop]);

  const resetStory = (nextStoryId?: string) => {
    stop();
    if (nextStoryId && nextStoryId !== story.id) {
      onSelectStory(nextStoryId);
    }
    setSceneIndex(0);
    setSelectedChoice(null);
    setIsCompleted(false);
    setVirtueScores({ mindfulness: 20, perseverance: 20, wisdom: 20 });
    setChoiceHistory([]);
  };

  const handleChoose = (choice: InteractiveChoice) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    setVirtueScores((prev) => ({
      mindfulness: Math.min(100, prev.mindfulness + choice.virtueDelta.mindfulness),
      perseverance: Math.min(100, prev.perseverance + choice.virtueDelta.perseverance),
      wisdom: Math.min(100, prev.wisdom + choice.virtueDelta.wisdom),
    }));
    setChoiceHistory((prev) => [
      ...prev,
      {
        sceneTitle: currentScene.title,
        choiceLabel: choice.label,
        isBodhisattaWay: choice.isBodhisattaWay,
      },
    ]);
  };

  const completeNow = () => {
    setIsCompleted(true);
    onStoryCompleted?.(story.id);
  };

  const handleContinue = () => {
    stop();
    if (!selectedChoice) return;

    if (selectedChoice.nextSceneId === null) {
      completeNow();
      return;
    }

    const nextIdx = story.scenes.findIndex(
      (s) => s.id === selectedChoice.nextSceneId
    );
    if (nextIdx !== -1) {
      setSceneIndex(nextIdx);
      setSelectedChoice(null);
    } else if (sceneIndex + 1 < story.scenes.length) {
      setSceneIndex(sceneIndex + 1);
      setSelectedChoice(null);
    } else {
      completeNow();
    }
  };

  const bodhisattaDecisionsCount = choiceHistory.filter(
    (c) => c.isBodhisattaWay
  ).length;

  const isNarratingScene = isSpeaking && speakingId === currentScene.id;

  return (
    <div className="space-y-8">
      {/* Header + Story Switcher */}
      <div className="space-y-4 pb-6 border-b border-[#E4DEC9] dark:border-[#2E3442]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              <span>โหมดที่ 2</span>
              <span aria-hidden="true"> · </span>
              <span>เล่านิทานชาดกแบบโต้ตอบ ({stories.length} เรื่องที่พร้อมเล่น)</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              สวมบทบาทในนิทานชาดก
            </h1>
          </div>
          <button
            type="button"
            onClick={onOpen547Catalog}
            className="px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            เลือกเพิ่มจาก ๕๔๗ เรื่องในพระไตรปิฎก
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stories.map((s) => {
            const isActive = s.id === story.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => resetStory(s.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                    : 'bg-white dark:bg-[#1A1D24] text-stone-700 dark:text-stone-300 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
                }`}
              >
                {s.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Zone Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Illustration + Virtue Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden">
            <div className="aspect-[4/3] bg-[#EFEAE0] dark:bg-[#142038] overflow-hidden">
              <AnimatedJatakaArtwork
                src={story.image}
                alt={story.title}
                taleId={story.taleId}
                sceneKey={isCompleted ? 'completed' : currentScene.id}
                fallbackTitle={story.title}
                sceneVisual={matchedTale?.sceneVisual}
              />
            </div>
            <div className="p-4 border-t border-[#E4DEC9] dark:border-[#2E3442] space-y-1.5">
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {story.virtueFocus}
              </div>
              <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                {story.title}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                {story.subtitle}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-[#EFEAE0] dark:border-[#2E3442]">
                อ้างอิง: {getSourceByTaleId(story.taleId, tales).shortCitation}
              </p>
            </div>
          </div>

          {/* Virtue Alignment Meters */}
          <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
                สมดุลคุณธรรมจากการตัดสินใจ
              </h3>
              <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                {isCompleted
                  ? 'เสร็จสิ้น'
                  : `บทที่ ${sceneIndex + 1}/${story.scenes.length}`}
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'mindfulness' as const,
                  label: 'สติรู้เท่าทัน',
                  color: 'bg-[#1E3A8A] dark:bg-blue-400',
                },
                {
                  key: 'perseverance' as const,
                  label: 'วิริยะความเพียร',
                  color: 'bg-[#B45309] dark:bg-amber-400',
                },
                {
                  key: 'wisdom' as const,
                  label: 'ปัญญาพิจารณา',
                  color: 'bg-[#15803D] dark:bg-emerald-400',
                },
              ].map((meter) => (
                <div key={meter.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      {meter.label}
                    </span>
                    <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                      {virtueScores[meter.key]} / 100
                    </span>
                  </div>
                  <div className="h-2 bg-[#EFEAE0] dark:bg-[#232732] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meter.color} rounded-full transition-all duration-300`}
                      style={{ width: `${virtueScores[meter.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#EFEAE0] dark:border-[#2E3442] flex items-center justify-between">
              <button
                type="button"
                onClick={() => resetStory()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-[#1C1917] dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                เริ่มเรื่องนี้ใหม่
              </button>
              <button
                type="button"
                onClick={() => onOpenTaleInLibrary(story.taleId)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                อ่านฉบับเต็ม
              </button>
            </div>
          </div>
        </div>

        {/* Right Zone: Narrative & Choice Deck */}
        <div className="lg:col-span-7">
          {!isCompleted ? (
            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 sm:p-8 space-y-6">
              {/* Scene Progress Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFEAE0] dark:border-[#2E3442]">
                <span className="text-xs font-mono tabular-nums text-[#92400E] dark:text-amber-400 font-medium">
                  {currentScene.chapterLabel}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMusic}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                      isMusicPlaying
                        ? 'bg-[#92400E] text-white border-[#92400E]'
                        : 'bg-[#FAF8F3] dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
                    }`}
                  >
                    {isMusicPlaying ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                        ปิดดนตรีคลอ
                      </>
                    ) : (
                      <>
                        <Music className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                        ดนตรีคลอ
                      </>
                    )}
                  </button>

                  {isSupported && (
                    <button
                      type="button"
                      onClick={() =>
                        speak(
                          `${currentScene.title}. ${currentScene.narrative}`,
                          currentScene.id
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                        isNarratingScene
                          ? 'bg-[#92400E] text-white border-[#92400E]'
                          : 'bg-[#FAF8F3] dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
                      }`}
                    >
                      {isNarratingScene ? (
                        <>
                          <Square className="w-3 h-3" aria-hidden="true" />
                          หยุดฟัง
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                          ฟังบทนี้
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  {currentScene.title}
                </h2>
                <p
                  className={`text-[#292524] dark:text-stone-200 max-w-2xl ${NARRATIVE_SIZE_CLASSES[fontSize]}`}
                >
                  {currentScene.narrative}
                </p>
              </div>

              {/* Choice Buttons */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  เลือกแนวทางตัดสินใจของท่าน
                </div>
                {currentScene.choices.map((choice, idx) => {
                  const isPicked = selectedChoice?.id === choice.id;
                  const isDimmed = Boolean(selectedChoice && !isPicked);
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={Boolean(selectedChoice)}
                      onClick={() => handleChoose(choice)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isPicked
                          ? choice.isBodhisattaWay
                            ? 'bg-[#ECFDF5] dark:bg-emerald-950/40 border-[#15803D] dark:border-emerald-500'
                            : 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#B45309] dark:border-amber-500'
                          : isDimmed
                          ? 'bg-[#FAF8F3] dark:bg-[#151820] border-[#E4DEC9] dark:border-[#2E3442] opacity-55'
                          : 'bg-[#FAF8F3] dark:bg-[#151820] border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] hover:border-[#B45309] dark:hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold text-[#1E3A8A] dark:text-blue-300 mt-0.5 shrink-0">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
                            {choice.label}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-400">
                            {choice.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Outcome & Dhamma Reflection Panel */}
              {selectedChoice && (
                <div className="pt-5 border-t border-[#E4DEC9] dark:border-[#2E3442] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {selectedChoice.isBodhisattaWay ? (
                        <>
                          <CheckCircle2
                            className="w-4 h-4 text-[#15803D] dark:text-emerald-400"
                            aria-hidden="true"
                          />
                          <span className="text-[#15803D] dark:text-emerald-400">
                            แนวทางแห่งพระโพธิสัตว์ (สติและปัญญา)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle
                            className="w-4 h-4 text-[#B45309] dark:text-amber-400"
                            aria-hidden="true"
                          />
                          <span className="text-[#B45309] dark:text-amber-400">
                            บทเรียนจากการตัดสินใจแบบทางโลก
                          </span>
                        </>
                      )}
                    </div>

                    {isSupported && (
                      <button
                        type="button"
                        onClick={() =>
                          speak(
                            `${selectedChoice.outcomeText} ข้อคิดประจำเหตุการณ์: ${selectedChoice.dhammaReflection}`,
                            `${currentScene.id}-outcome`
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                          isSpeaking && speakingId === `${currentScene.id}-outcome`
                            ? 'bg-[#92400E] text-white border-[#92400E]'
                            : 'bg-[#FAF8F3] dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
                        }`}
                      >
                        {isSpeaking && speakingId === `${currentScene.id}-outcome` ? (
                          <>
                            <Square className="w-3 h-3" aria-hidden="true" />
                            <span>หยุดฟัง</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                            <span>ฟังผลและข้อคิด</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-[#292524] dark:text-stone-200 leading-relaxed">
                    {selectedChoice.outcomeText}
                  </p>

                  <div className="p-4 bg-[#F3EFE6] dark:bg-[#151820] border border-[#DFD7C5] dark:border-[#2E3442] rounded-lg space-y-1">
                    <div className="text-xs font-semibold text-[#92400E] dark:text-amber-400">
                      ข้อคิดประจำเหตุการณ์
                    </div>
                    <p className="text-sm text-[#1C1917] dark:text-[#F3F0E6] leading-relaxed">
                      {selectedChoice.dhammaReflection}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors"
                    >
                      <span>
                        {selectedChoice.nextSceneId === null
                          ? 'ดูบทสรุปเรื่อง'
                          : 'ดำเนินเรื่องต่อ'}
                      </span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="space-y-2 pb-4 border-b border-[#EFEAE0] dark:border-[#2E3442]">
                <div className="text-xs font-mono text-[#15803D] dark:text-emerald-400 font-semibold">
                  จบบริบูรณ์ · บันทึกการเดินทางของท่าน
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  สรุปเส้นทางคุณธรรม: {story.title}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {story.endingSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    เลือกตรงทางธรรม
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#1E3A8A] dark:text-blue-300 mt-1">
                    {bodhisattaDecisionsCount} / {choiceHistory.length}
                  </div>
                </div>
                <div className="p-4 bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    ระดับสติและปัญญา
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400 mt-1">
                    {Math.round(
                      (virtueScores.mindfulness + virtueScores.wisdom) / 2
                    )}
                    %
                  </div>
                </div>
                <div className="p-4 bg-[#FAF8F3] dark:bg-[#151820] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    ระดับความเพียร
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#B45309] dark:text-amber-400 mt-1">
                    {virtueScores.perseverance}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
                  ทบทวนทางเลือกในแต่ละเหตุการณ์
                </h3>
                <ul className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg">
                  {choiceHistory.map((item, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 flex items-start justify-between gap-4 text-sm"
                    >
                      <div>
                        <div className="font-medium text-[#1C1917] dark:text-[#F3F0E6]">
                          {idx + 1}. {item.sceneTitle}
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          ทางเลือก: {item.choiceLabel}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          item.isBodhisattaWay
                            ? 'text-[#15803D] dark:text-emerald-400'
                            : 'text-[#B45309] dark:text-amber-400'
                        }`}
                      >
                        {item.isBodhisattaWay ? 'ทางโพธิสัตว์' : 'บทเรียนเสริม'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => resetStory()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  เล่นเรื่องนี้อีกครั้ง (ลองทางเลือกอื่น)
                </button>
                <button
                  type="button"
                  onClick={onGoToQuiz}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors"
                >
                  ไปทดสอบทายข้อคิดชาดก
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
