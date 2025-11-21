import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { NewsCard } from './components/NewsCard';
import { Loader } from './components/Loader';
import { fetchMangaNews } from './services/geminiService';
import { storageService } from './services/storage';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Category, NewsItem } from './types';
import { AlertTriangle, Inbox } from 'lucide-react';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(Category.HEADLINES);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [savedNews, setSavedNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  // Gestion de l'utilisateur et rechargement des données
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        // Recharger les favoris quand l'utilisateur change (Login/Logout)
        const saved = await storageService.getFavorites();
        setSavedNews(saved);
        
        // Si on était sur l'onglet favoris, on rafraichit la vue
        if (activeCategory === Category.SAVED) {
          setNews(saved);
        }
      });
      return () => unsubscribe();
    } else {
       // Fallback si Firebase pas configuré
       storageService.getFavorites().then(setSavedNews);
    }
  }, [activeCategory]);

  const handleToggleSave = async (item: NewsItem) => {
    // Optimistic UI update pour fluidité
    const isAlreadySaved = savedNews.some(s => s.id === item.id);
    let tempSaved;
    
    if (isAlreadySaved) {
        tempSaved = savedNews.filter(s => s.id !== item.id);
    } else {
        tempSaved = [item, ...savedNews];
    }
    setSavedNews(tempSaved); // Update immédiat

    // Persistance asynchrone
    const newSavedList = await storageService.toggleFavorite(item);
    setSavedNews(newSavedList); // Update confirmé (source de vérité)
  };

  const handleBanItem = async (item: NewsItem) => {
    if (confirm(`Voulez-vous bannir définitivement l'article : "${item.title}" ?`)) {
      await storageService.addToBlacklist(item.title);
      setNews(prev => prev.filter(n => n.title !== item.title));
    }
  };

  const loadNews = useCallback(async (topic: string) => {
    setError(null);
    
    if (topic === Category.SAVED) {
      setIsLoading(true);
      try {
        const freshSaved = await storageService.getFavorites();
        setSavedNews(freshSaved);
        setNews(freshSaved);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const items = await fetchMangaNews(topic);
      setNews(items);
    } catch (err) {
      console.error(err);
      setError("Impossible de scanner le réseau. Vérifiez votre connexion ou réessayez plus tard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(activeCategory);
  }, [loadNews, activeCategory]);

  const handleSearch = (query: string) => {
    setActiveCategory(`Recherche: ${query}`);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header 
        onSearch={handleSearch} 
        onRefreshCache={() => loadNews(activeCategory)} 
        isAdminMode={isAdminMode}
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-10">
          
          {/* Sidebar */}
          <aside className="md:sticky md:top-24 h-fit z-40">
             <CategoryFilter 
               selectedCategory={activeCategory.startsWith('Recherche:') ? 'Recherche' : activeCategory} 
               onSelectCategory={setActiveCategory} 
             />
          </aside>

          {/* Main Content */}
          <section className="flex-1 min-w-0">
            <div className="mb-8 border-b border-gray-800 pb-4 flex items-end justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight font-display">
                  {activeCategory === Category.SAVED ? 'ARCHIVES' : activeCategory.replace('Recherche: ', '')}
                </h1>
                <div className="h-1 w-24 bg-[var(--color-accent)]"></div>
              </div>
              
              {!isLoading && (
                <span className="text-xs font-mono text-gray-500">
                  {news.length} ARTICLES
                </span>
              )}
            </div>

            {isLoading ? (
              <Loader />
            ) : error ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8 flex items-center gap-6">
                <div className="bg-red-500/10 p-4 rounded-full">
                  <AlertTriangle className="text-red-500 h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-500 mb-1 font-display">ERREUR DE FLUX</h3>
                  <p className="text-red-200/60 mb-4">{error}</p>
                  <button 
                    onClick={() => loadNews(activeCategory)}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded uppercase tracking-wider transition"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-2xl border border-dashed border-gray-700">
                <Inbox className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-xl font-display">AUCUNE DONNÉE</p>
                {activeCategory === Category.SAVED && (
                  <p className="text-gray-500 mt-2">
                    {user ? "Votre liste de lecture est vide." : "Connectez-vous pour sauvegarder vos articles."}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                  <NewsCard 
                    key={item.id} 
                    item={item} 
                    isSaved={savedNews.some(s => s.id === item.id)}
                    onToggleSave={handleToggleSave}
                    isAdminMode={isAdminMode}
                    onBanItem={handleBanItem}
                  />
                ))}
              </div>
            )}
            
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;