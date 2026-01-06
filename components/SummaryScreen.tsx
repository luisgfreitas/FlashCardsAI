import React, { useEffect } from 'react';
import { StudySessionStats } from '../types';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SummaryScreenProps {
  stats: StudySessionStats;
  onRestart: () => void;
  onHome: () => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ stats, onRestart, onHome }) => {
  const totalCards = stats.easy + stats.good + stats.hard + stats.wrong;
  // Weighted accuracy
  const accuracy = totalCards > 0 ? Math.round(((stats.easy * 1 + stats.good * 0.8 + stats.hard * 0.5) / totalCards) * 100) : 0;

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto px-6 py-10 w-full text-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full mb-6 animate-bounce">
          <Trophy size={40} className="fill-current" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Sessão Concluída!</h2>
        <p className="text-slate-500 mb-8">Memória consolidada com sucesso.</p>

        <div className="grid grid-cols-4 gap-2 mb-8">
           <div className="bg-green-50 p-2 rounded-2xl border border-green-100 flex flex-col items-center">
            <span className="block text-xl font-bold text-green-600">{stats.easy}</span>
            <span className="text-[10px] uppercase text-green-700 font-bold">Fácil</span>
          </div>
           <div className="bg-blue-50 p-2 rounded-2xl border border-blue-100 flex flex-col items-center">
            <span className="block text-xl font-bold text-blue-600">{stats.good}</span>
            <span className="text-[10px] uppercase text-blue-700 font-bold">Bom</span>
          </div>
          <div className="bg-amber-50 p-2 rounded-2xl border border-amber-100 flex flex-col items-center">
            <span className="block text-xl font-bold text-amber-600">{stats.hard}</span>
            <span className="text-[10px] uppercase text-amber-700 font-bold">Difícil</span>
          </div>
          <div className="bg-red-50 p-2 rounded-2xl border border-red-100 flex flex-col items-center">
            <span className="block text-xl font-bold text-red-600">{stats.wrong}</span>
            <span className="text-[10px] uppercase text-red-700 font-bold">Errei</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600 font-medium">Precisão Geral</span>
            <span className="text-slate-900 font-bold text-lg">{accuracy}%</span>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${accuracy > 70 ? 'bg-green-500' : accuracy > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Continuar Estudando
          </button>
          
          <button
            onClick={onHome}
            className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;