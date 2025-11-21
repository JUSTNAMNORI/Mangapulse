import React, { useState } from 'react';
import { NewsItem } from '../types';
import { ExternalLink, Clock, Bookmark, Zap, Ban } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  isSaved: boolean;
  onToggleSave: (item: NewsItem) => void;
  isAdminMode: boolean;
  onBanItem: (item: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, isSaved, onToggleSave, isAdminMode, onBanItem }) => {
  const [imgError, setImgError] = useState(false);

  // Génération d'une image contextuelle si l'image source manque ou échoue
  const fallbackImage = `https://image.pollinations.ai/prompt/detailed%20anime%20manga%20art%20style%20illustration%20${encodeURIComponent(item.tags[0] || 'manga')}%20${encodeURIComponent(item.title.slice(0, 20))}?width=600&height=400&nologo=true&seed=${item.id}&model=flux`;

  const displayImage = (item.imageUrl && !imgError) ? item.imageUrl : fallbackImage;
  const mainLink = item.sources[0]?.uri;

  const handleCardClick = () => {
    if (mainLink) {
      window.open(mainLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex flex-col h-full bg-[#0a0a0a] border transition-all duration-300 rounded-sm overflow-hidden cursor-pointer
        ${isAdminMode ? 'border-red-900/30 hover:border-red-500' : 'border-gray-800 hover:border-[var(--color-secondary)] hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]'}
      `}
    >
      
      {/* Image Area */}
      <div className="relative h-48 overflow-hidden bg-gray-900/50">
        <img 
          src={displayImage} 
          alt={item.title} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
        
        {/* Top Left Tags */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black/70 border border-[var(--color-accent)] text-[var(--color-accent)] backdrop-blur-sm skew-x-[-10deg]">
              <span className="block skew-x-[10deg]">{tag}</span>
            </span>
          ))}
        </div>

        {/* Admin Ban Button */}
        {isAdminMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onBanItem(item); }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 z-30 shadow-lg hover:scale-105 transition"
          >
            <span className="flex items-center gap-1"><Ban size={12}/> BANNIR</span>
          </button>
        )}

        {/* Save Button - stopPropagation important ici pour ne pas ouvrir le lien */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSave(item); }}
          className={`absolute top-2 right-2 p-2 z-20 transition-all clip-path-polygon ${isSaved ? 'text-[var(--color-secondary)]' : 'text-white hover:text-[var(--color-secondary)]'}`}
          title="Sauvegarder"
        >
           <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex flex-col flex-grow p-5 pt-2 relative">
        {/* Decorative Line */}
        <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent group-hover:via-[var(--color-secondary)] transition-colors"></div>

        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-mono mb-2 mt-1 uppercase tracking-widest">
          <Clock size={10} />
          <span>{item.date}</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-3 leading-6 font-display tracking-wide group-hover:text-[var(--color-secondary)] transition-colors line-clamp-2">
          {item.title}
        </h3>
        
        <p className="text-[var(--color-text-muted)] text-sm mb-4 flex-grow line-clamp-3 leading-relaxed">
          {item.summary}
        </p>
        
        {/* Footer */}
        <div className="mt-auto pt-3 flex justify-between items-center border-t border-gray-800/50 group-hover:border-gray-700/80 transition-colors">
           <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
              <Zap size={10} className="text-[var(--color-accent)]" />
              {item.sources[0]?.title || 'SOURCE WEB'}
           </div>

           {mainLink && (
            <span 
              className="flex items-center gap-1 text-xs font-bold text-white hover:text-[var(--color-accent)] transition-colors uppercase tracking-wider font-display group/link"
            >
              Lire <ExternalLink size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </span>
          )}
        </div>
      </div>
      
      {/* Hover Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};