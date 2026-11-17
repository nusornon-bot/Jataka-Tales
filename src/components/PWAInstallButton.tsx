import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="ติดตั้งแอปศาลาชาดกไว้บนอุปกรณ์เพื่ออ่านแบบออฟไลน์"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-amber-200 bg-[#F3EFE6] dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">ติดตั้งแอป</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="ติดตั้งบน iPhone / iPad"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-amber-200 bg-[#F3EFE6] dark:bg-[#232732] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#E7E0D3] dark:hover:bg-[#2D3342] rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">ติดตั้งแอป</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="วิธีติดตั้งศาลาชาดกบน iOS"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#F3F0E6]">
                  ติดตั้งศาลาชาดกบน iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="ปิดคำแนะนำ"
                  className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-stone-700 dark:text-stone-300 leading-relaxed list-decimal list-inside">
                <li>
                  แตะปุ่ม <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> แชร์ (Share)</strong> ในแถบเครื่องมือ Safari
                </li>
                <li>
                  เลื่อนลงแล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                </li>
                <li>แตะ <strong>เพิ่ม (Add)</strong> เพื่อเปิดใช้งานแบบเต็มหน้าจอและออฟไลน์ได้</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-md bg-[#1E3A8A] hover:bg-[#172D6E] py-2 text-xs font-semibold text-white transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
