import { Flashcard, TopicStatsMap, TopicStat, StudyRating } from "../types";

const STORAGE_KEY = 'flashai_library_v1';
const STATS_KEY = 'flashai_topic_stats_v1';

// Refined SM-2 Algorithm for Neuro-linguistic optimization
export const calculateSRS = (card: Flashcard, rating: StudyRating): Flashcard => {
  let { interval = 0, repetition = 0, easeFactor = 2.5 } = card;

  // Rating mapping:
  // again (Errei) = 0
  // hard (Difícil) = 3
  // good (Bom) = 4
  // easy (Fácil) = 5
  
  let quality = 0;
  if (rating === 'again') quality = 0;
  if (rating === 'hard') quality = 3;
  if (rating === 'good') quality = 4;
  if (rating === 'easy') quality = 5;

  // Algorithm Logic
  if (quality >= 3) {
    if (repetition === 0) {
      // First successful recall
      if (quality === 3) interval = 1; // Hard -> 1 day
      if (quality === 4) interval = 3; // Good -> 3 days
      if (quality === 5) interval = 7; // Easy -> 7 days
    } else if (repetition === 1) {
      // Second repetition
      if (quality === 3) interval = 3;
      if (quality === 4) interval = 6;
      if (quality === 5) interval = 14;
    } else {
      // Subsequent repetitions
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Forgot (Again)
    repetition = 0;
    interval = 0; // Review in same session (conceptually), or < 10 min
  }

  // Update Ease Factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // Minimum EF is 1.3
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // If interval is 0, we technically want it "now", but for storage we set it to now.
  // Ideally, 'again' cards should be pushed back into the current study queue in the App logic.
  // Here we set nextReview to now.
  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    interval,
    repetition,
    easeFactor,
    nextReview
  };
};

export const saveCardsToLibrary = (cards: Flashcard[]) => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const library: Flashcard[] = existingData ? JSON.parse(existingData) : [];
    
    const libraryMap = new Map(library.map(c => [c.id, c]));
    cards.forEach(c => libraryMap.set(c.id, c));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(libraryMap.values())));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
};

export const getDueCards = (): Flashcard[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return [];
    
    const library: Flashcard[] = JSON.parse(existingData);
    const now = Date.now();
    
    return library.filter(c => !c.nextReview || c.nextReview <= now);
  } catch (e) {
    console.error("Failed to load library", e);
    return [];
  }
};

export const getAllLibraryCards = (): Flashcard[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return [];
    return JSON.parse(existingData);
  } catch (e) {
    console.error("Failed to load library", e);
    return [];
  }
};

/**
 * INTERLEAVING (Neuro-Shuffle):
 * Gets due cards from ALL topics and shuffles them to force context switching.
 */
export const getInterleavedDueCards = (limit: number = 20): Flashcard[] => {
  const due = getDueCards();
  // Fisher-Yates shuffle
  for (let i = due.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [due[i], due[j]] = [due[j], due[i]];
  }
  return due.slice(0, limit);
}

export const getLibraryCount = (): number => {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) return 0;
        return JSON.parse(existingData).length;
    } catch {
        return 0;
    }
}

// --- Topic Statistics Methods ---

export const getAllTopicStats = (): TopicStatsMap => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load stats", e);
  }
  return {};
};

export const getStatsForTopic = (topic: string): TopicStat => {
    const allStats = getAllTopicStats();
    const key = topic.trim().toLowerCase();
    
    if (allStats[key]) {
        return allStats[key];
    }
    
    return { easy: 0, good: 0, hard: 0, wrong: 0, totalAnswered: 0, lastAccessed: 0 };
}

export const getGlobalStats = (): TopicStat => {
    const allStats = getAllTopicStats();
    const global: TopicStat = { easy: 0, good: 0, hard: 0, wrong: 0, totalAnswered: 0, lastAccessed: 0 };
    
    Object.values(allStats).forEach(stat => {
        global.easy += stat.easy;
        global.good += (stat.good || 0);
        global.hard += stat.hard;
        global.wrong += stat.wrong;
        global.totalAnswered += stat.totalAnswered;
        if(stat.lastAccessed > global.lastAccessed) global.lastAccessed = stat.lastAccessed;
    });
    
    return global;
}

export const updateTopicStats = (topic: string, rating: StudyRating) => {
  try {
    const allStats = getAllTopicStats();
    const key = topic.trim().toLowerCase();

    if (!allStats[key]) {
        allStats[key] = { easy: 0, good: 0, hard: 0, wrong: 0, totalAnswered: 0, lastAccessed: 0 };
    }

    if (rating === 'again') allStats[key].wrong += 1;
    if (rating === 'hard') allStats[key].hard += 1;
    if (rating === 'good') allStats[key].good += 1;
    if (rating === 'easy') allStats[key].easy += 1;
    
    allStats[key].totalAnswered += 1;
    allStats[key].lastAccessed = Date.now();

    localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
  } catch (e) {
    console.error("Failed to update stats", e);
  }
};

export const getTopTopics = (limit: number = 5): string[] => {
    const allStats = getAllTopicStats();
    const sortedKeys = Object.keys(allStats).sort((a, b) => {
        return allStats[b].totalAnswered - allStats[a].totalAnswered;
    });
    return sortedKeys.slice(0, limit).map(k => k.charAt(0).toUpperCase() + k.slice(1));
}

// --- GAMIFICATION LOGIC ---

export interface UserLevelInfo {
  score: number;
  levelTitle: string;
  nextLevelTitle: string;
  minScore: number;
  nextLevelScore: number;
  progressPercent: number;
}

// Helper: Calculate points based on interval
export const getPointsFromInterval = (interval: number): number => {
  // Nível 0: Novo/Erro
  if (interval === 0) return 0;
  // Nível 1-2: Aprendendo (1 a 6 dias)
  if (interval <= 6) return 10;
  // Nível 3-5: Retenção Média (7 a 21 dias)
  if (interval <= 21) return 50;
  // Nível 6+: Mestre (> 21 dias)
  return 150;
};

export const calculateNeuroScore = (): number => {
  const cards = getAllLibraryCards();
  return cards.reduce((acc, card) => {
    return acc + getPointsFromInterval(card.interval || 0);
  }, 0);
};

export const getUserLevelInfo = (): UserLevelInfo => {
  const score = calculateNeuroScore();
  
  const levels = [
    { title: "Iniciante Sináptico", min: 0, max: 500 },
    { title: "Estudante Focado", min: 500, max: 2000 },
    { title: "Arquiteto da Memória", min: 2000, max: 5000 },
    { title: "Mestre da Neuroplasticidade", min: 5000, max: Infinity }
  ];

  const currentLevel = levels.find(l => score >= l.min && score < l.max) || levels[levels.length - 1];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];

  let progressPercent = 0;
  
  if (nextLevel) {
    const range = currentLevel.max - currentLevel.min;
    const progress = score - currentLevel.min;
    progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
  } else {
    progressPercent = 100; // Max level reached
  }

  return {
    score,
    levelTitle: currentLevel.title,
    nextLevelTitle: nextLevel ? nextLevel.title : "Lenda Viva",
    minScore: currentLevel.min,
    nextLevelScore: currentLevel.max === Infinity ? score : currentLevel.max,
    progressPercent
  };
};