
import React, { useState, useRef } from 'react';
import { ConstructionSite, AnalysisResult } from './types';
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
  MapIcon
} from '@heroicons/react/24/outline';

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
      
      // Temporariamente ajusta a largura para captura em alta qualidade sem cortes laterais
      const originalStyle = element.style.width;
      element.style.width = '1200px';

      const canvas = await html2canvas(element, {
        scale: 2, // Resolução Retina para impressão
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        width: 1200,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Garante que o elemento clonado esteja visível e formatado
          const clonedElement = clonedDoc.getElementById('report-content');
          if (clonedElement) {
             clonedElement.style.width = '1200px';
          }
        }
      });

      // Restaura o estilo original
      element.style.width = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // ~210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // ~297mm
      
      // A imagem deve ocupar 100% da largura da folha (210mm)
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Primeira Página
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Páginas Adicionais (Auto-clipping)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
      pdf.save(`Plano_Logistico_SP_${dateStr}.pdf`);

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao processar PDF. Tente usar a função Imprimir (Ctrl+P) do navegador.");
    } finally {
      setExporting(false);
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
          <p className="mt-1 text-slate-500 text-sm">
            Inteligência de Logística Urbana e Estratégia de Moradia
          </p>
        </div>
        <div className="flex gap-2 items-center">
           {result && (
             <button 
               onClick={handleDownloadPDF}
               disabled={exporting}
               className={`px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center gap-2 shadow-xl ${
                 exporting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100'
               }`}
             >
               {exporting ? (
                 <ArrowPathIcon className="h-5 w-5 animate-spin" />
               ) : (
                 <DocumentArrowDownIcon className="h-5 w-5" />
               )}
               {exporting ? 'Processando Full Page...' : 'Download PDF Full'}
             </button>
           )}
           <button 
             onClick={() => setResult(null)} 
             className="px-5 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
           >
             {result ? 'Novo Roteiro' : 'Limpar'}
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-indigo-500" />
                Seu Endereço de Moradia Atual
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
                Dados da Planilha (Colunas A a G)
              </h2>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Cole aqui as linhas da sua planilha de obras..."
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
              {loading ? 'Sincronizando com a Malha de SP...' : 'Gerar Planejamento Logístico'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
             <div className="text-center space-y-4">
               <div className="bg-slate-50 p-5 rounded-3xl shadow-sm inline-block">
                 <MapIcon className="h-10 w-10 text-indigo-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Cálculo de Hubs Residenciais</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto">
                 "O agente cruza os dados das obras com a topologia das linhas de metrô para sugerir bairros onde você economiza até 60h de trânsito por mês."
               </p>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div 
          id="report-content" 
          ref={reportRef} 
          className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-50 p-8 rounded-[40px] shadow-sm border border-slate-200"
        >
          {/* Diagnostic Header */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Resumo de Viabilidade</h2>
               <p className="text-slate-700 text-lg font-medium leading-snug">"{result.diagnosis}"</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
               <span className="text-xs font-bold text-slate-400 uppercase">Eficiência Atual</span>
               <div className="mt-2"><EfficiencyBadge type={result.currentEvaluation.efficiency} /></div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white text-center">
               <span className="text-xs font-bold text-indigo-200 uppercase">Economia Mensal Est.</span>
               <div className="text-2xl font-black mt-1">{result.housingRecommendation.comparison.monthlySavings}</div>
            </div>
          </section>

          {/* Visual Mapping */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <div className="mb-6 flex items-center gap-3">
                <MapIcon className="h-6 w-6 text-indigo-500" />
                <h3 className="text-xl font-black text-slate-800">Mapeamento Geográfico de Obras</h3>
             </div>
             <SiteVisualizer clusters={result.clusters} />
          </section>

          {/* Weekly Routes */}
          <section>
            <div className="flex items-center gap-3 mb-8">
               <ClockIcon className="h-7 w-7 text-indigo-500" />
               <h2 className="text-2xl font-black text-slate-800">Modelo de Rota Semanal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {result.weeklyRoute.map((day, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="bg-slate-800 p-5 text-white">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">{day.day}</h4>
                    <span className="text-[10px] font-bold text-indigo-300 block leading-tight">{day.estimatedTravelTime}</span>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    {day.visits.length > 0 ? day.visits.map((v, vIdx) => (
                      <div key={vIdx} className="flex gap-2">
                        <span className="text-indigo-500 font-black text-xs mt-0.5">{vIdx + 1}.</span>
                        <span className="text-sm font-bold text-slate-700 leading-tight">{v}</span>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-xs text-slate-300 italic">Expediente Administrativo</div>
                    )}
                    <div className="pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Tempo Total</span>
                        <span className="text-slate-800">{day.totalTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly Schedule Grid */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm overflow-x-auto">
             <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-800 underline decoration-indigo-200 underline-offset-8">Cronograma Mensal Otimizado</h3>
                <p className="text-sm text-slate-400 mt-4 italic">As visitas foram agrupadas por proximidade de linhas (ex: visitas da Linha Amarela no mesmo dia).</p>
             </div>

             <div className="space-y-12 min-w-[800px]">
               {result.monthlyAgenda.map((week, wIdx) => (
                 <div key={wIdx}>
                    <div className="flex items-center gap-4 mb-6">
                       <span className="px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-100">Semana {week.week}</span>
                       <span className="h-px bg-slate-100 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((dayName) => {
                        const sites = (week.schedule as any)[dayName] || [];
                        return (
                          <div key={dayName} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                            <span className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">{dayName}</span>
                            <div className="space-y-3">
                              {sites.length > 0 ? (sites as string[]).map((site, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                  <span className="text-[11px] font-bold text-slate-700 leading-tight" title={site}>{site}</span>
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

          {/* Housing Strategy */}
          <section className="bg-slate-900 rounded-[40px] p-12 text-white flex flex-col lg:flex-row gap-12 items-center">
             <div className="flex-1 space-y-8">
                <div>
                   <h3 className="text-3xl font-black mb-2">Estratégia de Hub Residencial</h3>
                   <p className="text-indigo-300 font-medium">Bairros com maior conectividade para sua carteira atual de obras:</p>
                </div>
                <div className="flex flex-wrap gap-3">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-6 py-4 bg-white/5 rounded-2xl font-black text-lg border border-white/10 hover:bg-white/10 transition-colors">{b}</span>
                   ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl italic">
                  "{result.housingRecommendation.centroidDescription}"
                </p>
             </div>
             <div className="w-full lg:w-96 bg-white p-10 rounded-[32px] text-slate-900 shadow-2xl">
                <div className="space-y-8">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tempo Médio Viagem</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black text-indigo-600">{result.housingRecommendation.comparison.suggestedAvgTime}</span>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-slate-100 space-y-2">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Benchmark do Agente</span>
                     <p className="text-sm text-slate-600 font-medium">Otimização de rotas via integração Linha 4/Linha 9 e Linha 1/Linha 2.</p>
                  </div>
                </div>
             </div>
          </section>

          <section className="bg-emerald-50 border-2 border-emerald-100 p-12 rounded-[40px] text-center max-w-5xl mx-auto shadow-sm">
             <h3 className="text-xl font-black text-emerald-800 mb-6 uppercase tracking-widest">Impacto da Otimização</h3>
             <p className="text-emerald-700 text-lg font-medium leading-relaxed italic">
               "{result.timeSavingsSummary}"
             </p>
          </section>

          <footer className="mt-10 py-8 text-center border-t border-slate-200">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">SP Route Optimizer • Relatório Gerado Automaticamente em {new Date().toLocaleDateString()} • Powered by Gemini AI</p>
          </footer>
        </div>
      )}
      
      {!result && (
        <footer className="mt-20 py-10 border-t border-slate-100 text-center">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">SP Route Optimizer • Engenharia de Transportes de São Paulo • 2025</p>
        </footer>
      )}
    </div>
  );
};

export default App;
