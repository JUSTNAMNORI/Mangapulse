import { GoogleGenAI } from "@google/genai";
import { NewsItem, Source, Category } from '../types';
import { storageService } from './storage';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Récupération des news via Gemini
 */
export const fetchMangaNews = async (category: Category | string): Promise<NewsItem[]> => {
  // 1. Vérification du cache via le service
  const cacheKey = typeof category === 'string' ? category : 'default';
  const cachedNews = await storageService.getCache(cacheKey);
  const blacklist = await storageService.getBlacklist();

  if (cachedNews) {
    return cachedNews.filter(item => !blacklist.includes(item.title));
  }

  // 2. Préparation de la requête IA
  const modelId = "gemini-2.5-flash"; 
  
  let searchContext = "";
  if (category === Category.HEADLINES) {
    searchContext = "Dernières actualités majeures manga et anime (Japon/France) et sujets tendances sur X (Twitter).";
  } else if (category === Category.SHONEN) {
    searchContext = "News Shonen Jump, Kodansha, nouveautés shonen et leaks fiables.";
  } else if (category === Category.SEINEN) {
    searchContext = "News Seinen, nouveautés adultes, Berserk, Vinland Saga.";
  } else if (category === Category.ANIME_SEASON) {
    searchContext = "Sorties épisodes animes saison actuelle, Crunchyroll, Netflix, réactions fans.";
  } else if (category === Category.INDUSTRY) {
    searchContext = "Ventes manga Oricon, annonces éditeurs, industrie animation.";
  } else {
    searchContext = `Actualités concernant : ${category}`;
  }

  const prompt = `
  Tu es le moteur d'actualités de "MangaPulse". Recherche sur le web. 
  Sources prioritaires : Manga-News, ANN, Crunchyroll, Comptes Officiels sur X (Twitter), Posts viraux/importants sur X (Twitter) concernant le manga/anime.

  Sujet : ${searchContext}

  Génère 6 news pertinentes et distinctes.
  
  Format de réponse attendu :
  Renvoie UNIQUEMENT un tableau JSON brut. N'utilise pas de blocs de code Markdown (\`\`\`json).
  Chaque objet du tableau doit avoir cette structure exacte :
  {
    "title": "Titre court et percutant (Français)",
    "summary": "Résumé informatif (max 200 caractères, Français)",
    "tags": ["Tag1", "Tag2"],
    "date": "Date relative (ex: Il y a 2h)",
    "imageUrl": "URL directe de l'image de l'article si trouvée, sinon null",
    "sourceUrl": "URL de l'article source ou du post X (Twitter) si trouvée, sinon null"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // 3. Parsing manuel du JSON (pour éviter les erreurs de format)
    let jsonText = response.text || "[]";
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const startIdx = jsonText.indexOf('[');
    const endIdx = jsonText.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
    }

    let parsedItems: any[] = [];
    try {
      parsedItems = JSON.parse(jsonText);
    } catch (e) {
      console.error("Erreur parsing JSON manuel", e);
      return [];
    }

    // 4. Enrichissement avec Grounding (Sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const finalItems: NewsItem[] = parsedItems.map((item, index) => {
      let sources: Source[] = [];
      
      if (item.sourceUrl) {
        const isTwitter = item.sourceUrl.includes('twitter.com') || item.sourceUrl.includes('x.com');
        sources.push({ title: isTwitter ? "X / Twitter" : "Source Directe", uri: item.sourceUrl });
      }
      
      if (sources.length === 0 && groundingChunks.length > 0) {
         const chunk = groundingChunks[index % groundingChunks.length];
         if (chunk?.web?.uri) {
             sources.push({ title: chunk.web.title || "Source Web", uri: chunk.web.uri });
         }
      }
      
      if (sources.length === 0) {
          sources.push({ title: "Recherche Google", uri: `https://www.google.com/search?q=${encodeURIComponent(item.title)}` });
      }

      let cleanImage = item.imageUrl;
      if (cleanImage && !cleanImage.startsWith('http')) cleanImage = undefined;

      return {
        id: `news-${Date.now()}-${index}`,
        title: item.title || "Titre Inconnu",
        summary: item.summary || "Pas de résumé.",
        tags: Array.isArray(item.tags) ? item.tags.slice(0,3) : ["Manga"],
        date: item.date || "Récemment",
        sources: sources,
        imageUrl: cleanImage
      };
    }).filter(item => !blacklist.includes(item.title));

    // 5. Sauvegarde dans le cache via le service
    if (finalItems.length > 0) {
      await storageService.setCache(cacheKey, finalItems);
    }

    return finalItems;

  } catch (error) {
    console.error("Erreur Gemini Service:", error);
    throw error;
  }
};

export const clearCache = () => storageService.clearCache();