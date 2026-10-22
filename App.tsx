import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ConstructionSite, AnalysisResult, VisitDetail, MonthAgenda, SchedulePreferences } from './types';
import { analyzeLogistics, validateAndEnforceTransit } from './services/geminiService';
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
  BuildingOfficeIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckIcon,
  TrashIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const DEFAULT_RESIDENCE = 'Av. Brigadeiro Luís Antônio, 1649, Bela Vista, São Paulo - SP';

type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const day = String(parts[2]).padStart(2, '0');
  const month = String(parts[1]).padStart(2, '0');
  const year = parts[0];
  return `${day}/${month}/${year}`;
};

export const formatDisplayDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const day = String(parts[2]).padStart(2, '0');
  const month = String(parts[1]).padStart(2, '0');
  return `${day}/${month}`;
};

export const getDayOfWeekName = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return '';
  const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 12, 0, 0);
  const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return names[d.getDay()];
};

// Cálculo de datas reais para o calendário
export const getCalendarDateForDay = (
  startDateStr: string, 
  weekIdx: number, 
  dayName: DayOfWeek
): { dateFormatted: string; fullDateStr: string; isBeforeStart: boolean; holidayName?: string } => {
  const parts = startDateStr.split('-').map(Number);
  const startYear = parts[0] || 2026;
  const startMonth = (parts[1] || 11) - 1;
  const startDay = parts[2] || 3;

  const startDateObj = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);

  const startDayOfWeek = startDateObj.getDay();
  // Se domingo (0), a primeira segunda da semana ativa é amanhã (+1 dia)
  // Se sábado (6), a primeira segunda da semana ativa é daqui a 2 dias (+2 dias)
  // Se dia de semana (1 a 5), a segunda-feira daquela semana é 1 - startDayOfWeek
  const diffToMonday = startDayOfWeek === 0 ? 1 : (startDayOfWeek === 6 ? 2 : 1 - startDayOfWeek);
  const week1Monday = new Date(startDateObj);
  week1Monday.setDate(startDateObj.getDate() + diffToMonday);
  week1Monday.setHours(0, 0, 0, 0);

  const dayOffsets: Record<DayOfWeek, number> = {
    'Segunda': 0,
    'Terça': 1,
    'Quarta': 2,
    'Quinta': 3,
    'Sexta': 4
  };

  const targetDate = new Date(week1Monday);
  targetDate.setDate(week1Monday.getDate() + (weekIdx * 7) + dayOffsets[dayName]);
  targetDate.setHours(0, 0, 0, 0);

  const dayNum = String(targetDate.getDate()).padStart(2, '0');
  const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');
  const yearNum = targetDate.getFullYear();

  const dateFormatted = `${dayNum}/${monthNum}`;
  const fullDateStr = `${dayNum}/${monthNum}/${yearNum}`;

  const isBeforeStart = targetDate.getTime() < startDateObj.getTime();

  const holidayKey = `${dayNum}/${monthNum}`;
  const holidays: Record<string, string> = {
    '02/11': 'Finados',
    '15/11': 'Proclamação da República',
    '20/11': 'Consciência Negra',
    '25/12': 'Natal',
    '01/01': 'Ano Novo',
    '25/01': 'Aniv. São Paulo'
  };
  const holidayName = holidays[holidayKey];

  return {
    dateFormatted,
    fullDateStr,
    isBeforeStart,
    holidayName
  };
};

export const getWeekRangeFormatted = (startDateStr: string, weekIdx: number): string => {
  const seg = getCalendarDateForDay(startDateStr, weekIdx, 'Segunda');
  const sex = getCalendarDateForDay(startDateStr, weekIdx, 'Sexta');
  return `${seg.dateFormatted} a ${sex.dateFormatted}/${seg.fullDateStr.split('/')[2]}`;
};

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
            {visit.transitForced && (
              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8px] font-black rounded uppercase flex items-center gap-1">
                <TruckIcon className="h-2.5 w-2.5 shrink-0" />
                Transporte Forçado
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
  // Residência cadastrada (Segunda a Sexta): Brigadeiro Luís Antônio, 1649
  const [currentAddress, setCurrentAddress] = useState(DEFAULT_RESIDENCE);
  const [rawInput, setRawInput] = useState('');
  const [parsedSites, setParsedSites] = useState<ConstructionSite[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  
  // Data de Início das Visitas (Padrão: 03/11/2026 - Novembro/2026)
  const [startDate, setStartDate] = useState('2026-11-03');

  // Parâmetros de Rotina & Dias de Visita
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([
    'Terça', 'Quarta', 'Quinta'
  ]);
  const [maxVisitsPerDay, setMaxVisitsPerDay] = useState<1 | 2 | 3>(2);
  const [commuteNote, setCommuteNote] = useState(
    'Venho de Rio Claro (interior de SP) na segunda de manhã direto para o escritório (Peixoto Gomide) e retorno na sexta-feira à tarde para o interior. A residência na Brigadeiro Luís Antônio 1649 é durante os dias de semana.'
  );

  // Campo de Análise de Moradia Ideal ("Onde Morar")
  const [enableHousingAnalysis, setEnableHousingAnalysis] = useState(true);
  const [housingPreference, setHousingPreference] = useState<'balanced' | 'office' | 'works'>('balanced');

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para edição interativa de visitas
  const [editingVisit, setEditingVisit] = useState<{
    weekIdx: number;
    dayName: DayOfWeek;
    visitIdx: number;
    visit: VisitDetail;
  } | null>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Alternar dia disponível para visitas
  const handleToggleDay = (day: DayOfWeek) => {
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) {
        alert("Pelo menos um dia da semana deve estar habilitado para visitas técnicas.");
        return;
      }
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      const order: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
      const next = [...availableDays, day].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      setAvailableDays(next);
    }
  };

  // Função para atualização dinâmica da data de início com sincronização imediata da agenda
  const handleStartDateChange = (newDateStr: string) => {
    setStartDate(newDateStr);
    if (result) {
      const sites = parsedSites.length > 0 ? parsedSites : processInput();
      const updated = validateAndEnforceTransit(
        result,
        sites,
        availableDays,
        maxVisitsPerDay,
        newDateStr
      );
      setResult({ ...updated });
    }
  };

  // Presets rápidos de rotina
  const applyPresetRioClaroNov04 = () => {
    setAvailableDays(['Terça', 'Quarta', 'Quinta']);
    setMaxVisitsPerDay(2);
    handleStartDateChange('2026-11-04');
    setCommuteNote(
      'Venho de Rio Claro (interior de SP) na segunda de manhã direto para o escritório (Peixoto Gomide) e retorno na sexta-feira à tarde para o interior. A residência na Brigadeiro Luís Antônio 1649 é durante os dias de semana.'
    );
  };

  const applyPresetRioClaroNov03 = () => {
    setAvailableDays(['Terça', 'Quarta', 'Quinta']);
    setMaxVisitsPerDay(2);
    handleStartDateChange('2026-11-03');
    setCommuteNote(
      'Venho de Rio Claro (interior de SP) na segunda de manhã direto para o escritório (Peixoto Gomide) e retorno na sexta-feira à tarde para o interior. A residência na Brigadeiro Luís Antônio 1649 é durante os dias de semana.'
    );
  };

  const applyPresetFullWeek = () => {
    setAvailableDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
    setMaxVisitsPerDay(2);
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length === 0) {
          setError('A planilha selecionada está vazia.');
          return;
        }

        let startIndex = 0;
        const firstRowText = (rows[0] || []).map(cell => String(cell || '').toLowerCase()).join(' ');
        if (
          firstRowText.includes('raz') || 
          firstRowText.includes('obra') || 
          firstRowText.includes('nome') || 
          firstRowText.includes('endere') || 
          firstRowText.includes('cep') ||
          firstRowText.includes('cidade') ||
          firstRowText.includes('bairro')
        ) {
          startIndex = 1;
        }

        const sitesExtracted: ConstructionSite[] = [];
        const linesForRawInput: string[] = [];

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const razaoSocial = String(row[0] ?? '').trim();
          const nomeObra = String(row[1] ?? '').trim();
          const endereco = String(row[2] ?? '').trim();
          const setor = String(row[3] ?? '').trim();
          const cidade = String(row[4] ?? '').trim();
          const estado = String(row[5] ?? '').trim();
          const cep = String(row[6] ?? '').trim();

          const effectiveNome = nomeObra || razaoSocial || (endereco ? `Obra - ${endereco.slice(0, 25)}` : '');

          if (effectiveNome && (endereco || setor || cidade || cep)) {
            sitesExtracted.push({
              razaoSocial,
              nomeObra: effectiveNome,
              endereco,
              setor,
              cidade: cidade || 'São Paulo',
              estado: estado || 'SP',
              cep
            });

            linesForRawInput.push([
              razaoSocial,
              effectiveNome,
              endereco,
              setor,
              cidade || 'São Paulo',
              estado || 'SP',
              cep
            ].join('\t'));
          }
        }

        if (sitesExtracted.length === 0) {
          setError('Não foi possível identificar as obras na planilha. Certifique-se de que possui as colunas de Nome da Obra, Endereço, Bairro e CEP.');
          return;
        }

        setParsedSites(sitesExtracted);
        setRawInput(linesForRawInput.join('\n'));
        setUploadedFileName(`${file.name} (${sitesExtracted.length} obras identificadas)`);
      } catch (err) {
        console.error('Erro na leitura da planilha:', err);
        setError('Erro ao processar arquivo. Suportamos formatos .xlsx, .xls, .csv, .tsv.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processInput = (): ConstructionSite[] => {
    if (parsedSites.length > 0 && inputMode === 'upload') {
      return parsedSites;
    }

    if (!rawInput.trim()) return [];

    const lines = rawInput.trim().split('\n');
    return lines.map((line, idx) => {
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes(';')) {
        cols = line.split(';');
      } else if (line.includes(',')) {
        cols = line.split(',');
      } else {
        cols = line.split(/\s{2,}/);
      }

      const lineLower = line.toLowerCase();
      if (idx === 0 && (lineLower.includes('razão') || lineLower.includes('nome da obra') || lineLower.includes('endereço'))) {
        return null;
      }

      const razaoSocial = (cols[0] || '').trim();
      const nomeObra = (cols[1] || cols[0] || '').trim();
      const endereco = (cols[2] || '').trim();
      const setor = (cols[3] || '').trim();
      const cidade = (cols[4] || 'São Paulo').trim();
      const estado = (cols[5] || 'SP').trim();
      const cep = (cols[6] || '').trim();

      return {
        razaoSocial,
        nomeObra: nomeObra || `Obra #${idx + 1}`,
        endereco,
        setor,
        cidade,
        estado,
        cep
      };
    }).filter((s): s is ConstructionSite => s !== null && Boolean(s.nomeObra && (s.endereco || s.setor || s.cidade || s.cep)));
  };

  const loadSampleData = () => {
    setCurrentAddress(DEFAULT_RESIDENCE);
    setStartDate('2026-11-03');
    const sample = 
      "Construtora Alfa\tTeen Bumerangue\tRua Bela Cintra, 1200\tConsolação\tSão Paulo\tSP\t01415-000\n" +
      "Construtora Beta\tFlow Consolação\tRua Augusta, 2400\tCerqueira César\tSão Paulo\tSP\t01412-100\n" +
      "Gafisa SA\tHorizonte Morumbi\tAv. Giovanni Gronchi, 5819\tVila Andrade\tSão Paulo\tSP\t05724-003\n" +
      "Cyrela Brazil\tParque Santana\tRua Voluntários da Pátria, 3500\tSantana\tSão Paulo\tSP\t02401-300\n" +
      "Even Construtora\tVila Mariana Prime\tRua Domingos de Morais, 2100\tVila Mariana\tSão Paulo\tSP\t04036-000\n" +
      "Mitre Realty\tMooca Corporate\tRua da Mooca, 3800\tMooca\tSão Paulo\tSP\t03165-001\n" +
      "Trisul SA\tPinheiros Design\tRua dos Pinheiros, 850\tPinheiros\tSão Paulo\tSP\t05422-001\n" +
      "Plano&Plano\tTatuapé Sky\tRua Tuiuti, 2000\tTatuapé\tSão Paulo\tSP\t03081-000";
    
    setRawInput(sample);
    const sites = sample.split('\n').map(line => {
      const cols = line.split('\t');
      return {
        razaoSocial: cols[0],
        nomeObra: cols[1],
        endereco: cols[2],
        setor: cols[3],
        cidade: cols[4],
        estado: cols[5],
        cep: cols[6]
      };
    });
    setParsedSites(sites);
    setUploadedFileName('Exemplo de Obras SP (8 obras carregadas)');
    setError(null);
  };

  const handleOpenEdit = (
    weekIdx: number, 
    dayName: DayOfWeek, 
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
    dayName: DayOfWeek
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

    if (visit.walkingMinutes !== undefined && visit.walkingMinutes > 15) {
      const original = visit.walkingMinutes;
      visit.transitForced = true;
      visit.originalWalkingMinutes = original;
      if (!visit.busInfo || visit.busInfo.trim() === '' || visit.busInfo.toLowerCase().includes('nulo')) {
        visit.busInfo = `Ônibus SPTrans / Metrô Integrado (Convertido: caminhada de ${original} min > limite de 15 min)`;
      }
      visit.walkingMinutes = Math.min(8, Math.max(4, Math.round(original * 0.25)));
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

  const handleRunAnalysis = async () => {
    if (!currentAddress) {
      setError('Por favor, informe seu endereço de residência.');
      return;
    }
    const sites = processInput();
    if (sites.length === 0) {
      setError('Nenhuma obra encontrada. Por favor, faça o upload de uma planilha (.xlsx, .xls, .csv) ou cole os dados.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeLogistics(
        currentAddress, 
        sites, 
        {
          availableDays,
          maxVisitsPerDay,
          commuteNote,
          startDate,
          housingPreference: enableHousingAnalysis ? housingPreference : 'balanced'
        }
      );
      setResult(data);
    } catch (err: any) {
      console.error("Erro na análise:", err);
      setError(
        err?.message || 'Falha ao processar a análise com o agente logístico. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = (res: AnalysisResult) => {
    let md = `# 🏗️ Planejamento Logístico SP - Expert Router\n\n`;
    md += `> Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    md += `> **Ciclo de Início das Visitas:** ${formatDisplayDate(startDate)} (${getDayOfWeekName(startDate)}-feira) - Novembro de 2026\n\n`;
    
    md += `## 📍 Contexto do Auditor Técnico\n`;
    md += `- **Residência Semanal em SP:** ${currentAddress} (Segunda a Sexta)\n`;
    md += `- **Base em Fins de Semana:** Rio Claro / Interior de SP\n`;
    md += `- **Hub de Escritório Fixo:** Rua Peixoto Gomide (Jardim Paulista/Bela Vista, SP)\n`;
    md += `- **Data Inicial das Visitas:** ${formatDisplayDate(startDate)} (${getDayOfWeekName(startDate)}-feira)\n`;
    md += `- **Dias com Visitas de Campo:** ${availableDays.join(', ')}\n`;
    md += `- **Dias Fixo no Escritório:** ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].filter(d => !availableDays.includes(d as DayOfWeek)).join(', ') || 'Nenhum'}\n`;
    md += `- **Ritmo Máximo Diário:** Até ${maxVisitsPerDay} visita(s) por dia\n\n`;

    md += `## 🩺 Diagnóstico Estratégico\n\n`;
    md += `"${res.diagnosis}"\n\n`;
    
    md += `### 🏢 Contexto de Ciclo de Trabalho\n`;
    md += `- **Mês Atual:** Focado em Visitas Técnicas (Roteirizado abaixo com datas reais).\n`;
    md += `- **Próximos 2 Meses:** Atividade fixa no escritório (Peixoto Gomide).\n\n`;

    md += `### 📊 Impacto Mensal\n`;
    md += `- **Economia Mensal:** ${res.housingRecommendation.comparison.monthlySavings}\n`;
    md += `- **Eficiência Atual:** ${res.currentEvaluation.efficiency}\n\n`;

    md += `## 🏠 Recomendação de Moradia (Onde Morar em SP)\n\n`;
    md += `**Bairros Estratégicos:** ${res.housingRecommendation.topNeighborhoods.join(', ')}\n\n`;
    md += `> ${res.housingRecommendation.centroidDescription}\n\n`;
    md += `### Comparativo com Moradia Atual (${currentAddress})\n`;
    md += `- **Tempo Médio Sugerido:** ${res.housingRecommendation.comparison.suggestedAvgTime}\n`;
    md += `- **Tempo Médio Atual:** ${res.housingRecommendation.comparison.currentAvgTime}\n\n`;

    md += `## 📅 Agenda Mensal Roteirizada - Novembro de 2026\n\n`;
    
    res.monthlyAgenda.forEach((week, wIdx) => {
      md += `### Semana ${week.week} (${getWeekRangeFormatted(startDate, wIdx)})\n\n`;
      md += `| Dia / Data | Visitas | Detalhes de Transporte |\n`;
      md += `| :--- | :--- | :--- |\n`;
      
      const days: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
      days.forEach(day => {
        const cal = getCalendarDateForDay(startDate, wIdx, day);
        const visits = week.schedule[day];
        const dayHeader = `${day} (${cal.dateFormatted})${cal.holidayName ? ` [Feriado: ${cal.holidayName}]` : ''}`;

        if (visits && visits.length > 0) {
          const names = visits.map(v => `**${v.siteName}**${v.isFullTurn ? ' (Integral)' : ''}`).join('<br>');
          const details = visits.map(v => {
            let info = `${v.metroLine || 'N/A'}`;
            if (v.walkingMinutes) info += ` 🚶 ${v.walkingMinutes}min`;
            if (v.busInfo) info += ` 🚌 ${v.busInfo}`;
            if (v.transitForced) info += ` ⚠️ *(Transporte Obrigatório: caminhada > 15 min)*`;
            return info;
          }).join('<br>');
          md += `| ${dayHeader} | ${names} | ${details} |\n`;
        } else {
          const reason = day === 'Segunda' 
            ? '_Escritório Peixoto Gomide (Chegada de Rio Claro)_' 
            : day === 'Sexta' 
            ? '_Escritório Peixoto Gomide (Retorno para Interior)_' 
            : '_Escritório Peixoto Gomide_';
          md += `| ${dayHeader} | ${reason} | - |\n`;
        }
      });
      md += `\n`;
    });

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
    a.download = `README_LOGISTICA_NOVEMBRO_${new Date().getTime()}.md`;
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
      pdf.save(`Plano_Estrategico_Novembro_${dateStr}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o arquivo PDF.");
    } finally {
      setExporting(false);
    }
  };

  const allWeekDays: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg">
            <MapPinIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">SP Route Optimizer</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Expert Logistics & Housing Agent</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
           {result && (
             <>
               <button 
                 onClick={handleDownloadMarkdown}
                 className="px-6 py-3 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm active:scale-95"
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
           <button onClick={() => setResult(null)} className="px-5 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95">
             {result ? 'Novo Cálculo' : 'Limpar'}
           </button>
        </div>
      </header>

      {!result && (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            {error && (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-start gap-3 shadow-sm">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold">Aviso no Processamento</p>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* 1. Base Residencial Cadastrada */}
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <HomeIcon className="h-4 w-4 text-indigo-500" />
                  Sua Residência Semanal em SP
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full uppercase border border-indigo-100 flex items-center gap-1">
                    <CheckIcon className="h-3 w-3" />
                    Marcado: Brigadeiro Luís Antônio 1649
                  </span>
                  {currentAddress !== DEFAULT_RESIDENCE && (
                    <button
                      type="button"
                      onClick={() => setCurrentAddress(DEFAULT_RESIDENCE)}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 underline"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="Ex: Av. Brigadeiro Luís Antônio, 1649, Bela Vista, São Paulo - SP"
                  className="w-full pl-5 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
                />
                <button 
                  type="button" 
                  onClick={() => setCurrentAddress(DEFAULT_RESIDENCE)}
                  title="Recarregar Brigadeiro Luís Antônio, 1649"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 rounded-lg"
                >
                  <HomeIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600">
                <span>🏙️ <strong>Perfil Semanal:</strong> Residência de Segunda a Sexta em SP • Fins de semana em Rio Claro (RC)</span>
              </div>
            </section>

            {/* 2. Hub de Escritório Fixo (Peixoto Gomide) */}
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <BuildingOfficeIcon className="h-4 w-4 text-emerald-500" />
                   Hub de Escritório (Fixo)
                 </h2>
                 <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase border border-emerald-100">
                   Peixoto Gomide
                 </span>
               </div>
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                 <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-emerald-600">
                   <BuildingOfficeIcon className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-900 leading-none mb-1">Rua Peixoto Gomide • Bela Vista / Jardim Paulista</p>
                   <p className="text-[10px] text-slate-500 font-medium">Metrô Trianon-Masp (Linha 2-Verde) / Consolação (Linha 4-Amarela)</p>
                 </div>
               </div>
            </section>

            {/* 3. NOVO: Data de Início das Visitas & Parâmetros de Rotina */}
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Data de Início & Calendário de Visitas
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">Configure a data exata em que você começará a rota de campo</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={applyPresetRioClaroNov04}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      startDate === '2026-11-04'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    🚗 04/11/2026 (Qua - Início)
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetRioClaroNov03}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      startDate === '2026-11-03'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    03/11/2026 (Ter)
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetFullWeek}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    Seg-Sex
                  </button>
                </div>
              </div>

              {/* Seletor de Data de Início */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                      Data de Início das Visitas a Campo:
                    </label>
                    <span className="text-[11px] text-indigo-700 font-semibold">
                      As visitas começarão estritamente a partir do dia selecionado. Dias anteriores da semana não terão visitas.
                    </span>
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-white font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm flex-wrap">
                  <span>📅 <strong>Data de Início Selecionada:</strong> {formatDisplayDate(startDate)} ({getDayOfWeekName(startDate)}-feira)</span>
                  <span className="text-indigo-300">•</span>
                  <span>Mês Alvo: {new Date(startDate + "T12:00:00").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  {result && (
                    <>
                      <span className="text-indigo-300">•</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-black">
                        ✓ Roteiro atualizado a partir de {formatDisplayDateShort(startDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Seletor visual de cada dia da semana */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  Dias da semana disponíveis para visitas de campo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {allWeekDays.map(day => {
                    const isAvailable = availableDays.includes(day);
                    const isMonday = day === 'Segunda';
                    const isFriday = day === 'Sexta';

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`p-3 rounded-2xl border text-center transition-all relative flex flex-col items-center justify-center gap-1 ${
                          isAvailable
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 active:scale-95'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-black">{day}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isAvailable ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isAvailable ? '🟢 Visitas' : '🏢 Escritório'}
                        </span>
                        {(isMonday || isFriday) && !isAvailable && (
                          <span className="text-[8px] text-amber-700 font-bold block leading-none mt-0.5">
                            {isMonday ? 'RC ➔ SP' : 'SP ➔ RC'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                  Dias marcados como "🏢 Escritório" serão reservados para trabalho interno na Peixoto Gomide (zero visitas de campo agendadas).
                </p>
              </div>

              {/* Ritmo: Quantas obras por dia */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Ritmo de Visitas por Dia:
                  </label>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    {maxVisitsPerDay === 1 ? '1 Visita por dia' : `Até ${maxVisitsPerDay} Visitas por dia`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxVisitsPerDay(1)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      maxVisitsPerDay === 1
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block font-black">1 Visita / dia</span>
                    <span className="text-[9px] text-slate-400 block">Foco & Detalhamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaxVisitsPerDay(2)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      maxVisitsPerDay === 2
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block font-black">Até 2 Visitas / dia</span>
                    <span className="text-[9px] text-slate-400 block">Equilíbrio (Recomendado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaxVisitsPerDay(3)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      maxVisitsPerDay === 3
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block font-black">Até 3 Visitas / dia</span>
                    <span className="text-[9px] text-slate-400 block">Obras Próximas</span>
                  </button>
                </div>
              </div>

              {/* Detalhe da Rotina / Viagem */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Contexto de Deslocamento Semanal (Rio Claro / Interior):
                </label>
                <input
                  type="text"
                  value={commuteNote}
                  onChange={(e) => setCommuteNote(e.target.value)}
                  placeholder="Descreva particularidades da sua viagem semanal..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-slate-50/50"
                />
              </div>
            </section>

            {/* 4. Campo de Onde Morar (Análise Estratégica de Moradia) */}
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Analisar Melhor Lugar Para Morar (Onde Morar)
                  </h2>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[11px] font-bold text-slate-500">Ativar Análise</span>
                  <input
                    type="checkbox"
                    checked={enableHousingAnalysis}
                    onChange={(e) => setEnableHousingAnalysis(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {enableHousingAnalysis ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    O agente calculará o centroide geográfico das obras cadastradas, a conectividade de transporte e o escritório na Peixoto Gomide para sugerir os melhores bairros:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setHousingPreference('balanced')}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        housingPreference === 'balanced'
                          ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 text-indigo-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-black">⚖️ Equilíbrio Total</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Peixoto Gomide + Obras</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHousingPreference('office')}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        housingPreference === 'office'
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-black">🏢 Foco Escritório</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Bela Vista / Jardins / Paulista</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHousingPreference('works')}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        housingPreference === 'works'
                          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-black">🏗️ Foco Obras</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Menor tempo em campo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Análise de moradia desativada para este cálculo.</p>
              )}
            </section>

            {/* 5. Local para Enviar Planilhas (.xlsx, .xls, .csv, .tsv) */}
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TableCellsIcon className="h-4 w-4 text-indigo-500" />
                  Planilha de Obras
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      inputMode === 'upload' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    📁 Upload Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      inputMode === 'text' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    📝 Colar Texto
                  </button>
                  <button
                    type="button"
                    onClick={loadSampleData}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-100 flex items-center gap-1 active:scale-95"
                  >
                    ⚡ Exemplo
                  </button>
                </div>
              </div>

              {inputMode === 'upload' ? (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 p-8 rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .tsv, .txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                      <ArrowUpTrayIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        Clique para selecionar ou arraste sua planilha aqui
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Formatos aceitos: <span className="font-bold text-indigo-700">.xlsx, .xls, .csv, .tsv</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center mt-1">
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold border border-slate-200">Excel (.xlsx)</span>
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold border border-slate-200">Excel 97-2004 (.xls)</span>
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold border border-slate-200">CSV (.csv)</span>
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold border border-slate-200">TSV / Tab (.tsv)</span>
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-emerald-900 truncate">{uploadedFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedSites([]);
                          setUploadedFileName(null);
                          setRawInput('');
                        }}
                        className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                        title="Remover arquivo"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {parsedSites.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                          Prévia das Obras ({parsedSites.length} no total)
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600">
                          Colunas mapeadas: A-G
                        </span>
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {parsedSites.slice(0, 5).map((s, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between gap-2 bg-white">
                            <span className="font-bold text-slate-800 truncate">{s.nomeObra}</span>
                            <span className="text-slate-500 text-[11px] truncate">{s.setor} - {s.cidade}</span>
                          </div>
                        ))}
                        {parsedSites.length > 5 && (
                          <div className="p-2 text-center text-[11px] font-bold text-slate-400 bg-slate-50">
                            + {parsedSites.length - 5} obras prontas para roteirização
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value);
                      setParsedSites([]);
                      setUploadedFileName(null);
                    }}
                    placeholder="Cole aqui as linhas da sua planilha (Colunas A a G: Razão Social, Nome da Obra, Endereço, Bairro, Cidade, Estado, CEP)..."
                    className="w-full h-48 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Suporta colagem direta do Excel ou Google Planilhas (separado por tabulação, vírgula ou ponto-e-vírgula).
                  </p>
                </div>
              )}
            </section>

            {/* Botão de Análise */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-lg transition-all shadow-xl ${
                loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-[0.98]'
              }`}
            >
              {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
              {loading ? 'Calculando Roteiro e Calendário...' : 'Otimizar Ciclo Logístico & Moradia'}
            </button>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16"></div>
             <div className="text-center space-y-6">
               <div className="bg-indigo-50 p-6 rounded-full inline-block">
                 <MapIcon className="h-12 w-12 text-indigo-600" />
               </div>
               <h3 className="text-2xl font-black text-slate-800">Cálculo de Hub e Calendário Real</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                 O roteirizador analisa o escritório na Peixoto Gomide, a sua base na <strong>Brigadeiro Luís Antônio, 1649</strong>, o início das visitas em <strong>{formatDisplayDateShort(startDate)} ({getDayOfWeekName(startDate)})</strong> e o centroide das obras para planejar visitas com datas reais do calendário.
               </p>
               <div className="pt-2 flex flex-col items-center gap-2">
                 <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                   Rotina: Visitas Terça a Quinta • Segunda e Sexta no Escritório
                 </span>
                 <span className="text-[11px] font-semibold text-slate-400">
                   Mês Alvo: Novembro de 2026 (Datas Reais)
                 </span>
               </div>
             </div>
          </div>
        </main>
      )}

      {result && (
        <div id="report-content" ref={reportRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-50 p-8 rounded-[40px] shadow-sm border border-slate-200">
          {/* Diagnostic Summary */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm md:col-span-2 space-y-3">
               <div className="flex items-center justify-between flex-wrap gap-2">
                 <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Estratégia de Ciclo Logístico (1/2)</h2>
                 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                   Início: {formatDisplayDate(startDate)} ({getDayOfWeekName(startDate)}-feira)
                 </span>
               </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                      Calendário Real • Novembro de 2026
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      Início em: {formatDisplayDate(startDate)} ({getDayOfWeekName(startDate)}-feira)
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Agenda: Mês de Auditoria (Visitas)</h3>
                  <p className="text-slate-500 mt-2 font-medium italic">
                    "Visitas alocadas estritamente nos dias permitidos ({availableDays.join(', ')}). Segunda e Sexta dedicadas ao escritório fixo na Peixoto Gomide e deslocamento interiorano."
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col items-center border-r border-slate-200 pr-6">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Office Hub</span>
                     <span className="text-xs font-bold text-emerald-600 uppercase">Peixoto</span>
                   </div>
                   <div className="flex flex-col items-center border-r border-slate-200 pr-6">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Ritmo Máximo</span>
                     <span className="text-xs font-bold text-indigo-600 uppercase">{maxVisitsPerDay} Obra/dia</span>
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
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
                       <div className="flex items-center gap-3">
                         <span className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-[0.2em] uppercase">
                           Semana {week.week}
                         </span>
                         <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                           🗓️ {getWeekRangeFormatted(startDate, wIdx)}
                         </span>
                       </div>
                       <div className="h-px bg-slate-100 flex-1 ml-4 hidden sm:block"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {allWeekDays.map((dayName) => {
                        const visits = week.schedule[dayName] || [];
                        const isMultiVisit = visits.length > 1;
                        const isMonday = dayName === 'Segunda';
                        const isFriday = dayName === 'Sexta';
                        const isAllowed = availableDays.includes(dayName);
                        const cal = getCalendarDateForDay(startDate, wIdx, dayName);

                        return (
                          <div key={dayName} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{dayName}</span>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  {cal.dateFormatted}
                                </span>
                              </div>
                              {cal.holidayName && (
                                <span className="text-[8px] font-black uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  {cal.holidayName}
                                </span>
                              )}
                              {cal.isBeforeStart && !cal.holidayName && (
                                <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                  Pré-Início
                                </span>
                              )}
                              {!isAllowed && !cal.holidayName && !cal.isBeforeStart && (
                                <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                  Escritório
                                </span>
                              )}
                            </div>

                            <div className={`space-y-3 min-h-[160px] p-3 rounded-3xl border border-dashed transition-all relative group/day ${
                              isMultiVisit 
                                ? 'bg-indigo-50/50 border-indigo-200' 
                                : cal.isBeforeStart
                                ? 'bg-slate-100/60 border-slate-200'
                                : !isAllowed 
                                ? 'bg-slate-50/80 border-slate-200' 
                                : 'bg-slate-50/70 border-slate-200'
                            }`}>
                              {visits.length > 0 ? (
                                <div className="space-y-3">
                                  {visits.map((visit, sIdx) => (
                                    <VisitCard 
                                      key={sIdx} 
                                      visit={visit} 
                                      isGrouped={isMultiVisit} 
                                      onEdit={() => handleOpenEdit(wIdx, dayName, sIdx, visit)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center py-6 px-2 text-center space-y-1 opacity-85 group-hover/day:opacity-100 transition-opacity">
                                   <BuildingOfficeIcon className="h-6 w-6 text-slate-400 mb-1" />
                                   <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Escritório Peixoto Gomide</span>
                                   {isMonday && (
                                     <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                       🚗 Chegada de Rio Claro
                                     </span>
                                   )}
                                   {isFriday && (
                                     <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                       🚗 Retorno ao Interior
                                     </span>
                                   )}
                                   {cal.holidayName && (
                                     <span className="text-[8px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                       Feriado Nacional ({cal.holidayName})
                                     </span>
                                   )}
                                   {cal.isBeforeStart && (
                                     <span className="text-[8px] font-semibold text-slate-400">
                                       Visitas iniciam em {formatDisplayDateShort(startDate)} ({getDayOfWeekName(startDate)})
                                     </span>
                                   )}
                                   {!isMonday && !isFriday && !cal.holidayName && !cal.isBeforeStart && (
                                     <span className="text-[8px] text-slate-400 font-semibold">Dia de trabalho interno</span>
                                   )}
                                </div>
                              )}
                              
                              <button
                                onClick={() => handleOpenAdd(wIdx, dayName)}
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

          {/* Housing Strategy Insight - "Onde Morar em SP" */}
          <section className="bg-[#0f172a] rounded-[50px] p-12 text-white flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden shadow-2xl">
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full"></div>
             <div className="flex-1 space-y-8 relative z-10">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded-lg border border-emerald-500/30">
                       Análise Estratégica de Moradia
                     </span>
                     <span className="text-slate-400 text-xs font-semibold">
                       Base Atual: {currentAddress}
                     </span>
                   </div>
                   <h3 className="text-4xl font-black mb-3 tracking-tight">Melhor Lugar para Morar</h3>
                   <p className="text-indigo-200 font-medium text-lg leading-relaxed">
                     Bairros recomendados que equilibram o escritório na Peixoto Gomide, as obras e a rota para o interior:
                   </p>
                </div>
                <div className="flex flex-wrap gap-4">
                   {result.housingRecommendation.topNeighborhoods.map(b => (
                     <span key={b} className="px-8 py-5 bg-white/5 rounded-3xl font-black text-xl border border-white/10 hover:bg-white/15 transition-all cursor-default shadow-sm text-emerald-300">
                       {b}
                     </span>
                   ))}
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-2">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    "{result.housingRecommendation.centroidDescription}"
                  </p>
                  <p className="text-xs text-indigo-300 font-semibold italic">
                    ℹ️ Sua residência na Brigadeiro Luís Antônio 1649 (Bela Vista) é excelente para a rotina semanal de segunda a sexta: acesso expresso ao escritório da Peixoto Gomide (~8 a 12 min) e saída rápida para o Corredor Norte-Sul / Rodovias Bandeirantes e Anhanguera no trajeto para Rio Claro.
                  </p>
                </div>
             </div>
             <div className="w-full lg:w-[420px] bg-white p-10 rounded-[40px] text-slate-900 shadow-2xl relative z-10 border border-slate-100">
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Médio Sugerido</span>
                      <span className="text-5xl font-black text-indigo-600 tabular-nums tracking-tighter">
                        {result.housingRecommendation.comparison.suggestedAvgTime}
                      </span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                      Otimizado
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Tempo Médio Atual:</span>
                      <span className="font-black text-slate-800">{result.housingRecommendation.comparison.currentAvgTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Economia Mensal Estimada:</span>
                      <span className="font-black text-emerald-600">{result.housingRecommendation.comparison.monthlySavings}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                     <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                       "Os eixos Paraíso, Ana Rosa e Bela Vista conectam as Linhas 1-Azul e 2-Verde, minimizando baldeações e garantindo acesso expresso tanto ao escritório quanto aos clusters de obras."
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
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic tracking-[0.3em]">SP Route Optimizer • Logística & Moradia SP • 2025</p>
        </footer>
      )}

      {editingVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isNewVisit ? "Adicionar Nova Visita" : "Editar Detalhes da Visita"}
              </h3>
              <p className="text-xs text-indigo-600 font-black uppercase tracking-wider mt-1">
                {editingVisit.dayName}, {getCalendarDateForDay(startDate, editingVisit.weekIdx, editingVisit.dayName).fullDateStr} • Semana {editingVisit.weekIdx + 1}
              </p>
              {getCalendarDateForDay(startDate, editingVisit.weekIdx, editingVisit.dayName).isBeforeStart && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium leading-snug">
                  ⚠️ <strong>Dia Pré-Início:</strong> Este dia ocorre antes da data oficial de início ({formatDisplayDate(startDate)}). O roteirizador padrão reserva esses dias para trabalho interno.
                </div>
              )}
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
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mt-2">
                    <p className="text-[11px] text-amber-800 font-bold leading-tight flex items-start gap-1">
                      <span className="text-sm leading-none">⚠️</span>
                      <span>
                        Caminhada acima de 15 minutos ({editingVisit.visit.walkingMinutes} min)! O sistema exige transporte público (ônibus SPTrans ou metrô). Ao salvar ou clicar abaixo, o deslocamento é convertido automaticamente.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingVisit({
                        ...editingVisit,
                        visit: {
                          ...editingVisit.visit,
                          transitForced: true,
                          originalWalkingMinutes: editingVisit.visit.walkingMinutes,
                          busInfo: editingVisit.visit.busInfo && !editingVisit.visit.busInfo.toLowerCase().includes('nulo')
                            ? editingVisit.visit.busInfo
                            : (editingVisit.visit.metroLine 
                                ? `Ônibus SPTrans Integrado / Conexão ${editingVisit.visit.metroLine}` 
                                : 'Ônibus SPTrans / Metrô - Linha Integrada'),
                          walkingMinutes: 8
                        }
                      })}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-black uppercase rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🚌 Converter para Transporte Público (8 min a pé residual)</span>
                    </button>
                  </div>
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
