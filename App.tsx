
import React, { useState, useCallback } from 'react';
import { ConstructionSite, AnalysisResult } from './types';
import { analyzeLogistics } from './services/geminiService';
import { SiteVisualizer } from './components/SiteVisualizer';
import { 
  MapPinIcon, 
  TableCellsIcon, 
  ArrowPathIcon, 
  HomeIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentAddress, setCurrentAddress] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processInput = () => {
    const lines = rawInput.trim().split('\n');
    const sites: ConstructionSite[] = lines.map(line => {
      const cols = line.split('\t'); 
      return {
        razaoSocial: cols[0] || '',
        nomeObra: cols[1] || '',
        endereco: cols[2] || '',
        setor: cols[3] || '',
        cidade: cols[4] || '',
        estado: cols[5] || '',
        cep: cols[6] || ''
      };
    }).filter(s => s.nomeObra);
    return sites;
  };

  const handleRunAnalysis = async () => {
    if (!currentAddress) {
      setError('Por favor, insira seu endereço de moradia atual.');
      return;
    }
    const sites = processInput();
    if (sites.length === 0) {
      setError('Por favor, cole os dados da planilha (copie as colunas A a G).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeLogistics(currentAddress, sites);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro na análise. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const EfficiencyBadge = ({ type }: { type: string }) => {
    const colors = {
      'Alta': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Média': 'bg-amber-100 text-amber-700 border-amber-200',
      'Baixa': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[type as keyof typeof colors] || 'bg-slate-100'}`}>
        {type.toUpperCase()} EFICIÊNCIA
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPinIcon className="h-8 w-8 text-indigo-600" />
            SP Route Optimizer
          </h1>
          <p className="mt-1 text-slate-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">Foco Mensal / Modal Trilhos</span>
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setResult(null)} 
             className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
           >
             Refazer Plano
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-indigo-500" />
                Sua Localização
              </h2>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Ex: Próximo à Estação Vila Mariana, SP"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TableCellsIcon className="h-5 w-5 text-indigo-500" />
                Dados da Planilha (Obras)
              </h2>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Razão Social	Nome Obra	Endereço	Setor	Cidade	UF	CEP"
                className="w-full h-64 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              />
            </section>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-white font-bold transition-all shadow-lg ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
              {loading ? 'Processando Agenda Mensal...' : 'Gerar Roteiro Mensal Estratégico'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-slate-100 rounded-3xl border border-slate-200 border-dashed">
             <div className="text-center space-y-3">
               <div className="bg-white p-4 rounded-full shadow inline-block">
                 <CalendarIcon className="h-8 w-8 text-indigo-500" />
               </div>
               <h3 className="text-lg font-bold text-slate-800">Distribuição Equilibrada</h3>
               <p className="text-slate-500 text-sm max-w-xs mx-auto italic">
                 "Não visite tudo na mesma semana. Otimizamos para que cada obra tenha sua visita mensal sem sobrecarga."
               </p>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Header Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnóstico Logístico</h2>
               <p className="text-slate-700 text-lg font-medium leading-snug">"{result.diagnosis}"</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
               <span className="text-xs font-bold text-slate-400 uppercase">Eficiência via Trilhos</span>
               <div className="mt-2"><EfficiencyBadge type={result.currentEvaluation.efficiency} /></div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white text-center">
               <span className="text-xs font-bold text-indigo-200 uppercase">Economia Mensal</span>
               <div className="text-2xl font-black mt-1">{result.housingRecommendation.comparison.monthlySavings}</div>
            </div>
          </section>

          {/* Housing & Centroid */}
          <section className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col lg:flex-row gap-10 items-center">
             <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <HomeIcon className="h-7 w-7 text-indigo-400" />
                  Hubs de Moradia Sugeridos
                </h3>
                <div className="flex flex-wrap gap-3">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold border border-white/10">{b}</span>
                   ))}
                </div>
                <p className="text-slate-400 text-sm italic">
                  Análise baseada no centroide de conectividade das Linhas {result.clusters.map(c => c.region).join(', ')}.
                </p>
             </div>
             <div className="w-full lg:w-72 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Tempo Médio/Dia</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Atual:</span> <span className="font-mono text-rose-400">{result.housingRecommendation.comparison.currentAvgTime}</span></div>
                  <div className="flex justify-between text-sm font-bold"><span>Otimizado:</span> <span className="font-mono text-emerald-400">{result.housingRecommendation.comparison.suggestedAvgTime}</span></div>
                </div>
             </div>
          </section>

          {/* Weekly Pattern Cards (Visual Reference Style) */}
          <section>
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <CalendarIcon className="h-7 w-7 text-indigo-500" />
                 Roteiro Semanal de Referência
               </h2>
               <span className="text-sm font-medium text-slate-400 italic">Padrão visual de deslocamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pb-4">
              {result.weeklyRoute.map((day, idx) => (
                <div key={idx} className="min-w-[240px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                  <div className="bg-[#1e293b] p-5 text-white">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">{day.day}</h4>
                    <span className="text-[10px] font-bold text-indigo-300 block leading-tight">{day.estimatedTravelTime}</span>
                    <span className="text-[9px] font-medium text-slate-400">transporte</span>
                  </div>
                  <div className="p-6 flex-1 space-y-6">
                    <div className="space-y-4">
                      {day.visits.length > 0 ? day.visits.map((v, vIdx) => (
                        <div key={vIdx} className="flex gap-3">
                          <span className="text-indigo-500 font-black text-xs mt-0.5">{vIdx + 1}.</span>
                          <span className="text-sm font-bold text-slate-700 leading-tight">{v}</span>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-xs text-slate-300 italic">Sem visitas</div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Tempo Total</span>
                        <span className="text-xs font-black text-slate-800">{day.totalTime}</span>
                      </div>
                      {/* Optional Note for longer routes */}
                      {(day.totalTime.includes('7') || day.totalTime.includes('INTEGRAL')) && (
                        <div className="mt-2 text-[9px] font-bold text-rose-500 leading-none">
                           OBS: TURNO INTEGRAL DEVIDO À DISTÂNCIA
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Full Monthly Schedule */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-800">Agenda Mensal Consolidada</h3>
                  <p className="text-sm text-slate-400 mt-1">1 visita mensal garantida por obra, distribuída por eixo ferroviário.</p>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase">22 Dias Úteis</div>
               </div>
             </div>

             <div className="space-y-12">
               {result.monthlyAgenda.map((week, wIdx) => (
                 <div key={wIdx} className="group">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="h-px bg-slate-100 flex-1"></span>
                       <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black tracking-widest uppercase">Semana {week.week}</span>
                       <span className="h-px bg-slate-100 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((dayName) => {
                        const sites = (week.schedule as any)[dayName] || [];
                        return (
                          <div key={dayName} className="p-5 bg-slate-50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100">
                            <span className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{dayName}</span>
                            <div className="space-y-2">
                              {sites.length > 0 ? (sites as string[]).map((site, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                                  <span className="text-xs font-bold text-slate-600 truncate" title={site}>{site}</span>
                                </div>
                              )) : (
                                <span className="text-[10px] text-slate-300 italic">Disponível</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               ))}
             </div>
          </section>

          <section className="bg-emerald-50 border-2 border-dashed border-emerald-200 p-10 rounded-[40px] text-center max-w-4xl mx-auto">
             <h3 className="text-2xl font-black text-emerald-800 mb-4">Conclusão Estratégica</h3>
             <p className="text-emerald-700 leading-relaxed font-medium">
               {result.timeSavingsSummary}
             </p>
          </section>
        </div>
      )}
      
      <footer className="mt-20 py-10 border-t border-slate-100 text-center">
         <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">SP Route Optimizer Agent • 2025 • Logística de Precisão</p>
      </footer>
    </div>
  );
};

export default App;
