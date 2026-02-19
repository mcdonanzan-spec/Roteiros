
import React, { useState } from 'react';
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
  DocumentArrowDownIcon,
  MapIcon
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

  const handleDownloadPDF = () => {
    try {
      const originalTitle = document.title;
      const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
      document.title = `Roteiro_SP_${dateStr}`;
      
      // Chamada direta para evitar bloqueio de popup/scripts do navegador
      window.print();
      
      // Restaura o título após a abertura da caixa de diálogo
      document.title = originalTitle;
    } catch (err) {
      console.error("Falha ao imprimir:", err);
      alert("Para salvar como PDF, use a função de impressão do seu navegador (Ctrl+P).");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPinIcon className="h-8 w-8 text-indigo-600 print:text-indigo-700" />
            SP Route Optimizer
          </h1>
          <p className="mt-1 text-slate-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase print:bg-slate-100 print:text-slate-700">
              Logística e Moradia • Modal Trilhos
            </span>
          </p>
        </div>
        <div className="flex gap-2 print:hidden items-center">
           {result && (
             <button 
               onClick={handleDownloadPDF}
               type="button"
               className="relative z-10 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 cursor-pointer"
             >
               <DocumentArrowDownIcon className="h-5 w-5" />
               Salvar PDF
             </button>
           )}
           <button 
             onClick={() => setResult(null)} 
             type="button"
             className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-colors cursor-pointer"
           >
             {result ? 'Novo Roteiro' : 'Limpar'}
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-indigo-500" />
                Sua Localização Atual
              </h2>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Ex: Próximo à Estação Vila Mariana, SP"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                placeholder="Cole aqui as colunas A a G da planilha..."
                className="w-full h-64 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs leading-relaxed"
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
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
              {loading ? 'Analisando logística de SP...' : 'Gerar Planejamento Estratégico'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-slate-100 rounded-3xl border border-slate-200 border-dashed">
             <div className="text-center space-y-4">
               <div className="bg-white p-5 rounded-3xl shadow-sm inline-block">
                 <MapIcon className="h-10 w-10 text-indigo-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Logística sobre Trilhos</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto">
                 "Nosso agente prioriza o uso de Metrô e CPTM para garantir que suas visitas mensais sejam rápidas e previsíveis."
               </p>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 print:space-y-8">
          {/* Header Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 print:border-slate-300 print:shadow-none">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-slate-600">Diagnóstico Estratégico</h2>
               <p className="text-slate-700 text-lg font-medium leading-snug">"{result.diagnosis}"</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center print:border-slate-300 print:shadow-none">
               <span className="text-xs font-bold text-slate-400 uppercase print:text-slate-600">Eficiência Geral</span>
               <div className="mt-2"><EfficiencyBadge type={result.currentEvaluation.efficiency} /></div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white text-center print:bg-slate-50 print:text-slate-900 print:shadow-none print:border print:border-slate-300">
               <span className="text-xs font-bold text-indigo-200 uppercase print:text-slate-600">Economia no Mês</span>
               <div className="text-2xl font-black mt-1 print:text-indigo-700">{result.housingRecommendation.comparison.monthlySavings}</div>
            </div>
          </section>

          {/* Site Visualizer */}
          <section className="print:break-inside-avoid">
             <div className="mb-6 flex items-center gap-3">
                <MapIcon className="h-6 w-6 text-indigo-500" />
                <h3 className="text-xl font-black text-slate-800">Distribuição por Eixos de Transporte</h3>
             </div>
             <SiteVisualizer clusters={result.clusters} />
          </section>

          {/* Weekly Pattern Cards */}
          <section className="print:break-inside-avoid">
            <div className="flex items-center justify-between mb-8 print:mb-4">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <ClockIcon className="h-7 w-7 text-indigo-500 print:hidden" />
                 Logística Diária (Modelo de Rota)
               </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 print:grid-cols-5 print:gap-2">
              {result.weeklyRoute.map((day, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full print:rounded-xl print:shadow-none print:border-slate-300">
                  <div className="bg-[#1e293b] p-5 text-white print:bg-slate-100 print:text-slate-900 print:p-3 print:border-b print:border-slate-300">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 print:text-[10px]">{day.day}</h4>
                    <span className="text-[10px] font-bold text-indigo-300 block leading-tight print:text-indigo-600">{day.estimatedTravelTime}</span>
                  </div>
                  <div className="p-6 flex-1 space-y-4 print:p-3 print:space-y-2">
                    {day.visits.length > 0 ? day.visits.map((v, vIdx) => (
                      <div key={vIdx} className="flex gap-2">
                        <span className="text-indigo-500 font-black text-xs mt-0.5 print:text-slate-400">{vIdx + 1}.</span>
                        <span className="text-sm font-bold text-slate-700 leading-tight print:text-[10px]">{v}</span>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-xs text-slate-300 italic">Livre</div>
                    )}
                    <div className="pt-4 border-t border-slate-100 mt-auto print:pt-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Tempo</span>
                        <span className="text-slate-800">{day.totalTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly Agenda */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm print:p-8 print:rounded-3xl print:shadow-none print:border-slate-300 print:break-before-page">
             <div className="mb-10 print:mb-6">
                <h3 className="text-2xl font-black text-slate-800 print:text-xl underline decoration-indigo-200 underline-offset-8">Agenda Mensal Consolidada</h3>
                <p className="text-sm text-slate-400 mt-4 print:text-slate-600 italic">Todas as obras da sua planilha distribuídas estrategicamente para visita única no mês.</p>
             </div>

             <div className="space-y-12 print:space-y-8">
               {result.monthlyAgenda.map((week, wIdx) => (
                 <div key={wIdx} className="group">
                    <div className="flex items-center gap-4 mb-6 print:mb-4">
                       <span className="h-px bg-slate-100 flex-1 print:bg-slate-300"></span>
                       <span className="px-4 py-1.5 bg-slate-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase print:bg-slate-200 print:text-slate-800">Semana {week.week}</span>
                       <span className="h-px bg-slate-100 flex-1 print:bg-slate-300"></span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((dayName) => {
                        const sites = (week.schedule as any)[dayName] || [];
                        return (
                          <div key={dayName} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all print:p-3 print:rounded-xl print:border-slate-200 print:bg-white">
                            <span className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest print:mb-1 print:text-slate-500">{dayName}</span>
                            <div className="space-y-2">
                              {sites.length > 0 ? (sites as string[]).map((site, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 print:bg-slate-400"></div>
                                  <span className="text-xs font-bold text-slate-700 leading-tight print:text-[10px]" title={site}>{site}</span>
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

          {/* Housing Recommendations */}
          <section className="bg-indigo-900 rounded-[40px] p-10 text-white flex flex-col lg:flex-row gap-10 items-center print:bg-slate-100 print:text-slate-900 print:p-10 print:rounded-3xl print:border print:border-slate-300 print:break-inside-avoid">
             <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-black print:text-2xl">Estratégia de Moradia</h3>
                <div className="flex flex-wrap gap-3">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-5 py-3 bg-white/10 rounded-2xl font-bold border border-white/10 print:bg-white print:border-slate-300 print:text-slate-800">{b}</span>
                   ))}
                </div>
                <p className="text-indigo-200 text-sm leading-relaxed max-w-xl print:text-slate-600">
                  {result.housingRecommendation.centroidDescription}
                </p>
             </div>
             <div className="w-full lg:w-80 bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur print:bg-white print:border-slate-300">
                <div className="space-y-6">
                  <div>
                    <span className="block text-[10px] font-black text-indigo-300 uppercase mb-1 print:text-slate-500">Média Otimizada</span>
                    <span className="text-4xl font-black text-emerald-400 print:text-emerald-700">{result.housingRecommendation.comparison.suggestedAvgTime}</span>
                  </div>
                  <div className="pt-6 border-t border-white/10 text-xs text-indigo-200 italic print:text-slate-500 print:border-slate-200">
                    Otimização de {result.housingRecommendation.comparison.monthlySavings} mensais.
                  </div>
                </div>
             </div>
          </section>

          <section className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[40px] text-center max-w-4xl mx-auto print:p-8 print:rounded-2xl print:max-w-none print:border-slate-300 print:bg-white print:break-inside-avoid">
             <h3 className="text-xl font-black text-emerald-800 mb-4 uppercase tracking-wider print:text-slate-900">Considerações Finais</h3>
             <p className="text-emerald-700 font-medium leading-relaxed print:text-slate-600 print:text-sm">
               {result.timeSavingsSummary}
             </p>
          </section>
        </div>
      )}
      
      <footer className="mt-20 py-10 border-t border-slate-100 text-center print:mt-10 print:py-6">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest print:text-slate-400 italic">SP Route Optimizer • Logística sobre Trilhos • 2025</p>
      </footer>
    </div>
  );
};

export default App;
