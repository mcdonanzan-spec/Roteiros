
import React, { useState, useRef } from 'react';
import { ConstructionSite, AnalysisResult, VisitDetail, MonthAgenda } from './types';
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
  TruckIcon,
  CodeBracketIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface VisitCardProps {
  visit: VisitDetail;
  isGrouped?: boolean;
  onEdit: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, isGrouped, onEdit }) => {
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

  const isWalkingOverLimit = visit.walkingMinutes !== undefined && visit.walkingMinutes > 15;

  return (
    <div 
      onClick={onEdit}
      className={`p-4 bg-white rounded-2xl border transition-all group overflow-hidden cursor-pointer hover:border-indigo-400 hover:shadow-md hover:scale-[1.01] relative ${
        isGrouped ? 'border-indigo-200 border-l-4 border-l-indigo-500' : 'border-slate-200 shadow-sm'
      } ${isWalkingOverLimit ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
    >
      <div className="flex justify-between items-start mb-2 gap-2 pr-4">
        <span className="text-[11px] font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase truncate">
          {visit.siteName}
        </span>
        {visit.isFullTurn && (
          <span className="shrink-0 px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[8px] font-black rounded uppercase border border-rose-100">Integral</span>
        )}
      </div>

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-indigo-600">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
      
      {visit.metroLine && (
        <div className={`text-[9px] font-black px-2.5 py-1 rounded-full inline-block mb-2 shadow-sm ${getMetroStyle(visit.metroLine)}`}>
          {visit.metroLine}
        </div>
      )}

      <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
        {visit.walkingMinutes !== undefined && (
          <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
            <ClockIcon className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-bold">Caminhada: <span className="text-slate-900">{visit.walkingMinutes} min</span></span>
            {isWalkingOverLimit && (
              <span className="px-1 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[8px] font-black rounded uppercase animate-pulse">
                &gt;15 min!
              </span>
            )}
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
  
  // Estados para edição interativa de visitas
  const [editingVisit, setEditingVisit] = useState<{
    weekIdx: number;
    dayName: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';
    visitIdx: number;
    visit: VisitDetail;
  } | null>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);

  const handleOpenEdit = (
    weekIdx: number, 
    dayName: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta', 
    visitIdx: number, 
    visit: VisitDetail
  ) => {
    setIsNewVisit(false);
    setEditingVisit({
      weekIdx,
      dayName,
      visitIdx,
      visit: { ...visit }
    });
  };

  const handleOpenAdd = (
    weekIdx: number,
    dayName: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta'
  ) => {
    setIsNewVisit(true);
    setEditingVisit({
      weekIdx,
      dayName,
      visitIdx: -1,
      visit: {
        siteName: '',
        metroLine: '',
        busInfo: '',
        walkingMinutes: 5,
        isFullTurn: false
      }
    });
  };

  const handleSaveVisit = () => {
    if (!result || !editingVisit) return;
    const { weekIdx, dayName, visitIdx, visit } = editingVisit;

    if (!visit.siteName.trim()) {
      alert("Por favor, digite o nome da obra.");
      return;
    }

    const updatedAgenda = [...result.monthlyAgenda];
    const targetWeek = { ...updatedAgenda[weekIdx] };
    const targetSchedule = { ...targetWeek.schedule };
    const targetDayVisits = [...(targetSchedule[dayName] || [])];

    if (isNewVisit) {
      targetDayVisits.push(visit);
    } else {
      targetDayVisits[visitIdx] = visit;
    }

    targetSchedule[dayName] = targetDayVisits;
    targetWeek.schedule = targetSchedule;
    updatedAgenda[weekIdx] = targetWeek;

    setResult({
      ...result,
      monthlyAgenda: updatedAgenda
    });
    setEditingVisit(null);
  };

  const handleDeleteVisit = () => {
    if (!result || !editingVisit) return;
    const { weekIdx, dayName, visitIdx } = editingVisit;

    const updatedAgenda = [...result.monthlyAgenda];
    const targetWeek = { ...updatedAgenda[weekIdx] };
    const targetSchedule = { ...targetWeek.schedule };
    const targetDayVisits = [...(targetSchedule[dayName] || [])];

    targetDayVisits.splice(visitIdx, 1);
    targetSchedule[dayName] = targetDayVisits;
    targetWeek.schedule = targetSchedule;
    updatedAgenda[weekIdx] = targetWeek;

    setResult({
      ...result,
      monthlyAgenda: updatedAgenda
    });
    setEditingVisit(null);
  };
  
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

  const generateMarkdown = (res: AnalysisResult) => {
    let md = `# 🏗️ Planejamento Logístico SP - Expert Router\n\n`;
    md += `> Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    md += `## 🩺 Diagnóstico Estratégico\n\n`;
    md += `"${res.diagnosis}"\n\n`;
    
    md += `### 🏢 Contexto de Ciclo de Trabalho\n`;
    md += `- **Mês Atual:** Focado em Visitas Técnicas (Roteirizado abaixo).\n`;
    md += `- **Próximos 2 Meses:** Atividade fixa no escritório (Peixoto Gomide).\n\n`;

    md += `### 📊 Impacto Mensal\n`;
    md += `- **Economia Mensal:** ${res.housingRecommendation.comparison.monthlySavings}\n`;
    md += `- **Eficiência Atual:** ${res.currentEvaluation.efficiency}\n\n`;

    md += `## 📅 Agenda Mensal Roteirizada (Mês de Visitas)\n\n`;
    
    res.monthlyAgenda.forEach((week) => {
      md += `### Semana ${week.week}\n\n`;
      md += `| Dia | Visitas | Detalhes de Transporte |\n`;
      md += `| :--- | :--- | :--- |\n`;
      
      const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;
      days.forEach(day => {
        const visits = week.schedule[day];
        if (visits && visits.length > 0) {
          const names = visits.map(v => `**${v.siteName}**${v.isFullTurn ? ' (Integral)' : ''}`).join('<br>');
          const details = visits.map(v => {
            let info = `${v.metroLine || 'N/A'}`;
            if (v.walkingMinutes) info += ` 🚶 ${v.walkingMinutes}min`;
            if (v.busInfo) info += ` 🚌 ${v.busInfo}`;
            return info;
          }).join('<br>');
          md += `| ${day} | ${names} | ${details} |\n`;
        } else {
          md += `| ${day} | _Escritório (Peixoto Gomide)_ | - |\n`;
        }
      });
      md += `\n`;
    });

    md += `## 🏠 Recomendação de Moradia (Hub Estratégico)\n\n`;
    md += `**Bairros Sugeridos:** ${res.housingRecommendation.topNeighborhoods.join(', ')}\n\n`;
    md += `> ${res.housingRecommendation.centroidDescription}\n\n`;
    md += `### Comparativo de Tempo\n`;
    md += `- **Tempo Médio Sugerido:** ${res.housingRecommendation.comparison.suggestedAvgTime}\n`;
    md += `- **Tempo Médio Atual:** ${res.housingRecommendation.comparison.currentAvgTime}\n\n`;

    md += `## 🚀 Resumo de Performance\n\n`;
    md += `${res.timeSavingsSummary}\n\n`;
    
    md += `---\n_Gerado por SP Route Optimizer_`;
    return md;
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const md = generateMarkdown(result);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README_LOGISTICA_CICLO_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const element = reportRef.current;
      const originalWidth = element.style.width;
      const originalPadding = element.style.padding;
      element.classList.add('pdf-export-mode');
      element.style.width = '1000px'; 
      element.style.padding = '40px';
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: element.scrollHeight,
        windowWidth: 1000
      });
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
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
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
      alert("Erro ao processar o arquivo PDF.");
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
        <div className="flex gap-2 items-center flex-wrap">
           {result && (
             <>
               <button 
                 onClick={handleDownloadMarkdown}
                 className="px-6 py-3 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
               >
                 <CodeBracketIcon className="h-5 w-5" />
                 GitHub Markdown
               </button>
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
             </>
           )}
           <button onClick={() => setResult(null)} className="px-5 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
             {result ? 'Novo Cálculo' : 'Limpar'}
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
                {error}
              </div>
            )}
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
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <BuildingOfficeIcon className="h-4 w-4 text-emerald-500" />
                   Hub de Escritório (Fixo)
                 </h2>
                 <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md uppercase">Peixoto Gomide</span>
               </div>
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                 <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                   <MapPinIcon className="h-5 w-5 text-emerald-500" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-900 leading-none mb-1">Jardim Paulista / Bela Vista</p>
                   <p className="text-[10px] text-slate-400 font-medium italic">Referência: Próximo ao Metrô Trianon-Masp</p>
                 </div>
               </div>
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
                className="w-full h-48 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50 leading-relaxed"
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
              {loading ? 'Calculando Ciclo 1:2...' : 'Otimizar Ciclo Logístico'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16"></div>
             <div className="text-center space-y-6">
               <div className="bg-indigo-50 p-6 rounded-full inline-block">
                 <MapIcon className="h-12 w-12 text-indigo-600" />
               </div>
               <h3 className="text-2xl font-black text-slate-800">Cálculo de Hub Misto</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                 O roteirizador agora considera o escritório na Peixoto Gomide como âncora principal para equilibrar sua moradia ideal entre obras e escritório.
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
               <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Estratégia de Ciclo Logístico (1/2)</h2>
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
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Agenda: Mês de Auditoria (Visitas)</h3>
                  <p className="text-slate-500 mt-2 font-medium italic">"Os dias livres indicam retorno obrigatório ao escritório fixo na Peixoto Gomide."</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col items-center border-r border-slate-200 pr-6">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Office Hub</span>
                     <span className="text-xs font-bold text-emerald-600 uppercase">Peixoto</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Metro</span>
                     <span className="text-xs font-bold text-slate-700 uppercase">L2 / L4</span>
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
                        const isMultiVisit = visits.length > 1;
                        return (
                          <div key={dayName} className="space-y-4">
                            <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em] px-2 text-center md:text-left">{dayName}</span>
                            <div className={`space-y-3 min-h-[140px] p-3 rounded-3xl border border-dashed transition-all relative group/day ${isMultiVisit ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/70 border-slate-200'}`}>
                              {visits.length > 0 ? (
                                <div className="space-y-3">
                                  {visits.map((visit, sIdx) => (
                                    <VisitCard 
                                      key={sIdx} 
                                      visit={visit} 
                                      isGrouped={isMultiVisit} 
                                      onEdit={() => handleOpenEdit(wIdx, dayKey, sIdx, visit)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center py-8 opacity-30 group-hover/day:opacity-10 transition-opacity">
                                   <BuildingOfficeIcon className="h-6 w-6 text-slate-400 mb-1" />
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Escritório</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => handleOpenAdd(wIdx, dayKey)}
                                className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-emerald-50 text-indigo-700 hover:text-emerald-700 rounded-xl text-[9px] font-black border border-indigo-100 border-dashed transition-all opacity-0 group-hover/day:opacity-100 focus:opacity-100 flex items-center justify-center gap-1 active:scale-95"
                              >
                                <span>+ Adicionar Obra</span>
                              </button>
                            </div>
                            {isMultiVisit && (
                              <span className="block text-[8px] font-black text-indigo-500 uppercase text-center tracking-widest">Visitas Agrupadas</span>
                            )}
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
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full"></div>
             <div className="flex-1 space-y-8 relative z-10">
                <div>
                   <h3 className="text-4xl font-black mb-3 tracking-tight">Estratégia de Hub Misto</h3>
                   <p className="text-indigo-200 font-medium text-lg leading-relaxed">Localizações ideais equilibrando Peixoto Gomide + Obras:</p>
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
                     <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                       "O bairro Paraíso/Ana Rosa mantém você a menos de 10 min da Peixoto Gomide e conectado a todos os eixos de obras."
                     </p>
                  </div>
                </div>
             </div>
          </section>

          {/* Performance Summary */}
          <section className="bg-emerald-50 border-2 border-emerald-100 p-12 rounded-[50px] text-center max-w-5xl mx-auto shadow-sm">
             <h3 className="text-[10px] font-black text-emerald-600 mb-6 uppercase tracking-[0.4em]">Resumo de Performance Operacional (Ciclo Trimestral)</h3>
             <p className="text-emerald-900 text-xl font-bold leading-relaxed max-w-3xl mx-auto italic">
               {result.timeSavingsSummary}
             </p>
          </section>

          <footer className="mt-10 py-12 text-center border-t border-slate-200">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Relatório Logístico • Hub Peixoto Gomide • {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      )}
      
      {!result && (
        <footer className="mt-20 py-10 border-t border-slate-100 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic tracking-[0.3em]">SP Route Optimizer • Logística de Auditoria Técnica • 2025</p>
        </footer>
      )}

      {editingVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isNewVisit ? "Adicionar Nova Visita" : "Editar Detalhes da Visita"}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                {editingVisit.dayName} - Semana {editingVisit.weekIdx + 1}
              </p>
            </div>

            <div className="space-y-4">
              {/* Nome da Obra */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome da Obra</label>
                <input
                  type="text"
                  value={editingVisit.visit.siteName}
                  onChange={(e) => setEditingVisit({
                    ...editingVisit,
                    visit: { ...editingVisit.visit, siteName: e.target.value }
                  })}
                  placeholder="Nome do Empreendimento ou Obra"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              {/* Linha do Metrô */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Linha de Metrô Próxima</label>
                <input
                  type="text"
                  value={editingVisit.visit.metroLine || ''}
                  onChange={(e) => setEditingVisit({
                    ...editingVisit,
                    visit: { ...editingVisit.visit, metroLine: e.target.value }
                  })}
                  placeholder="Ex: L1-Azul, L2-Verde, L4-Amarela"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              {/* Caminhada em Minutos */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Tempo de Caminhada</label>
                  <span className={`text-xs font-black px-2 py-0.5 rounded uppercase ${
                    editingVisit.visit.walkingMinutes !== undefined && editingVisit.visit.walkingMinutes > 15 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {editingVisit.visit.walkingMinutes || 0} min
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={editingVisit.visit.walkingMinutes || 5}
                  onChange={(e) => setEditingVisit({
                    ...editingVisit,
                    visit: { ...editingVisit.visit, walkingMinutes: parseInt(e.target.value) }
                  })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                {editingVisit.visit.walkingMinutes !== undefined && editingVisit.visit.walkingMinutes > 15 && (
                  <p className="text-[10px] text-amber-600 font-bold leading-tight">
                    ⚠️ Atenção: Caminhada acima de 15 minutos! Por favor, considere adicionar um transporte complementar no campo abaixo para segurança e facilidade.
                  </p>
                )}
              </div>

              {/* Ônibus ou Transporte Auxiliar */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Ônibus / Transporte Auxiliar</label>
                <input
                  type="text"
                  value={editingVisit.visit.busInfo || ''}
                  onChange={(e) => setEditingVisit({
                    ...editingVisit,
                    visit: { ...editingVisit.visit, busInfo: e.target.value }
                  })}
                  placeholder="Ex: Ônibus 175T-10, Integração, Uber, nulo"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                />
                <p className="text-[10px] text-slate-400 font-medium italic">Deixe vazio se for pertinho da estação de metrô (&lt; 15 min de caminhada total).</p>
              </div>

              {/* Período Integral */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">Período Integral</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Garante o dia inteiro reservado para esta obra</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingVisit.visit.isFullTurn}
                  onChange={(e) => setEditingVisit({
                    ...editingVisit,
                    visit: { ...editingVisit.visit, isFullTurn: e.target.checked }
                  })}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 animate-none pointer-events-auto"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center justify-between pt-4 border-t border-slate-100">
              <div>
                {!isNewVisit && (
                  <button
                    onClick={handleDeleteVisit}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-black rounded-xl transition-colors border border-rose-100 flex items-center gap-1.5 active:scale-95"
                  >
                    Excluir
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingVisit(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveVisit}
                  className="px-6 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-slate-900 shadow-lg shadow-indigo-100 hover:shadow-none transition-all active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
