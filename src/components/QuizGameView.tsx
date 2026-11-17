import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Volume2,
  Square,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { FontSizePreference, QuizCategory, QuizQuestion } from '../types/jataka';
import { useThaiSpeech } from '../utils/speech';

const OPTION_TEXT_CLASSES: Record<FontSizePreference, string> = {
  sm: 'text-sm leading-relaxed',
  md: 'text-sm sm:text-base leading-relaxed',
  lg: 'text-base sm:text-lg leading-relaxed',
};

interface QuizGameViewProps {
  questions: QuizQuestion[];
  focusTaleTitle: string | null;
  onClearFocusTale: () => void;
  bestScore: number | null;
  onUpdateBestScore: (accuracyPercent: number) => void;
  onOpenLibrary: () => void;
  onOpen547Catalog: () => void;
}

const QUIZ_CATEGORIES: QuizCategory[] = [
  'ทั้งหมด',
  'ทายข้อคิดจากเรื่อง',
  'ทายชื่อชาดก',
  'บารมีและหลักธรรม',
];

export const QuizGameView: React.FC<QuizGameViewProps> = ({
  questions: allQuestions,
  focusTaleTitle,
  onClearFocusTale,
  bestScore,
  onUpdateBestScore,
  onOpenLibrary,
  onOpen547Catalog,
}) => {
  const { fontSize } = useAppState();
  const [category, setCategory] = useState<QuizCategory>('ทั้งหมด');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<
    Array<{
      questionId: string;
      prompt: string;
      taleTitle: string;
      chosenIndex: number;
      correctIndex: number;
      options: string[];
      explanation: string;
    }>
  >([]);

  const { isSupported, isSpeaking, speakingId, speak, stop } = useThaiSpeech();

  const questions = useMemo(() => {
    const base = focusTaleTitle
      ? allQuestions.filter((q) => q.taleTitle === focusTaleTitle)
      : allQuestions;
    if (category === 'ทั้งหมด') return base;
    return base.filter((q) => q.category === category);
  }, [allQuestions, focusTaleTitle, category]);

  const currentQuestion = questions[currentIdx];

  const handleRestart = (nextCategory?: QuizCategory) => {
    if (nextCategory) setCategory(nextCategory);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setFinished(false);
    setAnswers([]);
  };

  useEffect(() => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setFinished(false);
    setAnswers([]);
  }, [focusTaleTitle]);

  const handleSelectOption = (optionIdx: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQuestion.correctIndex;
    const nextScore = isCorrect ? score + 1 : score;
    const nextStreak = isCorrect ? streak + 1 : 0;

    if (isCorrect) {
      setScore(nextScore);
      setStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));
    } else {
      setStreak(0);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        taleTitle: currentQuestion.taleTitle,
        chosenIndex: optionIdx,
        correctIndex: currentQuestion.correctIndex,
        options: currentQuestion.options,
        explanation: currentQuestion.explanation,
      },
    ]);
  };

  const handleNext = () => {
    stop();
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      const accuracy = Math.round((score / questions.length) * 100);
      onUpdateBestScore(accuracy);
      setFinished(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (finished || !currentQuestion) return;
      if (['1', '2', '3', '4'].includes(e.key) && selectedOption === null) {
        const idx = Number(e.key) - 1;
        if (idx < currentQuestion.options.length) {
          handleSelectOption(idx);
        }
      } else if (e.key === 'Enter' && selectedOption !== null) {
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const accuracyPercent =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const getRankLabel = (pct: number) => {
    if (pct >= 90) return 'ปราชญ์ผู้แตกฉานในชาดก';
    if (pct >= 70) return 'บัณฑิตผู้ทรงภูมิธรรม';
    if (pct >= 50) return 'กัลยาณมิตรผู้ใฝ่เรียนรู้';
    return 'ผู้เริ่มต้นศึกษาชาดก';
  };

  return (
    <div className="space-y-8">
      {/* Header + Category Filter */}
      <div className="space-y-4 pb-6 border-b border-[#E4DEC9] dark:border-[#2E3442]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              <span>โหมดที่ 3</span>
              <span aria-hidden="true"> · </span>
              <span>แบบทดสอบทายข้อคิดและหลักธรรมจากชาดก ({allQuestions.length} ข้อ)</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              ทายข้อคิดและปัญญาชาดก
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {QUIZ_CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleRestart(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                      : 'bg-white dark:bg-[#1A1D24] text-stone-700 dark:text-stone-300 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onOpen547Catalog}
              className="px-3 py-1.5 text-xs font-semibold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/70 dark:bg-amber-900/35 border border-[#E5C98B] dark:border-amber-700/60 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/55 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              + เพิ่มข้อสอบจาก ๕๔๗ เรื่อง
            </button>
          </div>
        </div>

        {focusTaleTitle && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#F3EFE6] dark:bg-[#1A1D24] border border-[#DFD7C5] dark:border-[#2E3442] rounded-lg text-xs">
            <span className="text-[#1C1917] dark:text-[#F3F0E6]">
              กำลังทดสอบเฉพาะเรื่อง: <strong>{focusTaleTitle}</strong>
            </span>
            <button
              type="button"
              onClick={onClearFocusTale}
              className="font-semibold text-[#1E3A8A] dark:text-blue-300 hover:underline"
            >
              แสดงคำถามทั้งหมด ({allQuestions.length} ข้อ)
            </button>
          </div>
        )}
      </div>

      {/* Live Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg px-4 py-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">ความคืบหน้า</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#1C1917] dark:text-[#F3F0E6] mt-0.5">
            {finished ? questions.length : currentIdx + 1} / {questions.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg px-4 py-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">คะแนนสะสม</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#1E3A8A] dark:text-blue-300 mt-0.5">
            {score} ข้อ
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg px-4 py-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">ตอบถูกต่อเนื่อง</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#92400E] dark:text-amber-400 mt-0.5">
            {streak} ข้อ
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg px-4 py-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">สถิติสูงสุดของท่าน</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400 mt-0.5">
            {bestScore !== null ? `${bestScore}%` : '--'}
          </div>
        </div>
      </div>

      {!finished && currentQuestion ? (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 pb-3 border-b border-[#EFEAE0] dark:border-[#2E3442]">
            <span>หมวด: {currentQuestion.category}</span>
            <div className="flex items-center gap-3">
              {isSupported && (
                <button
                  type="button"
                  onClick={() => {
                    const optsText = currentQuestion.options
                      .map((o, idx) => `ข้อ ${idx + 1}: ${o}`)
                      .join('. ');
                    speak(
                      `คำถาม: ${currentQuestion.prompt}. ${optsText}`,
                      currentQuestion.id
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                    isSpeaking && speakingId === currentQuestion.id
                      ? 'bg-[#92400E] text-white border-[#92400E]'
                      : 'bg-[#FAF8F3] dark:bg-[#232732] text-stone-700 dark:text-stone-200 border-[#D6CEBE] dark:border-[#374151] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342]'
                  }`}
                >
                  {isSpeaking && speakingId === currentQuestion.id ? (
                    <>
                      <Square className="w-3 h-3" aria-hidden="true" />
                      <span>หยุดฟัง</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-300" aria-hidden="true" />
                      <span>ฟังโจทย์</span>
                    </>
                  )}
                </button>
              )}
              <span className="font-mono tabular-nums">
                ข้อที่ {currentIdx + 1} จาก {questions.length}
              </span>
            </div>
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F3F0E6] leading-relaxed">
            {currentQuestion.prompt}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              const hasAnswered = selectedOption !== null;

              let buttonClass =
                'bg-[#FAF8F3] dark:bg-[#151820] border-[#D6CEBE] dark:border-[#374151] text-[#1C1917] dark:text-[#F3F0E6] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] hover:border-[#1E3A8A] dark:hover:border-blue-400';

              if (hasAnswered) {
                if (isCorrect) {
                  buttonClass =
                    'bg-[#ECFDF5] dark:bg-emerald-950/45 border-[#15803D] dark:border-emerald-500 text-[#14532D] dark:text-emerald-200 font-medium';
                } else if (isChosen && !isCorrect) {
                  buttonClass =
                    'bg-[#FEF2F2] dark:bg-red-950/45 border-[#DC2626] dark:border-red-500 text-[#7F1D1D] dark:text-red-200';
                } else {
                  buttonClass =
                    'bg-[#FAF8F3] dark:bg-[#151820] border-[#E4DEC9] dark:border-[#2E3442] text-stone-500 dark:text-stone-400 opacity-65';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors flex items-start justify-between gap-3 ${buttonClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold mt-0.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className={OPTION_TEXT_CLASSES[fontSize]}>
                      {opt}
                    </span>
                  </div>
                  {hasAnswered && isCorrect && (
                    <CheckCircle2
                      className="w-5 h-5 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  {hasAnswered && isChosen && !isCorrect && (
                    <XCircle
                      className="w-5 h-5 text-[#DC2626] dark:text-red-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="pt-4 border-t border-[#E4DEC9] dark:border-[#2E3442] space-y-4">
              <div className="p-4 bg-[#F3EFE6] dark:bg-[#151820] border border-[#DFD7C5] dark:border-[#2E3442] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span
                    className={
                      selectedOption === currentQuestion.correctIndex
                        ? 'text-[#15803D] dark:text-emerald-400'
                        : 'text-[#B91C1C] dark:text-red-400'
                    }
                  >
                    {selectedOption === currentQuestion.correctIndex
                      ? 'คำตอบถูกต้อง'
                      : 'ยังไม่ถูกต้อง — ดูคำอธิบายด้านล่าง'}
                  </span>
                  <span className="text-stone-600 dark:text-stone-400">
                    อ้างอิง: {currentQuestion.taleTitle}
                  </span>
                </div>
                <p className="text-sm text-[#1C1917] dark:text-[#F3F0E6] leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  กด Enter เพื่อไปข้อถัดไป
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors"
                >
                  <span>
                    {currentIdx + 1 < questions.length
                      ? 'ข้อถัดไป'
                      : 'สรุปผลคะแนน'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-5 border-b border-[#EFEAE0] dark:border-[#2E3442]">
            <div className="text-xs font-mono text-[#92400E] dark:text-amber-400 font-semibold">
              ผลสรุปแบบทดสอบชาดก
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              {getRankLabel(accuracyPercent)}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              ท่านตอบถูก {score} จาก {questions.length} ข้อ ({accuracyPercent}%)
              · ตอบถูกต่อเนื่องสูงสุด {maxStreak} ข้อ
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6]">
              ทบทวนเฉลยและข้อคิดทุกข้อ
            </h3>
            <div className="divide-y divide-[#EFEAE0] dark:divide-[#2E3442] border border-[#E4DEC9] dark:border-[#2E3442] rounded-lg">
              {answers.map((ans, idx) => {
                const isOk = ans.chosenIndex === ans.correctIndex;
                return (
                  <div key={ans.questionId} className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-medium text-[#1C1917] dark:text-[#F3F0E6]">
                        {idx + 1}. {ans.prompt}
                      </span>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          isOk
                            ? 'text-[#15803D] dark:text-emerald-400'
                            : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {isOk ? 'ถูกต้อง' : 'ตอบผิด'}
                      </span>
                    </div>
                    {!isOk && (
                      <div className="text-xs text-[#15803D] dark:text-emerald-400">
                        คำตอบที่ถูก: {ans.options[ans.correctIndex]}
                      </div>
                    )}
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {ans.explanation} ({ans.taleTitle})
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleRestart()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              ทำแบบทดสอบอีกครั้ง
            </button>
            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              กลับไปทบทวนในคลังชาดก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
