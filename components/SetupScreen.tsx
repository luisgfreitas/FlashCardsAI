import React, { useState, useEffect } from 'react';
import { DifficultyLevel, StudyMode, TopicStat } from '../types';
import { Brain, Sparkles, BookOpen, Layers, Dna, CalendarClock, History, Shuffle, Repeat, Library, Plus, Network, Crown, Zap, Info, ChevronRight, Target } from 'lucide-react';
import { getDueCards, getAllTopicStats, getTopTopics, getUserLevelInfo, UserLevelInfo } from '../services/srsService';

interface SetupScreenProps {
  onGenerate: (topic: string, level: DifficultyLevel, count: number, mode: StudyMode, isBidirectional: boolean) => void;
  onNeuroShuffle: () => void;
  onOpenNeuralMap: () => void;
  isLoading: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onGenerate, onNeuroShuffle, onOpenNeuralMap, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'library' | 'instructions'>('study');
  
  // Study Tab State
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<DifficultyLevel>(DifficultyLevel.HighSchool);
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [isBidirectional, setIsBidirectional] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [topTopics, setTopTopics] = useState<string[]>([]);
  
  // Library Tab State
  const [allStats, setAllStats] = useState<Record<string, TopicStat>>({});
  
  // Gamification State
  const [userLevel, setUserLevel] = useState<UserLevelInfo | null>(null);

  useEffect(() => {
    setDueCount(getDueCards().length);
    setTopTopics(getTopTopics(5));
    setAllStats(getAllTopicStats());
    setUserLevel(getUserLevelInfo());
  }, []);

  const handleTopicSelect = (selectedTopic: string) => {
      setTopic(selectedTopic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic, level, count, mode, isBidirectional);
    }
  };

  const getPct = (val: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 w-full py-8">
      {/* BRANDING HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">FlashAI</h1>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Neuro-Study Engine</p>
          </div>
        </div>
        
        {/* Quick Stats Badge */}
        {userLevel && (
           <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Seu Score</p>
                <p className="text-sm font-black text-slate-800 leading-none">{userLevel.score}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-inner">
                <Crown size={16} fill="white" />
              </div>
           </div>
        )}
      </div>

      {/* GAMIFICATION DASHBOARD CARD */}
      {userLevel && activeTab === 'study' && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-7 text-white shadow-2xl mb-8 relative overflow-hidden border border-white/10 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-3 backdrop-blur-md border border-white/5">
                       <Zap size={10} className="fill-indigo-300" /> {userLevel.levelTitle}
                    </span>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                       Nível Cerebral
                    </h2>
                 </div>
                 <div className="text-right">
                    <span className="text-xs text-indigo-300 font-semibold block mb-1">Próximo Marco</span>
                    <span className="text-sm font-bold text-white/90">{userLevel.nextLevelTitle}</span>
                 </div>
              </div>

              {/* Progress System */}
              <div className="space-y-3">
                 <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-md border border-white/10 p-1">
                    <div 
                       className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-violet-400 rounded-full transition-all duration-1000 relative"
                       style={{ width: `${userLevel.progressPercent}%` }}
                    >
                       <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">
                    <span>{userLevel.score} XP</span>
                    <span>{Math.round(userLevel.nextLevelScore - userLevel.score)} XP para evoluir</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MAIN NAVIGATION */}
      <div className="flex bg-slate-200/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white shadow-inner mb-8 max-w-md mx-auto">
        {[
          { id: 'study', icon: Plus, label: 'Novo Estudo' },
          { id: 'library', icon: Library, label: 'Biblioteca' },
          { id: 'instructions', icon: Info, label: 'Guia' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-lg scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'study' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
                
                {/* MODE TOGGLE */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200/50">
                    <button 
                        onClick={() => setMode('flashcard')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'flashcard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Layers size={14}/> Cards
                    </button>
                    <button 
                        onClick={() => setMode('cloze')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'cloze' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Dna size={14}/> Lacunas
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* TOPIC INPUT */}
                    <div className="relative group">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            Tema do Conhecimento
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <BookOpen size={20} />
                            </div>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="O que vamos dominar hoje?"
                                className="w-full pl-12 pr-4 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-semibold"
                                required
                            />
                        </div>
                        
                        {topTopics.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {topTopics.map((t, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleTopicSelect(t)}
                                        className="bg-white hover:bg-indigo-600 hover:text-white text-slate-500 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CONFIG GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Complexidade
                            </label>
                            <div className="relative">
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                                    className="w-full appearance-none pl-4 pr-10 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-800 font-bold text-sm"
                                >
                                    {Object.values(DifficultyLevel).map((lvl) => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight size={18} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Intensidade
                                </label>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{count} Cards</span>
                            </div>
                            <div className="px-2 pt-2">
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="50" 
                                    step="5"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Focado</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Imersão</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* INVERSE MODE TOGGLE */}
                    <button
                        type="button"
                        onClick={() => setIsBidirectional(!isBidirectional)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${isBidirectional ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className={`p-2 rounded-xl transition-colors ${isBidirectional ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                <Repeat size={18} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isBidirectional ? 'text-indigo-900' : 'text-slate-700'}`}>Codificação Inversa</p>
                                <p className="text-[10px] text-slate-500 font-medium">Ver resposta e deduzir a pergunta</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isBidirectional ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-200'}`}>
                            {isBidirectional && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                        </div>
                    </button>

                    {/* GENERATE BUTTON */}
                    <button
                        type="submit"
                        disabled={isLoading || !topic.trim()}
                        className={`group relative w-full py-5 rounded-[1.5rem] font-black text-lg tracking-wider uppercase shadow-xl transition-all transform active:scale-95 overflow-hidden
                        ${mode === 'cloze' 
                            ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200/50' 
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300/50'}
                        disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="relative flex items-center justify-center gap-3 text-white">
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span className="animate-pulse">Sintonizando IA...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                                    <span>Materializar Estudo</span>
                                </>
                            )}
                        </div>
                    </button>
                </form>
            </div>

            {/* NEURO-SHUFFLE AREA */}
            {dueCount > 0 && (
                <div className="bg-white/40 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 shadow-lg animate-in slide-in-from-bottom-6 duration-700 delay-200">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                <Target size={16} />
                            </div>
                            <div>
                                <span className="text-sm font-black text-slate-800 tracking-tight">Interleaving</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revisão Espaçada</p>
                            </div>
                        </div>
                        <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md shadow-rose-200 animate-pulse">
                            {dueCount} Pendentes
                        </span>
                    </div>
                    <button
                        onClick={onNeuroShuffle}
                        className="w-full bg-white hover:bg-slate-900 hover:text-white text-slate-900 py-4 rounded-[1.2rem] font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-md border border-slate-100 group"
                    >
                        <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        Misturar Temas (Neuro-Shuffle)
                    </button>
                </div>
            )}
        </div>
      )}

      {activeTab === 'library' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[500px] animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Biblioteca Neural</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Mapeamento de Retenção</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-xs font-black text-indigo-600 shadow-sm">
                    {Object.keys(allStats).length} Temas
                </div>
            </div>
            
            {Object.keys(allStats).length > 0 && (
              <div className="px-8 pt-6 pb-2">
                 <button 
                  onClick={onOpenNeuralMap}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:-translate-y-1"
                 >
                   <Network size={20} className="text-indigo-400" />
                   Mapa de Conexões (Visualizar Cérebro)
                 </button>
              </div>
            )}
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {Object.keys(allStats).length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border-2 border-dashed border-slate-200">
                             <History size={40} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Nenhum dado de memória ainda</p>
                        <button onClick={() => setActiveTab('study')} className="text-indigo-600 font-black text-sm mt-4 hover:underline">Iniciar primeiro estudo</button>
                    </div>
                ) : (
                    (Object.entries(allStats) as [string, TopicStat][])
                    .sort(([, a], [, b]) => b.lastAccessed - a.lastAccessed)
                    .map(([key, stat]) => (
                        <div key={key} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-black text-slate-800 capitalize text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{key}</h3>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-300 uppercase block tracking-tighter leading-none mb-1">Engajamento</span>
                                    <span className="text-xs font-black text-slate-500">{stat.totalAnswered} rps</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: 'Fácil', val: stat.easy, color: 'text-emerald-600', bg: 'bg-emerald-500' },
                                        { label: 'Bom', val: stat.good || 0, color: 'text-indigo-600', bg: 'bg-indigo-500' },
                                        { label: 'Difícil', val: stat.hard, color: 'text-amber-600', bg: 'bg-amber-500' },
                                        { label: 'Erro', val: stat.wrong, color: 'text-rose-600', bg: 'bg-rose-500' }
                                    ].map((s, idx) => (
                                        <div key={idx} className="text-center">
                                            <span className={`block text-xs font-black ${s.color}`}>{getPct(s.val, stat.totalAnswered)}%</span>
                                            <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">{s.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex h-2.5 rounded-full overflow-hidden w-full bg-slate-100 p-0.5 border border-slate-50 shadow-inner">
                                    <div className="bg-emerald-500 rounded-full" style={{ width: `${getPct(stat.easy, stat.totalAnswered)}%` }} />
                                    <div className="bg-indigo-500 rounded-full" style={{ width: `${getPct(stat.good, stat.totalAnswered)}%` }} />
                                    <div className="bg-amber-500 rounded-full" style={{ width: `${getPct(stat.hard, stat.totalAnswered)}%` }} />
                                    <div className="bg-rose-500 rounded-full" style={{ width: `${getPct(stat.wrong, stat.totalAnswered)}%` }} />
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-4 border-t border-slate-50 flex justify-end">
                                <button 
                                    onClick={() => {
                                        setTopic(key);
                                        setActiveTab('study');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-2 group/btn"
                                >
                                    Focar neste tema <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}

      {activeTab === 'instructions' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Info size={24} />
                </div>
                Manual do Mestre
            </h2>

            <div className="space-y-10">
                <section className="relative">
                    <div className="absolute -left-5 top-0 w-1 h-full bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-1/3 w-full bg-indigo-600"></div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">A Ciência do FlashAI</h3>
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-lg">1</div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">Active Recall</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">Forçar a lembrança da resposta antes de ver o verso cria caminhos neurais permanentes. Não olhe a resposta cedo demais!</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-lg">2</div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">Spaced Repetition</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">O algoritmo SM-2 calcula o momento exato antes de você esquecer para reapresentar o card, maximizando a eficiência.</p>
                            </div>
                        </li>
                    </ul>
                </section>

                <section className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-indigo-200">
                        <Zap size={40} className="fill-current" />
                    </div>
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                         Multiplicador de XP
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-white">
                            <span className="text-xs font-bold text-slate-600 uppercase">Aprendiz</span>
                            <span className="font-black text-indigo-600">+10 XP</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-white">
                            <span className="text-xs font-bold text-slate-600 uppercase">Retenção</span>
                            <span className="font-black text-emerald-600">+50 XP</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-indigo-200 shadow-sm">
                            <span className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1">
                                <Crown size={12} className="text-yellow-500 fill-current" /> Mestre
                            </span>
                            <span className="font-black text-indigo-600">+150 XP</span>
                        </div>
                    </div>
                </section>
                
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                        <Shuffle size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-white text-sm">O Poder do Desembaralho</h4>
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">Neuro-Shuffle</p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">Estudar temas misturados (Interleaving) obriga seu cérebro a trocar de contexto constantemente, o que é a forma mais eficaz de aprendizado profundo.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;