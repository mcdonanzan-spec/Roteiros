
import React, { useState, useRef } from 'react';
import { ConstructionSite, AnalysisResult, VisitDetail } from './types';
import { analyzeLogistics } from './services/geminiService';
import { SiteVisualizer } from './components/SiteVisualizer';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  MapPinIcon, 
  TableCellsIcon, 
  ArrowPathIcon, 
  HomeIcon, 
  ClockIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  MapIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

// Fix: Moved VisitCard outside of App and typed it with React.FC to resolve the 'key' prop type error.
// This ensures TypeScript recognizes it as a React component that accepts standard props like 'key'.
const VisitCard: React.FC<{ visit: VisitDetail }> = ({ visit }) => {
  const getMetroStyle = (line: string = '') => {
    const l = line.toLowerCase();
    if (l.includes('azul') || l.includes('l1')) return 'bg-blue-600 text-white';
    if (l.includes('verde') || l.includes('l2')) return 'bg-emerald-600 text-white';
    if (l.includes('vermelha') || l.includes('l3')) return 'bg-red-600 text-white';
    if (l.includes('amarela') || l.includes('l4')) return 'bg-yellow-400 text-slate-900';
    if (l.includes('lilás') || l.includes('l5')) return 'bg-purple-600 text-white';
    if (l.includes('rubi') || l.includes('l7')) return 'bg-rose-700 text-white';
    if (l.includes('diamante') || l.includes('l8')) return 'bg-slate-500 text-white';
    if (l.includes('esmeralda') || l.includes('l9')) return 'bg-emerald-400 text-slate-900';
    if (l.includes('turquesa') || l.includes('l10')) return 'bg-blue-300 text-slate-900';
    if (l.includes('coral') || l.includes('l11')) return 'bg-orange-600 text-white';
    if (l.includes('safira') || l.includes('l12')) return 'bg-blue-900 text-white';
    if (l.includes('prata') || l.includes('l15')) return 'bg-slate-300 text-slate-700';
    return 'bg-slate-200 text-slate-600';
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase truncate">
          {visit.siteName}
        </span>
        {visit.isFullTurn && (
          <span className="shrink-0 px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded uppercase">Integral</span>
        )}
      </div>
      
      {visit.metroLine && (
        <div className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block mb-2 ${getMetroStyle(visit.metroLine)}`}>
          {visit.metroLine}
        </div>
      )}

      <div className="space-y-1.5 border-t border-slate-50 pt-2">
        {visit.walkingMinutes !== undefined && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <ClockIcon className="h-3 w-3" />
            <span className="text-[10px] font-medium">Caminhada: <strong>{visit.walkingMinutes} min</strong></span>
          </div>
        )}
        {visit.busInfo && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <TruckIcon className="h-3 w-3 text-indigo-400" />
            <span className="text-[9px] font-medium italic truncate">{visit.busInfo}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentAddress, setCurrentAddress] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

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
      console.error("Erro na análise:", err);
      setError('Ocorreu um erro na análise de logística. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const element = reportRef.current;
      const originalWidth = element.style.width;
      element.style.width = '1200px';
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: 1200,
        height: element.scrollHeight
      });
      element.style.width = originalWidth;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`Plano_Logistico_SP_Expert.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg">
            <MapPinIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">SP Route Optimizer</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Expert Logistics Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
           {result && (
             <button 
               onClick={handleDownloadPDF}
               disabled={exporting}
               className="px-6 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-xl"
             >
               {exporting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <DocumentArrowDownIcon className="h-5 w-5" />}
               PDF Roteirizado
             </button>
           )}
           <button onClick={() => setResult(null)} className="px-5 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
             {result ? 'Novo Cálculo' : 'Limpar'}
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <HomeIcon className="h-4 w-4 text-indigo-500" />
                Base de Operação (Moradia)
              </h2>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Ex: Próximo à Estação Ana Rosa, SP"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TableCellsIcon className="h-4 w-4 text-indigo-500" />
                Dados Brutos da Planilha
              </h2>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Copie as colunas A-G e cole aqui..."
                className="w-full h-64 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50"
              />
            </section>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-lg transition-all shadow-xl ${
                loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-[0.98]'
              }`}
            >
              {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
              {loading ? 'Roteirizando SP...' : 'Otimizar Fluxo Mensal'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
             <div className="text-center space-y-6 relative z-10">
               <div className="bg-indigo-50 p-6 rounded-full inline-block">
                 <MapIcon className="h-12 w-12 text-indigo-600" />
               </div>
               <h3 className="text-2xl font-black text-slate-800">Inteligência de Transportes</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                 O sistema identifica automaticamente a estação mais próxima de cada obra e sugere a melhor linha de metrô para reduzir o cansaço e o tempo de trânsito.
               </p>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div id="report-content" ref={reportRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-50 p-8 rounded-[40px] shadow-sm">
          {/* Dashboard Summary */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
               <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Diagnóstico Estratégico do Agente</h2>
               <p className="text-slate-800 text-xl font-bold leading-tight">"{result.diagnosis}"</p>
            </div>
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-100 text-white flex flex-col justify-center">
               <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Impacto Logístico Mensal</span>
               <div className="text-4xl font-black">{result.housingRecommendation.comparison.monthlySavings}</div>
            </div>
          </section>

          {/* Map Section */}
          <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapIcon className="h-6 w-6 text-indigo-500" />
                  <h3 className="text-xl font-black text-slate-800">Visualização de Clusters de Obra</h3>
                </div>
                <div className="flex gap-2">
                   {['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'].map(r => (
                     <span key={r} className="text-[9px] font-bold px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-slate-400 uppercase">{r}</span>
                   ))}
                </div>
             </div>
             <SiteVisualizer clusters={result.clusters} />
          </section>

          {/* Expert Monthly Agenda */}
          <section className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Agenda Mensal Roteirizada</h3>
                  <p className="text-slate-500 mt-2 font-medium">As visitas estão agrupadas para reduzir o número de integrações e maximizar o "Last Mile".</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col items-center border-r border-slate-200 pr-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Caminhada</span>
                     <span className="text-xs font-bold text-slate-700">Otimizada</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Metro</span>
                     <span className="text-xs font-bold text-slate-700">Hub Prioritário</span>
                   </div>
                </div>
             </div>

             <div className="space-y-16">
               {result.monthlyAgenda.map((week, wIdx) => (
                 <div key={wIdx}>
                    <div className="flex items-center gap-6 mb-8">
                       <span className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-widest uppercase">Semana {week.week}</span>
                       <div className="h-px bg-slate-100 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((dayName) => {
                        const dayKey = dayName as keyof typeof week.schedule;
                        const visits = week.schedule[dayKey] || [];
                        return (
                          <div key={dayName} className="space-y-4">
                            <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] px-2">{dayName}</span>
                            <div className="space-y-3 min-h-[100px] bg-slate-50/50 p-2 rounded-3xl border border-dashed border-slate-200">
                              {visits.length > 0 ? visits.map((visit, sIdx) => (
                                <VisitCard key={sIdx} visit={visit} />
                              )) : (
                                <div className="h-20 flex items-center justify-center">
                                  <span className="text-[10px] text-slate-300 font-bold uppercase italic">Livre</span>
                                </div>
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

          {/* Housing Strategic Insight */}
          <section className="bg-[#0f172a] rounded-[50px] p-12 text-white flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
             <div className="flex-1 space-y-8 relative z-10">
                <div>
                   <h3 className="text-4xl font-black mb-3">Estratégia de Hub Residencial</h3>
                   <p className="text-indigo-200 font-medium text-lg leading-relaxed">Bairros com maior conectividade para sua carteira técnica:</p>
                </div>
                <div className="flex flex-wrap gap-4">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-8 py-5 bg-white/5 rounded-3xl font-black text-xl border border-white/10 hover:bg-white/10 transition-all cursor-default">{b}</span>
                   ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">
                  {result.housingRecommendation.centroidDescription}
                </p>
             </div>
             <div className="w-full lg:w-[400px] bg-white p-10 rounded-[40px] text-slate-900 shadow-2xl relative z-10">
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Médio Viagem</span>
                      <span className="text-5xl font-black text-indigo-600 tabular-nums">{result.housingRecommendation.comparison.suggestedAvgTime}</span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-xs font-black uppercase">Otimizado</div>
                  </div>
                  <div className="pt-8 border-t border-slate-100">
                     <p className="text-xs text-slate-500 font-bold leading-relaxed italic">
                       "A localização estratégica sugerida reduz a dependência de baldeações críticas na Estação Luz e Sé."
                     </p>
                  </div>
                </div>
             </div>
          </section>

          {/* Performance Summary */}
          <section className="bg-emerald-50 border-2 border-emerald-100 p-12 rounded-[50px] text-center max-w-5xl mx-auto shadow-sm">
             <h3 className="text-xs font-black text-emerald-600 mb-6 uppercase tracking-[0.3em]">Resumo de Performance Operacional</h3>
             <p className="text-emerald-800 text-xl font-bold leading-relaxed max-w-3xl mx-auto">
               {result.timeSavingsSummary}
             </p>
          </section>

          <footer className="mt-10 py-12 text-center border-t border-slate-200">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Relatório Logístico • Expert Router SP • {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      )}
      
      {!result && (
        <footer className="mt-20 py-10 border-t border-slate-100 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">SP Route Optimizer • Engenharia de Transportes • 2025</p>
        </footer>
      )}
    </div>
  );
};

export default App;
