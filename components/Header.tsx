import React, { useState, useEffect } from 'react';
import { Search, Menu, X, Zap, Trash2, ShieldAlert, LogIn, LogOut, User } from 'lucide-react';
import { clearCache } from '../services/geminiService';
import { signInWithGoogle, logout, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface HeaderProps {
  onSearch: (query: string) => void;
  onRefreshCache: () => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onRefreshCache, isAdminMode, onToggleAdmin }) => {
  const [searchValue, setSearchValue] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
      setIsMobileMenuOpen(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    onRefreshCache();
    window.location.reload();
  };

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount === 5) {
      onToggleAdmin();
      setLogoClickCount(0);
    }
    setTimeout(() => setLogoClickCount(0), 2000);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-gray-800">
      {isAdminMode && (
        <div className="bg-red-600 text-white text-[10px] font-bold text-center py-0.5 tracking-widest animate-pulse">
          MODE ADMINISTRATEUR ACTIVÉ
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none" 
            onClick={handleLogoClick}
            title="Astuce : Cliquez 5 fois ici pour activer le mode admin"
          >
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500 ${isAdminMode ? 'opacity-100 animate-pulse' : ''}`}></div>
              <div className="relative w-10 h-10 bg-black border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                <Zap className="text-[var(--color-secondary)] fill-[var(--color-secondary)]" size={20} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-display font-bold tracking-wider text-white leading-none">
                MANGA<span className="text-[var(--color-accent)]">PULSE</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-none ml-0.5">
                News Aggregator
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-12">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] rounded-full blur opacity-20 group-focus-within:opacity-60 transition duration-500"></div>
              <div className="relative bg-black rounded-full p-0.5 flex items-center">
                <input
                  type="text"
                  className="block w-full pl-5 pr-12 py-2.5 bg-black text-white placeholder-gray-500 focus:outline-none rounded-full text-sm font-medium"
                  placeholder="Rechercher (ex: One Piece, Jujutsu Kaisen...)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button type="submit" className="absolute right-2 p-1.5 bg-gray-900 rounded-full text-gray-400 hover:text-white transition">
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
             {isAdminMode && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-bold border border-red-900 bg-red-900/20 px-2 py-1 rounded">
                   <ShieldAlert size={14} />
                   ADMIN
                </div>
             )}
             
             <button 
               onClick={handleClearCache}
               className="flex items-center gap-2 text-xs text-gray-500 hover:text-[var(--color-accent)] transition-colors uppercase font-bold tracking-wider"
               title="Vider le cache"
             >
               <Trash2 size={14} />
             </button>

             {/* User Auth */}
             {user ? (
               <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
                 {user.photoURL ? (
                   <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-600" />
                 ) : (
                   <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white"><User size={14}/></div>
                 )}
                 <button 
                   onClick={logout}
                   className="text-xs text-gray-400 hover:text-white font-bold uppercase tracking-wider"
                 >
                   <LogOut size={14} />
                 </button>
               </div>
             ) : (
               <button
                 onClick={signInWithGoogle}
                 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-full text-xs text-white font-bold uppercase tracking-wider transition"
               >
                 <LogIn size={14} />
                 Connexion
               </button>
             )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="text-white p-2"
             >
               {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-6 bg-black border-b border-gray-800">
           {user && (
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-900">
               <img src={user.photoURL || ''} className="w-8 h-8 rounded-full"/>
               <span className="text-sm text-white font-bold">{user.displayName}</span>
               <button onClick={logout} className="ml-auto text-xs text-red-400 font-bold">DÉCONNEXION</button>
             </div>
           )}
           
           <form onSubmit={handleSubmit}>
              <div className="relative mt-2">
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-gray-800 rounded-lg bg-gray-900 text-white focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="Rechercher un titre..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
                   <Search className="h-5 w-5 text-[var(--color-accent)]" />
                </button>
              </div>
           </form>
           
           {!user && (
              <button onClick={signInWithGoogle} className="mt-4 w-full py-3 bg-[var(--color-accent)]/20 border border-[var(--color-accent)] text-[var(--color-accent)] font-bold rounded-lg flex justify-center items-center gap-2">
                <LogIn size={16} /> CONNEXION GOOGLE
              </button>
           )}
        </div>
      )}
    </header>
  );
};
