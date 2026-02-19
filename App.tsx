
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
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all group overflow-hidden">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-[11px] font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase truncate">
          {visit.siteName}
        </span>
        {visit.isFullTurn && (
          <span className="shrink-0 px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[8px] font-black rounded uppercase border border-rose-100">Integral</span>
        )}
      </div>
      
      {visit.metroLine && (
        <div className={`text-[9px] font-black px-2.5 py-1 rounded-full inline-block mb-2 shadow-sm ${getMetroStyle(visit.metroLine)}`}>
          {visit.metroLine}
        </div>
      )}

      <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
        {visit.walkingMinutes !== undefined && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <ClockIcon className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-bold">Caminhada: <span className="text-slate-900">{visit.walkingMinutes} min</span></span>
          </div>
        )}
        {visit.busInfo && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <TruckIcon className="h-3 w-3 text-indigo-500 shrink-0" />
            <span className="text-[9px] font-semibold italic truncate leading-none">{visit.busInfo}</span>
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
    return lines.map(line => {
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
    
    // Pequeno atraso para garantir que qualquer animação de hover tenha terminado
    await new Promise(r => setTimeout(r, 100));

    try {
      const element = reportRef.current;
      const originalWidth = element.style.width;
      const originalPadding = element.style.padding;
      
      // Preparação do elemento para captura em formato A4
      element.classList.add('pdf-export-mode');
      element.style.width = '1000px'; 
      element.style.padding = '40px';

      const canvas = await html2canvas(element, {
        scale: 3, // Aumentado para 3x para nitidez total de texto pequeno
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: element.scrollHeight,
        windowWidth: 1000
      });

      // Restaurar estilos originais
      element.classList.remove('pdf-export-mode');
      element.style.width = originalWidth;
      element.style.padding = originalPadding;

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Adiciona as páginas subsequentes se necessário
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
      pdf.save(`Plano_Estrategico_SP_${dateStr}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o arquivo PDF de alta definição.");
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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Expert Logistics Agent</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
           {result && (
             <button 
               onClick={handleDownloadPDF}
               disabled={exporting}
               className={`px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center gap-2 shadow-xl ${
                 exporting ? 'bg-slate-400' : 'bg-slate-900 hover:bg-black active:scale-95'
               }`}
             >
               {exporting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <DocumentArrowDownIcon className="h-5 w-5" />}
               {exporting ? 'Exportando HD...' : 'PDF Roteirizado HD'}
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
                Base Residencial Atual
              </h2>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Ex: Próximo ao Metrô Santa Cruz, SP"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TableCellsIcon className="h-4 w-4 text-indigo-500" />
                Dados da Planilha (Colunas A a G)
              </h2>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Cole aqui os dados da sua planilha de obras..."
                className="w-full h-64 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50 leading-relaxed"
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
              {loading ? 'Calculando Malha Metroviária...' : 'Gerar Planejamento Mensal'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed">
             <div className="text-center space-y-6">
               <div className="bg-indigo-50 p-6 rounded-full inline-block">
                 <MapIcon className="h-12 w-12 text-indigo-600" />
               </div>
               <h3 className="text-2xl font-black text-slate-800">Cálculo de Last-Mile</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                 "O agente cruza as coordenadas das obras com as saídas de Metrô/Trem para calcular o tempo real de caminhada e sugerir conexões de ônibus onde necessário."
               </p>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div id="report-content" ref={reportRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-50 p-8 rounded-[40px] shadow-sm border border-slate-200">
          {/* Diagnostic Summary */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
               <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Diagnóstico Logístico de São Paulo</h2>
               <p className="text-slate-800 text-xl font-bold leading-snug italic">"{result.diagnosis}"</p>
            </div>
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-100 text-white flex flex-col justify-center text-center">
               <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Impacto Logístico Mensal</span>
               <div className="text-5xl font-black tabular-nums">{result.housingRecommendation.comparison.monthlySavings}</div>
            </div>
          </section>

          {/* Geographical Visualization */}
          <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapIcon className="h-6 w-6 text-indigo-500" />
                  <h3 className="text-xl font-black text-slate-800 underline decoration-indigo-200 decoration-4 underline-offset-4">Visualização de Clusters de Obra</h3>
                </div>
             </div>
             <SiteVisualizer clusters={result.clusters} />
          </section>

          {/* Expert Monthly Agenda */}
          <section className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Mensal Roteirizada</h3>
                  <p className="text-slate-500 mt-2 font-medium">Fluxo otimizado para reduzir integrações e maximizar o uso da malha metroferroviária.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col items-center border-r border-slate-200 pr-6">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Caminhada</span>
                     <span className="text-xs font-bold text-slate-700 uppercase">Otimizada</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Metro</span>
                     <span className="text-xs font-bold text-slate-700 uppercase">Hub Prioritário</span>
                   </div>
                </div>
             </div>

             <div className="space-y-16">
               {result.monthlyAgenda.map((week, wIdx) => (
                 <div key={wIdx} className="page-break-inside-avoid">
                    <div className="flex items-center gap-6 mb-8">
                       <span className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-[0.2em] uppercase">Semana {week.week}</span>
                       <div className="h-px bg-slate-100 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((dayName) => {
                        const dayKey = dayName as keyof typeof week.schedule;
                        const visits = week.schedule[dayKey] || [];
                        return (
                          <div key={dayName} className="space-y-4">
                            <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em] px-2 text-center md:text-left">{dayName}</span>
                            <div className="space-y-3 min-h-[140px] bg-slate-50/70 p-3 rounded-3xl border border-dashed border-slate-200">
                              {visits.length > 0 ? visits.map((visit, sIdx) => (
                                <VisitCard key={sIdx} visit={visit} />
                              )) : (
                                <div className="h-full flex items-center justify-center py-10 opacity-20 grayscale">
                                   <ArrowPathIcon className="h-8 w-8 text-slate-300" />
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

          {/* Housing Strategy Insight */}
          <section className="bg-[#0f172a] rounded-[50px] p-12 text-white flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden shadow-2xl">
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full"></div>
             <div className="flex-1 space-y-8 relative z-10">
                <div>
                   <h3 className="text-4xl font-black mb-3 tracking-tight">Estratégia de Hub Residencial</h3>
                   <p className="text-indigo-200 font-medium text-lg leading-relaxed">Localizações com maior conectividade modal para sua carteira atual:</p>
                </div>
                <div className="flex flex-wrap gap-4">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-8 py-5 bg-white/5 rounded-3xl font-black text-xl border border-white/10 hover:bg-white/15 transition-all cursor-default shadow-sm">{b}</span>
                   ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium italic">
                  "{result.housingRecommendation.centroidDescription}"
                </p>
             </div>
             <div className="w-full lg:w-[420px] bg-white p-10 rounded-[40px] text-slate-900 shadow-2xl relative z-10 border border-slate-100">
                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tempo Médio Viagem</span>
                      <span className="text-6xl font-black text-indigo-600 tabular-nums tracking-tighter">{result.housingRecommendation.comparison.suggestedAvgTime}</span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">Otimizado</div>
                  </div>
                  <div className="pt-8 border-t border-slate-100 space-y-3">
                     <p className="text-xs text-slate-600 font-bold leading-relaxed">
                       "A localização estratégica sugerida reduz a dependência de baldeações críticas em terminais saturados (Sé/Luz)."
                     </p>
                  </div>
                </div>
             </div>
          </section>

          {/* Performance Summary */}
          <section className="bg-emerald-50 border-2 border-emerald-100 p-12 rounded-[50px] text-center max-w-5xl mx-auto shadow-sm">
             <h3 className="text-[10px] font-black text-emerald-600 mb-6 uppercase tracking-[0.4em]">Resumo de Performance Operacional</h3>
             <p className="text-emerald-900 text-xl font-bold leading-relaxed max-w-3xl mx-auto italic">
               {result.timeSavingsSummary}
             </p>
          </section>

          <footer className="mt-10 py-12 text-center border-t border-slate-200">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Relatório Logístico de Engenharia • SP Expert Router • {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      )}
      
      {!result && (
        <footer className="mt-20 py-10 border-t border-slate-100 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic tracking-[0.3em]">SP Route Optimizer • Engenharia de Movimentação Urbana • 2025</p>
        </footer>
      )}
    </div>
  );
};

export default App;
