import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-96 space-y-8">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-24 h-24 border-4 border-gray-800 rounded-full"></div>
        {/* Spinning Gradient Ring */}
        <div className="absolute top-0 left-0 w-24 h-24 border-4 border-t-[var(--color-accent)] border-r-[var(--color-secondary)] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        {/* Inner Pulse */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[var(--color-secondary)] font-bold text-xl animate-pulse">
          AI
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-white font-display text-2xl tracking-widest animate-pulse">SCANNING WEB</p>
        <p className="text-gray-500 text-sm font-mono">Recherche de flux manga actifs...</p>
      </div>
    </div>
  );
};