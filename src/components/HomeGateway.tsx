import React from 'react';
import { BookOpen, Compass, HelpCircle, ArrowRight } from 'lucide-react';
import { AppMode, JatakaTale } from '../types/jataka';
import { HERO_ARTWORK, JATAKA_TALES } from '../data/jatakaData';
import { getJatakaSourceInfo } from '../utils/jatakaSource';
import { DailyJatakaWisdom } from './DailyJatakaWisdom';
import { AnimatedJatakaArtwork } from './AnimatedJatakaArtwork';
import { TenBaramiTracker } from './TenBaramiTracker';
import { ReadingProgressTracker } from './ReadingProgressTracker';

interface HomeGatewayProps {
  tales: JatakaTale[];
  readNumbers: number[];
  unlockedNumbers: number[];
  onSelectMode: (mode: AppMode) => void;
  onOpen547Catalog: () => void;
  onOpenTale: (taleId: string) => void;
  onStartInteractiveStory: (storyId: string) => void;
  onUnlockAndOpen: (
    jatakaNumber: number,
    targetMode: 'library' | 'interactive' | 'quiz',
    hint?: { thaiTitle?: string; paliTitle?: string; nipataName?: string }
  ) => void;
  loadingNumber: number | null;
  bestQuizScore: number | null;
  totalTalesCount: number;
  totalStoriesCount: number;
  totalQuizCount: number;
}

export const HomeGateway: React.FC<HomeGatewayProps> = ({
  tales,
  readNumbers,
  unlockedNumbers,
  onSelectMode,
  onOpen547Catalog,
  onOpenTale,
  onStartInteractiveStory,
  onUnlockAndOpen,
  loadingNumber,
  bestQuizScore,
  totalTalesCount,
  totalStoriesCount,
  totalQuizCount,
}) => {
  const featuredTale: JatakaTale = JATAKA_TALES[0];

  return (
    <div className="space-y-12">
      {/* Split Editorial Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span>คลังปัญญาพุทธศาสนา</span>
              <span aria-hidden="true">·</span>
              <span>ทศชาติและนิบาตชาดก</span>
              <span aria-hidden="true">·</span>
              <span>๓ รูปแบบการเรียนรู้</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1C1917] dark:text-[#F3F0E6] leading-[1.25] [text-wrap:balance]">
              ปัญญาแห่งอดีตชาติ ผ่านนิทานชาดกทั้ง ๓ มิติ
            </h1>

            <p className="text-base text-stone-700 dark:text-stone-300 leading-relaxed max-w-xl">
              เรียนรู้ข้อคิดธรรมอันลุ่มลึกจากเรื่องเล่าการบำเพ็ญบารมีของพระโพธิสัตว์
              ครบทั้งคลังนิทานพร้อมภาพประกอบและเสียงบรรยาย การเล่านิทานแบบโต้ตอบตามทางเลือกคุณธรรม
              และเกมทายข้อคิดเพื่อทบทวนความเข้าใจในที่เดียว
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectMode('library')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                เปิดคลังชาดก
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('interactive')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
                เล่านิทานโต้ตอบ
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('quiz')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/60 dark:bg-amber-900/35 border border-[#E5C98B] dark:border-amber-700/60 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/55 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                ทายข้อคิดชาดก
              </button>
            </div>

            <div className="pt-4 border-t border-[#E4DEC9] dark:border-[#2E3442]">
              <p className="font-serif italic text-base text-[#1C1917] dark:text-[#F3F0E6] leading-relaxed">
                “{featuredTale.thaiVerseMeaning}”
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                {featuredTale.paliVerse} · จาก {featuredTale.title} ({getJatakaSourceInfo(featuredTale).shortCitation})
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <figure className="h-full flex flex-col bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden">
            <div className="flex-1 min-h-[260px] bg-[#142038] relative overflow-hidden">
              <AnimatedJatakaArtwork
                src={HERO_ARTWORK}
                alt="ภาพจิตรกรรมต้นพระศรีมหาโพธิ์ริมสระบัวในยามรุ่งอรุณ"
                taleId="bodhi"
                fallbackTitle="ศาลาชาดก"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400 border-t border-[#E4DEC9] dark:border-[#2E3442] bg-[#FAF8F3] dark:bg-[#151820]">
              ภาพประกอบ — ร่มโพธิ์แห่งสติปัญญาและปทุมชาติ ศูนย์รวมเรื่องเล่าการบำเพ็ญบารมีในอดีตชาติ
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Daily Jataka Wisdom */}
      <DailyJatakaWisdom
        tales={tales}
        onUnlockAndOpen={onUnlockAndOpen}
        loadingNumber={loadingNumber}
      />

      {/* Reading Progress Tracker */}
      <ReadingProgressTracker
        tales={tales}
        readNumbers={readNumbers}
        unlockedNumbers={unlockedNumbers}
        variant="home"
        onOpenTale={onOpenTale}
        onOpenLibrary={() => onSelectMode('library')}
        onOpen547Catalog={onOpen547Catalog}
      />

      {/* Ten Barami Mastery Map */}
      <TenBaramiTracker
        tales={tales}
        onOpenTale={onOpenTale}
        onStartInteractiveStory={onStartInteractiveStory}
      />

      {/* 3 Modes Strip */}
      <section aria-label="รูปแบบการเรียนรู้ทั้ง 3 มิติ" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="text-xs font-mono tabular-nums text-[#92400E] dark:text-amber-400">
              01 · {totalTalesCount} เรื่องพร้อมอ่าน · สารบัญ ๕๔๗ เรื่อง
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              คลังนิทานชาดกและสารบัญ ๒๒ นิบาต
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              อ่านเรื่องคัดสรรพร้อมภาพจิตรกรรมและเสียงบรรยายภาษาไทย
              หรือเลือกเปิดชาดกเรื่องใดก็ได้จากทั้งหมด ๕๔๗ เรื่องในพระไตรปิฎก
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectMode('library')}
              className="flex-1 inline-flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 bg-[#F3EFE6]/70 dark:bg-[#232732] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] rounded-md transition-colors"
            >
              <span>เข้าสู่คลังนิทาน</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpen547Catalog}
              className="px-3 py-2.5 text-xs font-semibold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/70 dark:bg-amber-900/35 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/55 rounded-md transition-colors whitespace-nowrap"
            >
              ๕๔๗ เรื่อง
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="text-xs font-mono tabular-nums text-[#92400E] dark:text-amber-400">
              02 · {totalStoriesCount} บทโต้ตอบ (รองรับทั้ง ๕๔๗ เรื่อง)
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              เล่านิทานชาดกแบบโต้ตอบ
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              สวมบทบาทตัวละครเอกในสถานการณ์คับขัน เลือกแนวทางตัดสินใจด้วยตนเอง
              พร้อมรับข้อคิดสะท้อนผลและค่าพลัง สติ ความเพียร ปัญญา แบบทันที
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectMode('interactive')}
            className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 bg-[#F3EFE6]/70 dark:bg-[#232732] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] rounded-md transition-colors"
          >
            <span>เริ่มสวมบทบาท</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="text-xs font-mono tabular-nums text-[#92400E] dark:text-amber-400">
              03 · {totalQuizCount} คำถามวัดความเข้าใจ
              {bestQuizScore !== null ? ` · สถิติสูงสุด ${bestQuizScore}%` : ''}
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              เกมทายข้อคิดและหลักธรรมชาดก
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              ท้าทายความรู้ด้วยการทายข้อคิดจากเหตุการณ์ ทายชื่อเรื่องชาดก
              และวิเคราะห์บารมีทั้ง ๑๐ ประการ พร้อมเฉลยละเอียดทุกข้อ
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectMode('quiz')}
            className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 bg-[#F3EFE6]/70 dark:bg-[#232732] hover:bg-[#EFEAE0] dark:hover:bg-[#2D3342] rounded-md transition-colors"
          >
            <span>เริ่มทำแบบทดสอบ</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Curated Quick Entry Row */}
      <section className="border-t border-[#E4DEC9] dark:border-[#2E3442] pt-8 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1C1917] dark:text-[#F3F0E6]">
              เรื่องเด่นแนะนำประจำศาลา
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              เลือกอ่านบทความเต็มหรือเข้าสู่โหมดโต้ตอบได้ทันทีจากเรื่องที่สนใจ
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectMode('library')}
            className="text-sm font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
          >
            ดูทั้งหมด {JATAKA_TALES.length} เรื่อง
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {JATAKA_TALES.slice(0, 3).map((tale) => (
            <article
              key={tale.id}
              className="bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-[#EFEAE0] dark:bg-[#142038] overflow-hidden">
                  <AnimatedJatakaArtwork
                    src={tale.image}
                    alt={tale.title}
                    taleId={tale.id}
                    fallbackTitle={tale.title}
                    compact
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    <span>{tale.collection}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{tale.barami}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                    {tale.indexLabel}. {tale.title}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                    {tale.summary}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                    ที่มา: {getJatakaSourceInfo(tale).shortCitation}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenTale(tale.id)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] rounded-md transition-colors whitespace-nowrap"
                >
                  อ่านเรื่องเต็ม
                </button>
                {tale.interactiveStoryId && (
                  <button
                    type="button"
                    onClick={() => onStartInteractiveStory(tale.interactiveStoryId!)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-[#1C1917] dark:text-[#F3F0E6] bg-[#F3EFE6] dark:bg-[#232732] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap"
                  >
                    เล่นโต้ตอบ
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
