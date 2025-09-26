import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AnimatedThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedThemeToggle({ className = '', size = 'md' }: AnimatedThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-10 h-6 p-0.5',
    md: 'w-12 h-7 p-0.5',
    lg: 'w-14 h-8 p-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center rounded-full 
        transition-all duration-300 ease-in-out
        ${isDark 
          ? 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600' 
          : 'bg-gradient-to-r from-sky-200 to-sky-300 border-sky-300'
        }
        border-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-brand/50
        ${sizeClasses[size]} ${className}
      `}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      style={{
        boxShadow: isDark 
          ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Background overlay for smooth transition */}
      <div 
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isDark 
            ? 'bg-gradient-to-r from-indigo-900 to-purple-900 opacity-30' 
            : 'bg-gradient-to-r from-yellow-200 to-orange-200 opacity-40'
          }
        `}
      />
      
      {/* Toggle Circle */}
      <div
        className={`
          relative flex items-center justify-center
          rounded-full transition-all duration-300 ease-in-out
          ${isDark 
            ? 'bg-gradient-to-br from-slate-300 to-slate-100 translate-x-0' 
            : 'bg-gradient-to-br from-white to-yellow-100 translate-x-full'
          }
          ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}
          shadow-lg
        `}
        style={{
          boxShadow: isDark 
            ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Sun Icon */}
        <Sun 
          className={`
            absolute transition-all duration-300 text-yellow-500
            ${iconSizes[size]}
            ${isDark ? 'opacity-0 scale-50 rotate-180' : 'opacity-100 scale-100 rotate-0'}
          `} 
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            absolute transition-all duration-300 text-slate-600
            ${iconSizes[size]}
            ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-180'}
          `} 
        />
      </div>
      
      {/* Decorative stars for dark mode */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-300 rounded-full opacity-60 animate-pulse" />
          <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      )}
    </button>
  );
}

export default AnimatedThemeToggle;