import { NewsItem, CacheData } from '../types';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";

// --- HELPERS LOCAUX ---
const local = {
  get: (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => localStorage.removeItem(key)
};

/**
 * Service de stockage hybride.
 * Bascule automatiquement entre LocalStorage (Invité) et Firestore (Connecté).
 */
export const storageService = {
  
  // -------------------------------
  // 1. GESTION DES FAVORIS
  // -------------------------------
  async getFavorites(): Promise<NewsItem[]> {
    // Si l'utilisateur est connecté, on priorise le Cloud
    if (auth?.currentUser && db) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          return userDoc.data().favorites || [];
        }
        return [];
      } catch (e) {
        console.error("Erreur Firestore (Lecture Favoris):", e);
        // Fallback silencieux en local en cas d'erreur réseau
        return local.get('mangapulse_saved') || [];
      }
    }
    
    // Sinon, LocalStorage
    return local.get('mangapulse_saved') || [];
  },

  async toggleFavorite(item: NewsItem): Promise<NewsItem[]> {
    const currentUser = auth?.currentUser;

    if (currentUser && db) {
      // MODE CLOUD (FIREBASE)
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        let currentFavorites: NewsItem[] = [];

        if (userDoc.exists()) {
          currentFavorites = userDoc.data().favorites || [];
        }

        const exists = currentFavorites.find(i => i.id === item.id);
        let newFavorites;

        if (exists) {
          // Suppression
          newFavorites = currentFavorites.filter(i => i.id !== item.id);
          await updateDoc(userRef, {
            favorites: arrayRemove(exists) // Note: arrayRemove needs exact object ref usually, brute replace is safer for complex objects
          });
          // Pour être sûr avec les objets complexes, on réécrit souvent tout le tableau
          await setDoc(userRef, { favorites: newFavorites }, { merge: true });
        } else {
          // Ajout
          newFavorites = [item, ...currentFavorites];
          await setDoc(userRef, { favorites: newFavorites }, { merge: true });
        }
        return newFavorites;
      } catch (e) {
        console.error("Erreur Firestore (Ecriture Favoris):", e);
        return [];
      }

    } else {
      // MODE LOCAL (GUEST)
      let current = local.get('mangapulse_saved') || [];
      const exists = current.find((i: NewsItem) => i.id === item.id);
      
      let updated;
      if (exists) {
        updated = current.filter((i: NewsItem) => i.id !== item.id);
      } else {
        updated = [item, ...current];
      }
      local.set('mangapulse_saved', updated);
      return updated;
    }
  },

  // -------------------------------
  // 2. GESTION DE LA BLACKLIST
  // -------------------------------
  async getBlacklist(): Promise<string[]> {
    // La blacklist est globale si possible, sinon locale
    if (db) {
        try {
            // On lit une collection globale "blacklist"
            const querySnapshot = await getDocs(collection(db, "blacklist"));
            const list: string[] = [];
            querySnapshot.forEach((doc) => {
                list.push(doc.id); // On utilise l'ID du doc comme titre banni
            });
            if (list.length > 0) return list;
        } catch (e) {
            // Ignorer erreur permission si pas admin
        }
    }
    return local.get('mangapulse_blacklist') || [];
  },

  async addToBlacklist(title: string): Promise<void> {
    // On écrit toujours en local pour effet immédiat UI
    const list = local.get('mangapulse_blacklist') || [];
    if (!list.includes(title)) {
        list.push(title);
        local.set('mangapulse_blacklist', list);
    }

    // Si connecté (et idéalement Admin, mais géré par Firebase Rules), on pousse dans le Cloud
    if (auth?.currentUser && db) {
        try {
            // On utilise le titre comme ID pour dédupliquer automatiquement
            // On remplace les char spéciaux pour l'ID
            const safeId = title.replace(/[^a-z0-9]/gi, '_').toLowerCase(); 
            await setDoc(doc(db, "blacklist", safeId), { title: title, bannedBy: auth.currentUser.uid, at: new Date() });
        } catch (e) {
            console.error("Erreur ajout blacklist cloud", e);
        }
    }
  },

  // -------------------------------
  // 3. GESTION DU CACHE (Toujours Local)
  // -------------------------------
  // Le cache des requêtes API Gemini reste en LocalStorage pour ne pas saturer 
  // les lectures Firestore et garder la rapidité.
  async getCache(key: string): Promise<NewsItem[] | null> {
    const cached = local.get(`mangapulse_cache_${key}`);
    if (!cached) return null;

    const CACHE_DURATION = 60 * 60 * 1000; // 1 heure
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },

  async setCache(key: string, data: NewsItem[]): Promise<void> {
    const cacheObject: CacheData = {
      timestamp: Date.now(),
      data
    };
    local.set(`mangapulse_cache_${key}`, cacheObject);
  },

  async clearCache(): Promise<void> {
    Object.keys(localStorage).forEach(key => {
      if(key.startsWith('mangapulse_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
