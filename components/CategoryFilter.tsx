import React from 'react';
import { Category } from '../types';
import { Flame, BookOpen, Tv, TrendingUp, Zap, Bookmark, Globe } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  
  const icons: Record<string, React.ReactNode> = {
    [Category.HEADLINES]: <Flame size={16} />,
    [Category.SHONEN]: <Zap size={16} />,
    [Category.SEINEN]: <BookOpen size={16} />,
    [Category.ANIME_SEASON]: <Tv size={16} />,
    [Category.INDUSTRY]: <TrendingUp size={16} />,
    [Category.SAVED]: <Bookmark size={16} />,
    "Recherche": <Globe size={16} />
  };

  const categories = Object.values(Category);

  return (
    <div className="md:w-64 md:shrink-0">
      <div className="sticky top-24">
        <div className="hidden md:flex items-center gap-2 mb-6 px-1">
           <div className="w-1 h-4 bg-[var(--color-accent)]"></div>
           <h2 className="text-white font-display text-xl font-bold tracking-widest">
            CANAUX
          </h2>
        </div>
        
        <div className="flex overflow-x-auto md:flex-col gap-1.5 pb-4 md:pb-0 hide-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const isSaved = cat === Category.SAVED;
            
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-none md:rounded-sm text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap group border-l-2
                  ${isSelected 
                    ? 'border-[var(--color-secondary)] bg-white/5 text-white' 
                    : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 hover:border-gray-700'
                  }
                  ${isSaved && !isSelected ? 'text-[var(--color-secondary)]' : ''}
                `}
              >
                <span className={`relative z-10 transition-colors duration-300 ${isSelected ? 'text-[var(--color-secondary)]' : 'group-hover:text-white'}`}>
                  {icons[cat] || <Zap size={16}/>}
                </span>
                <span className="relative z-10 font-display tracking-[0.1em]">{cat}</span>
                
                {/* Glitch effect on hover for selected */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[var(--color-secondary)]/5 animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Status Panel Desktop */}
        <div className="hidden md:block mt-10 p-4 border border-gray-800 bg-black/40">
           <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
             <span className="text-[10px] font-mono text-gray-500">NETWORK</span>
             <div className="flex gap-1">
                <div className="w-1 h-3 bg-[var(--color-accent)] opacity-50"></div>
                <div className="w-1 h-3 bg-[var(--color-accent)] opacity-80"></div>
                <div className="w-1 h-3 bg-[var(--color-accent)]"></div>
             </div>
           </div>
           <div className="space-y-1">
             <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>API:</span> <span className="text-green-500">ONLINE</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>MODEL:</span> <span className="text-blue-400">GEMINI-2.5</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
