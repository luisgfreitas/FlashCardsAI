export enum DifficultyLevel {
  Elementary = "Ensino Fundamental",
  HighSchool = "Ensino Médio",
  University = "Universitário/Profissional",
  Expert = "Especialista/PhD"
}

export type StudyMode = 'flashcard' | 'cloze';

export type StudyRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  topic: string; 
  question: string;
  answer: string;
  clozeText?: string; 
  isInverse?: boolean; // Indicates if the card is in inverse mode (Answer -> Question)
  
  // SRS Fields
  nextReview?: number; 
  interval?: number; 
  repetition?: number;
  easeFactor?: number;
}

export interface TopicStat {
  easy: number;
  good: number; // Added
  hard: number;
  wrong: number; // mapped to 'again'
  totalAnswered: number;
  lastAccessed: number;
}

export type TopicStatsMap = Record<string, TopicStat>;

export enum AppState {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  STUDY = 'STUDY',
  SUMMARY = 'SUMMARY',
  ERROR = 'ERROR',
  NEURAL_MAP = 'NEURAL_MAP'
}

export interface StudySessionStats {
  easy: number;
  good: number;
  hard: number;
  wrong: number;
  totalTime: number; 
}