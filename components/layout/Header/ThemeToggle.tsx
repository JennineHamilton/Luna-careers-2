'use client';

import { Sun, Moon } from 'lucide-react';
import { useLayout } from '@/components/hooks/useLayout';

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useLayout();

  return (
    <button
      onClick={toggleDarkMode}
      className={`flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-fast ${
        isDarkMode
          ? 'bg-luna-blue hover:bg-luna-blue/90'
          : 'bg-luna-gray-50 hover:bg-luna-gray-100'
      }`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-[18px] h-[18px] text-white" />
      ) : (
        <Moon className="w-[18px] h-[18px] text-luna-gray-600" />
      )}
    </button>
  );
}

