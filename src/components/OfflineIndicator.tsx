import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#92400E] dark:bg-amber-700 px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-amber-300/30"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>โหมดออฟไลน์ — กำลังใช้คลังชาดกและบันทึกที่แคชไว้บนอุปกรณ์</span>
    </div>
  );
};
