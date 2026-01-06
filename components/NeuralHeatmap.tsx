import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { Flashcard } from '../types';
import { ArrowLeft, Eye, RotateCw, Network as NetworkIcon } from 'lucide-react';

interface NeuralHeatmapProps {
  cards: Flashcard[];
  onBack: () => void;
}

// 1. LISTA DE EXCLUSÃO (STOP WORDS) ROBUSTA
const STOP_WORDS = new Set([
    // 1. Artigos e Preposições
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 
    'em', 'no', 'na', 'nos', 'nas', 
    'por', 'pelo', 'pela', 'pelos', 'pelas',
    'para', 'pra', 'pro',
    'com', 'sem', 'sob', 'sobre', 'ante', 'até',
    'entre', 'perante',

    // 2. Pronomes e Conectivos
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
    'me', 'te', 'se', 'lhe', 'nos', 'vos',
    'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
    'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela', 'aquilo',
    'que', 'qual', 'quais', 'quem', 'cujo', 'onde',
    'e', 'ou', 'mas', 'nem', 'também', 
    'como', 'pois', 'porque', 'porquê', 'portanto',

    // 3. Verbos de Ligação e Auxiliares (Comuns em perguntas)
    'é', 'são', 'era', 'eram', 'foi', 'foram', 'sendo',
    'ser', 'estar', 'está', 'estão', 'estava', 
    'tem', 'têm', 'tinha', 'ter', 
    'haver', 'há', 'houve',
    'fazer', 'faz', 'feito',
    'dizer', 'diz', 'chamado', 'chamada',

    // 4. Termos de Formulação de Pergunta (O "Lixo" dos Flashcards)
    'quando', 'quanto', 'quantos', 'quantas',
    'qualquer', 'algum', 'alguma', 'alguns', 'vários', 'muitos',
    'apenas', 'somente', 'todos', 'todas', 'cada',
    'pode', 'podem', 'deve', 'devem',

    // 5. Muletas Acadêmicas / Palavras Genéricas (Ajuste fino)
    'exemplo', 'exemplos', 
    'tipo', 'tipos', 
    'forma', 'formas', 
    'parte', 'partes',
    'característica', 'características',
    'principal', 'principais',
    'função', 'funções',
    'conceito', 'definição', 'definir',
    'significa', 'significado',
    'processo', 'processos',
    'sistema', 'sistemas',
    'diferença', 'semelhança', 'relação',
    'estrutura', 'estruturas',
    'mecanismo', 'mecanismos',
    
    // 6. Palavras Polissêmicas
    'composição', 'elemento', 'elementos', 'fator', 'fatores',
    'base', 'topo', 'lado', 'meio', 'fim', 'início',
    'valor', 'valores', 'dado', 'dados', 'ponto', 'pontos'
]);

const NeuralHeatmap: React.FC<NeuralHeatmapProps> = ({ cards, onBack }) => {
  const networkRef = useRef<HTMLDivElement>(null);
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());

  // 2. EXTRAÇÃO DE PALAVRAS COM LIMITES (WORD BOUNDARIES)
  const getKeywords = (text: string) => {
    // a. Normalização (Remove acentos): "Física" -> "Fisica"
    const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // b. Limpeza e Lowercase: Remove tudo que não for letra/número e substitui por espaço
    // Isso garante que "sol," vire "sol " e não "sol" (colado)
    const cleanText = normalized.toLowerCase().replace(/[^\w\s]/g, ' ');

    // c. Split por espaço em branco (Garante Tokenização de Palavra Inteira)
    // Ex: "O sol brilha" -> ["o", "sol", "brilha"]
    // Isso impede que "sol" dê match em "console" (que seria o token ["console"])
    return cleanText.split(/\s+/)
      .filter(w => 
        w.length > 2 && // Ignora palavras muito curtas (ex: 'oi')
        !STOP_WORDS.has(w) && // Aplica a Stoplist
        !/^\d+$/.test(w) // Ignora números puros
      );
  };

  useEffect(() => {
    if (!networkRef.current || cards.length === 0) return;

    // --- 1. PROCESS DATA FOR VIS.JS ---
    
    const topics = Array.from(new Set(cards.map(c => c.topic)));
    
    const nodes: any[] = [];
    const edges: any[] = [];
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    // A. Create Topic Nodes (Hubs)
    topics.forEach((topic) => {
      nodes.push({
        id: `topic_${topic}`,
        label: topic,
        title: `Categoria: ${topic}`,
        color: { background: '#1e293b', border: '#0f172a' }, // Dark Slate-800
        shape: 'box',
        margin: 10,
        font: { color: 'white', size: 16, face: 'Inter', multi: true, bold: true },
        shadow: true,
        mass: 4,
        borderWidth: 0
      });
    });

    const cardKeywordsMap: Record<string, string[]> = {};

    // B. Create Flashcard Nodes
    cards.forEach((card) => {
      // --- HEATMAP COLOR LOGIC ---
      let color = '#e2e8f0'; 
      let borderColor = '#94a3b8';
      
      if (card.nextReview) {
        if (card.nextReview <= now) {
          color = '#ef4444'; // RED
          borderColor = '#991b1b';
        } else if (card.nextReview <= now + threeDays) {
          color = '#f59e0b'; // YELLOW
          borderColor = '#92400e';
        } else {
          color = '#10b981'; // GREEN
          borderColor = '#065f46';
        }
      }

      cardKeywordsMap[card.id] = getKeywords(card.question);

      nodes.push({
        id: card.id,
        label: undefined,
        title: null,
        color: { background: color, border: borderColor },
        shape: 'dot',
        size: 10,
        borderWidth: 2,
        shadow: false
      });

      // Connect Card to its Topic (Hub Lines - Darkened)
      edges.push({
        from: `topic_${card.topic}`,
        to: card.id,
        color: { color: '#334155', opacity: 0.6 }, // Dark Slate-700, visible
        width: 1.5,
        length: 60 
      });
    });

    // C. Conexões Cruzadas
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const cardA = cards[i];
        const cardB = cards[j];
        
        const keywordsA = cardKeywordsMap[cardA.id];
        const keywordsB = cardKeywordsMap[cardB.id];

        // Comparação por Tokens Inteiros
        const intersection = keywordsA.filter(k => keywordsB.includes(k));

        if (intersection.length > 0) {
          edges.push({
            from: cardA.id,
            to: cardB.id,
            color: { color: '#475569', opacity: 0.4 }, // Dark Slate-600
            width: 1,
            dashes: true, 
            smooth: { enabled: true, type: 'continuous', forceDirection: 'none', roundness: 0.5 },
            physics: false
          });
        }
      }
    }

    // --- 2. INITIALIZE NETWORK ---
    const data = { nodes, edges };
    const options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 4,
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          forceDirection: 'none',
          roundness: 0.5
        }
      },
      physics: {
        stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 25
        },
        barnesHut: {
          gravitationalConstant: -2000, 
          springConstant: 0.04,
          springLength: 50, 
          centralGravity: 0.3,
          damping: 0.09
        },
        maxVelocity: 50,
        minVelocity: 0.1,
        solver: 'barnesHut'
      },
      interaction: {
        hover: false,
        tooltipDelay: 300,
        hideEdgesOnDrag: true,
        dragNodes: true,
        zoomView: true,
        dragView: true,
        multiselect: false,
        selectable: true,
        selectConnectedEdges: false,
        navigationButtons: false
      }
    };

    const network = new Network(networkRef.current, data, options);

    // --- 3. EVENTO DE CLIQUE ---
    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const foundCard = cards.find(c => c.id === nodeId);
        
        if (foundCard) {
          const currentKeywords = getKeywords(foundCard.question);
          
          const shared = new Set<string>();
          cards.forEach(other => {
            if (other.id === foundCard.id) return;
            const otherKw = getKeywords(other.question);
            currentKeywords.forEach(word => {
               if (otherKw.includes(word)) shared.add(word);
            });
          });

          setHighlightedWords(shared);
          setSelectedCard(foundCard);
          setShowAnswer(false);
        }
      } else {
        setSelectedCard(null);
      }
    });

    return () => {
      network.destroy();
    };

  }, [cards]);

  // Função para renderizar texto com destaques
  const renderHighlightedText = (text: string) => {
     if (highlightedWords.size === 0) return text;

     const parts = text.split(/([a-zA-ZÀ-ÿ0-9]+)/g);
     
     return parts.map((part, index) => {
        const normalizedPart = part.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (highlightedWords.has(normalizedPart)) {
           return (
             <span key={index} className="bg-indigo-100 text-indigo-700 font-bold px-1 rounded-md mx-0.5 border border-indigo-200">
               {part}
             </span>
           );
        }
        return part;
     });
  };

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={onBack}
          className="bg-white p-3 rounded-full shadow-lg text-slate-700 hover:text-slate-900 transition-colors border border-slate-100"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-slate-100 text-[10px] font-medium text-slate-500 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-500 block shadow-sm"></span> Crítico
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-500 block shadow-sm"></span> Atenção
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 block shadow-sm"></span> Seguro
            </div>
         </div>
      </div>

      <div id="network-container" ref={networkRef} className="w-full h-full bg-slate-50 touch-none" />

      {/* Bottom Sheet */}
      <div 
        id="card-details"
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
            selectedCard ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
      >
         <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] border-t border-slate-100 max-h-[75vh] flex flex-col">
            
            {/* Handle Bar - Removed onClick (close by clicking outside only) */}
            <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {selectedCard && (
                <div className="px-6 pb-8 pt-2 overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {selectedCard.topic}
                        </span>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 leading-snug mb-2">
                            {renderHighlightedText(selectedCard.question)}
                        </h3>
                        
                        {highlightedWords.size > 0 && (
                          <p className="text-xs text-indigo-600 font-medium flex items-center gap-1.5 mt-2 bg-indigo-50 p-2 rounded-lg inline-flex">
                             <NetworkIcon size={12} />
                             Palavras conectadas em destaque
                          </p>
                        )}
                        
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${showAnswer ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                             {/* Render Answer with HTML support */}
                             <div 
                                className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-lg leading-relaxed font-medium [&>b]:block [&>b]:text-xl [&>b]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-base"
                                dangerouslySetInnerHTML={{ __html: selectedCard.answer }}
                             />
                             {selectedCard.clozeText && !showAnswer && (
                                 <p className="text-sm text-slate-500 mt-2 italic">Dica: É um exercício de completar.</p>
                             )}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAnswer(!showAnswer)}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                        ${showAnswer ? 'bg-slate-800 hover:bg-slate-900' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                        {showAnswer ? (
                            <>
                                <RotateCw size={18} />
                                Ocultar Resposta
                            </>
                        ) : (
                            <>
                                <Eye size={18} />
                                Ver Resposta
                            </>
                        )}
                    </button>
                </div>
            )}
         </div>
      </div>
      
      {/* Backdrop for closing */}
      {selectedCard && (
        <div 
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px] transition-opacity duration-300 cursor-pointer"
            onClick={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

export default NeuralHeatmap;