import React, { useState } from 'react';
import FlashcardCard from './FlashcardCard';
import { Flashcard, StudyMode, StudyRating } from '../types';
import { calculateSRS, getPointsFromInterval } from '../services/srsService'; // Added imports
import { Check, X, HelpCircle, ArrowLeft, ThumbsUp } from 'lucide-react';

interface StudyScreenProps {
  cards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: StudyRating) => void;
  onQuit: () => void;
  mode: StudyMode;
}

const StudyScreen: React.FC<StudyScreenProps> = ({
  cards,
  currentIndex,
  isFlipped,
  onFlip,
  onRate,
  onQuit,
  mode
}) => {
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  // State for animation
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const handleRateClick = (rating: StudyRating) => {
    // 1. Calculate the FUTURE interval locally to determine points
    const predictedCard = calculateSRS(currentCard, rating);
    const points = getPointsFromInterval(predictedCard.interval || 0);

    // 2. Show Animation
    setEarnedPoints(points);

    // 3. Wait for animation then call onRate
    setTimeout(() => {
        setEarnedPoints(null);
        onRate(rating);
    }, 600); // 600ms allows animation to play
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col h-[90vh] relative">
      
      {/* POINTS ANIMATION OVERLAY */}
      {earnedPoints !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <div className="animate-[floatUp_0.8s_ease-out_forwards] flex flex-col items-center">
              <span className={`text-5xl font-black drop-shadow-md ${
                  earnedPoints === 0 ? 'text-slate-400' :
                  earnedPoints >= 50 ? 'text-yellow-400' : 
                  'text-indigo-400'
              }`}>
                +{earnedPoints} XP
              </span>
              <span className="text-white font-bold bg-black/20 px-3 py-1 rounded-full text-sm mt-2 backdrop-blur-sm">
                 {earnedPoints >= 150 ? 'MEMÓRIA MESTRE!' : 
                  earnedPoints >= 50 ? 'RETENÇÃO FORTE' :
                  earnedPoints > 0 ? 'APRENDENDO' : 'REVISÃO AGENDADA'}
              </span>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <button 
          onClick={onQuit}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 mx-4">
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Progresso</span>
            <span>{currentIndex + 1} / {cards.length}</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-out 
                ${mode === 'cloze' ? 'bg-teal-500' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col justify-center py-4">
        <FlashcardCard
          question={currentCard.question}
          answer={currentCard.answer}
          clozeText={currentCard.clozeText}
          isInverse={currentCard.isInverse}
          isFlipped={isFlipped}
          onFlip={onFlip}
          mode={mode}
        />
      </div>

      {/* Controls */}
      <div className="mt-auto pb-8 min-h-[140px]">
        {!isFlipped ? (
          <div className="text-center">
            <p className="text-slate-400 mb-4 animate-pulse">
                {mode === 'cloze' ? 'Pense na palavra que falta' : 'Tente lembrar (Recuperação Ativa)'}
            </p>
            <button 
            onClick={onFlip}
            className={`px-8 py-3 text-white rounded-xl font-medium shadow-lg active:scale-95 transition-transform 
                ${mode === 'cloze' ? 'bg-teal-700' : 'bg-slate-900'}`}
            >
            Mostrar Resposta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => handleRateClick('again')}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all border border-red-100"
            >
              <X size={20} />
              <span className="text-xs font-bold">Errei</span>
              <span className="text-[10px] opacity-70">&lt; 10m</span>
            </button>

            <button
              onClick={() => handleRateClick('hard')}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all border border-amber-100"
            >
              <HelpCircle size={20} />
              <span className="text-xs font-bold">Difícil</span>
              <span className="text-[10px] opacity-70">1d</span>
            </button>
            
            <button
              onClick={() => handleRateClick('good')}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all border border-blue-100"
            >
              <ThumbsUp size={20} />
              <span className="text-xs font-bold">Bom</span>
              <span className="text-[10px] opacity-70">3d</span>
            </button>

            <button
              onClick={() => handleRateClick('easy')}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 active:scale-95 transition-all border border-green-100"
            >
              <Check size={20} />
              <span className="text-xs font-bold">Fácil</span>
              <span className="text-[10px] opacity-70">7d</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Global CSS for the float animation */}
      <style>{`
        @keyframes floatUp {
            0% { transform: translateY(20px) scale(0.8); opacity: 0; }
            20% { transform: translateY(0px) scale(1.1); opacity: 1; }
            100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StudyScreen;