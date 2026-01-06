import React, { useState } from 'react';
import { AppState, DifficultyLevel, Flashcard, StudySessionStats, StudyMode, StudyRating } from './types';
import { generateFlashcards } from './services/geminiService';
import { calculateSRS, saveCardsToLibrary, getInterleavedDueCards, updateTopicStats, getAllLibraryCards } from './services/srsService';
import SetupScreen from './components/SetupScreen';
import StudyScreen from './components/StudyScreen';
import SummaryScreen from './components/SummaryScreen';
import NeuralHeatmap from './components/NeuralHeatmap';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentMode, setCurrentMode] = useState<StudyMode>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [sessionStats, setSessionStats] = useState<StudySessionStats>({
    easy: 0,
    good: 0,
    hard: 0,
    wrong: 0,
    totalTime: 0
  });

  const handleGenerate = async (topic: string, level: DifficultyLevel, count: number, mode: StudyMode, isBidirectional: boolean) => {
    setAppState(AppState.LOADING);
    setErrorMsg(null);
    setCurrentMode(mode);
    try {
      let generatedCards = await generateFlashcards(topic, level, count);
      
      // Handle Bidirectional Mode (Invert Front/Back)
      // The user wants to see the Answer first, then the Question.
      if (isBidirectional && mode === 'flashcard') {
         generatedCards = generatedCards.map(c => ({
           ...c,
           id: c.id + '_inv',
           // Swap Question and Answer
           question: c.answer, 
           answer: c.question,
           // Cloze text usually contains the answer, so it doesn't make sense in inverse mode
           clozeText: undefined,
           isInverse: true
         }));
      }
      
      // Save newly generated cards to library immediately
      saveCardsToLibrary(generatedCards);

      setCards(generatedCards);
      setCurrentIndex(0);
      setIsCardFlipped(false);
      setSessionStats({ easy: 0, good: 0, hard: 0, wrong: 0, totalTime: 0 });
      setAppState(AppState.STUDY);
    } catch (error) {
      console.error(error);
      setErrorMsg("Falha ao gerar cartões. Verifique sua chave de API ou tente um tema diferente.");
      setAppState(AppState.SETUP);
    }
  };

  const handleNeuroShuffle = () => {
    // Interleaving: Fetch due cards from ALL topics and shuffle them
    const dueCards = getInterleavedDueCards(20); // Limit session to 20 for focus
    if (dueCards.length === 0) {
      setErrorMsg("Nenhum cartão pendente para revisão no momento!");
      return;
    }
    
    setCards(dueCards);
    setCurrentMode('flashcard'); // Neuro-shuffle defaults to standard card view
    setCurrentIndex(0);
    setIsCardFlipped(false);
    setSessionStats({ easy: 0, good: 0, hard: 0, wrong: 0, totalTime: 0 });
    setAppState(AppState.STUDY);
  }

  const handleOpenNeuralMap = () => {
    // Load ALL cards from library for the visualization
    const allCards = getAllLibraryCards();
    if (allCards.length === 0) {
      setErrorMsg("Sua biblioteca está vazia. Gere cartões primeiro!");
      return;
    }
    setCards(allCards);
    setAppState(AppState.NEURAL_MAP);
  };

  const handleFlip = () => {
    setIsCardFlipped(!isCardFlipped);
  };

  const handleRate = (rating: StudyRating) => {
    // 1. Update Session Stats
    setSessionStats(prev => ({
      ...prev,
      [rating === 'again' ? 'wrong' : rating]: prev[rating === 'again' ? 'wrong' : rating] + 1
    }));

    // 2. Update Topic Stats & SRS Data for the card
    const currentCard = cards[currentIndex];
    
    // Update stats for the specific topic of this card
    updateTopicStats(currentCard.topic, rating);

    const updatedCard = calculateSRS(currentCard, rating);
    
    // 3. Save updated card state to Library (persistence)
    saveCardsToLibrary([updatedCard]);

    // 4. Move to next card or finish
    if (currentIndex < cards.length - 1) {
      setIsCardFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300); 
    } else {
      setAppState(AppState.SUMMARY);
    }
  };

  const handleRestart = () => {
    setAppState(AppState.SETUP);
    setCards([]);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6">
      
      {errorMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-md">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{errorMsg}</p>
            <button 
              onClick={() => setErrorMsg(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {appState === AppState.SETUP || appState === AppState.LOADING ? (
        <SetupScreen 
          onGenerate={handleGenerate} 
          onNeuroShuffle={handleNeuroShuffle}
          onOpenNeuralMap={handleOpenNeuralMap}
          isLoading={appState === AppState.LOADING} 
        />
      ) : appState === AppState.STUDY ? (
        <StudyScreen
          cards={cards}
          currentIndex={currentIndex}
          isFlipped={isCardFlipped}
          onFlip={handleFlip}
          onRate={handleRate}
          onQuit={handleRestart}
          mode={currentMode}
        />
      ) : appState === AppState.SUMMARY ? (
        <SummaryScreen
          stats={sessionStats}
          onRestart={handleRestart}
          onHome={handleRestart}
        />
      ) : appState === AppState.NEURAL_MAP ? (
        <NeuralHeatmap
          cards={cards}
          onBack={handleRestart}
        />
      ) : null}
    </div>
  );
};

export default App;