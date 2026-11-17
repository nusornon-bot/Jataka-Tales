import React, { useState } from 'react';
import { LogIn, LogOut, Moon, Sun, Type as TypeIcon, Cloud, CloudOff } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { AppMode, FontSizePreference } from '../types/jataka';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

const FONT_LABELS: Record<FontSizePreference, string> = {
  sm: 'เล็ก',
  md: 'กลาง',
  lg: 'ใหญ่',
};

const NEXT_FONT_SIZE: Record<FontSizePreference, FontSizePreference> = {
  sm: 'md',
  md: 'lg',
  lg: 'sm',
};

export const TopBar: React.FC<TopBarProps> = ({ activeMode, onSelectMode }) => {
  const {
    user,
    authBusy,
    authError,
    clearAuthError,
    signInWithGoogle,
    signOut,
    isCloudSynced,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
  } = useAppState();

  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: Array<{ id: AppMode; label: string }> = [
    { id: 'home', label: 'หน้าแรก' },
    { id: 'library', label: 'คลังชาดก' },
    { id: 'interactive', label: 'เล่านิทานโต้ตอบ' },
    { id: 'quiz', label: 'ทายข้อคิด' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 dark:bg-[#111318]/95 backdrop-blur-sm border-b border-[#E4DEC9] dark:border-[#2E3442]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Zone: Brand */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectMode('home');
          }}
          className="font-serif text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F3F0E6] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded"
        >
          ศาลาชาดก
        </a>

        {/* Center Zone: Primary Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMode(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] ${
                  isActive
                    ? 'text-[#1E3A8A] dark:text-amber-300 border-[#1E3A8A] dark:border-amber-300 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 border-transparent hover:text-[#1C1917] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Zone: Compact Utilities & Account */}
        <div className="flex items-center gap-2 shrink-0 relative">
          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setFontSize(NEXT_FONT_SIZE[fontSize])}
            title={`ปรับขนาดตัวอักษรสำหรับอ่าน (ปัจจุบัน: ${FONT_LABELS[fontSize]})`}
            aria-label={`ปรับขนาดตัวอักษร ปัจจุบัน${FONT_LABELS[fontSize]}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <TypeIcon className="w-3.5 h-3.5 text-[#92400E] dark:text-amber-400" aria-hidden="true" />
            <span>ก {FONT_LABELS[fontSize]}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดกลางคืน'}
            aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดกลางคืน'}
            className="p-1.5 text-[#1C1917] dark:text-amber-300 bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] rounded-md transition-colors shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F3F0E6] bg-white dark:bg-[#1A1D24] border border-[#D6CEBE] dark:border-[#374151] hover:bg-[#F3EFE6] dark:hover:bg-[#232732] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'บัญชีผู้ใช้'}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                )}
                <span className="max-w-[90px] truncate hidden sm:inline">
                  {user.displayName || 'บัญชีของฉัน'}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1A1D24] border border-[#E4DEC9] dark:border-[#2E3442] rounded-xl shadow-lg p-4 space-y-3 z-40">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-[#1C1917] dark:text-[#F3F0E6] truncate">
                      {user.displayName || 'กัลยาณมิตร'}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {user.email}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] pt-1 text-emerald-700 dark:text-emerald-400">
                      {isCloudSynced ? (
                        <>
                          <Cloud className="w-3 h-3" aria-hidden="true" />
                          <span>ซิงก์ความคืบหน้าและบันทึกขึ้นคลาวด์แล้ว</span>
                        </>
                      ) : (
                        <>
                          <CloudOff className="w-3 h-3 text-amber-600" aria-hidden="true" />
                          <span>กำลังเชื่อมต่อคลาวด์...</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#991B1B] dark:text-red-300 bg-[#FEF2F2] dark:bg-red-950/30 hover:bg-[#FEE2E2] dark:hover:bg-red-950/50 rounded-md transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172D6E] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{authBusy ? 'กำลังเข้า...' : 'เข้าสู่ระบบ'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 px-4 py-2 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-4 max-w-6xl mx-auto"
        >
          <span>{authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="underline font-medium shrink-0"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Mobile Compact Mode Row */}
      <div className="md:hidden border-t border-[#E4DEC9] dark:border-[#2E3442] px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navLinks.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#1E3A8A] text-white'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-[#EFEAE0] dark:hover:bg-[#232732]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
