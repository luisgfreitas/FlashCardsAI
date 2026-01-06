import React, { useEffect, useState } from 'react';
import { RefreshCw, Volume2, StopCircle } from 'lucide-react';
import { StudyMode } from '../types';

interface FlashcardCardProps {
  question: string;
  answer: string;
  clozeText?: string;
  isInverse?: boolean;
  isFlipped: boolean;
  onFlip: () => void;
  mode: StudyMode;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ 
  question, 
  answer, 
  clozeText, 
  isInverse,
  isFlipped, 
  onFlip,
  mode 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Stop speaking if card flips back or changes
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [question, isFlipped]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // For speech, we need to strip HTML tags from the answer
    const textToReadRaw = mode === 'cloze' ? answer : answer;
    const textToRead = textToReadRaw.replace(/<[^>]*>?/gm, ''); // Strip HTML tags

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const renderFrontContent = () => {
    if (mode === 'cloze') {
      return (
         <div className="flex flex-col items-center justify-center text-center h-full">
          <div className="mb-4">
            <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Complete a Frase
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-6 opacity-70">
            {question}
          </h3>
          <p className="text-xl md:text-2xl font-medium text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {clozeText || "Erro ao carregar texto..."}
          </p>
          <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2 animate-pulse">
            <RefreshCw size={14} />
            Ver resposta completa
          </div>
        </div>
      );
    }

    // Default Flashcard Mode
    return (
       <div className="flex flex-col items-center justify-center text-center h-full">
          <div className="mb-4">
            <span className={`${isInverse ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors`}>
              {isInverse ? "Resposta" : "Pergunta"}
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-slate-800 leading-tight">
            {question}
          </h3>
          <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2 animate-pulse">
            <RefreshCw size={14} />
            Clique para ver a {isInverse ? "pergunta" : "resposta"}
          </div>
        </div>
    );
  };

  return (
    <div 
      className="w-full max-w-md h-[30rem] cursor-pointer perspective-1000 group mx-auto"
      onClick={onFlip}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of Card */}
        <div className="absolute w-full h-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center backface-hidden border-2 border-slate-100 overflow-hidden">
          {renderFrontContent()}
        </div>

        {/* Back of Card (Answer) */}
        <div className="absolute w-full h-full bg-indigo-600 rounded-2xl p-6 flex flex-col items-center backface-hidden rotate-y-180">
          
          <div className="w-full flex justify-between items-center mb-4">
             <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {isInverse ? "Pergunta" : "Resposta"}
            </span>
            <button 
              onClick={handleSpeak}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors flex items-center justify-center"
              title="Ouvir resposta (Codificação Dupla)"
            >
              {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          
          {/* HTML Rendered Content */}
          <div 
            className="text-lg text-white font-medium leading-relaxed overflow-y-auto flex-1 scrollbar-hide text-left w-full
              [&>b]:block [&>b]:text-xl [&>b]:mb-1 [&>b]:text-center
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-base [&_ul]:text-indigo-100
              [&_li_b]:text-white [&_li_b]:font-bold
            "
            dangerouslySetInnerHTML={{ __html: answer }}
          />
          
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;