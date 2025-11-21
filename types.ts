export interface Source {
  title: string;
  uri: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  sources: Source[];
  date: string; // "Il y a 2h", "Aujourd'hui", etc.
  imageUrl?: string; // URL trouvée par Gemini
}

export enum Category {
  HEADLINES = 'À la une',
  SHONEN = 'Shonen Jump & Co',
  SEINEN = 'Seinen / Adulte',
  ANIME_SEASON = 'Saison Anime Actuelle',
  INDUSTRY = 'Industrie & Japon',
  SAVED = 'Mes Favoris' // Catégorie virtuelle locale
}

export interface CacheData {
  timestamp: number;
  data: NewsItem[];
}