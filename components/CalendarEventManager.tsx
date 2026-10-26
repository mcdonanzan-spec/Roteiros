import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { 
  CalendarDaysIcon, 
  PlusIcon, 
  TrashIcon, 
  LockClosedIcon, 
  SparklesIcon, 
  BuildingOffice2Icon,
  FlagIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Props {
  startDate: string; // 'YYYY-MM-DD'
  events: CalendarEvent[];
  onChangeEvents: (events: CalendarEvent[]) => void;
}

export const CalendarEventManager: React.FC<Props> = ({
  startDate,
  events,
  onChangeEvents
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string>('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'company' | 'holiday' | 'meeting' | 'bridge'>('company');
  const [blockVisits, setBlockVisits] = useState(true);
  const [notes, setNotes] = useState('');

  // Identifica ano e mês a partir de startDate
  const parts = startDate.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 11) - 1; // 0-indexed

  const monthName = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Dias do mês
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventForDate = (dayNum: number): CalendarEvent | undefined => {
    const dayPad = String(dayNum).padStart(2, '0');
    const monthPad = String(month + 1).padStart(2, '0');
    const fullDateKey = `${year}-${monthPad}-${dayPad}`;
    const shortDateKey = `${dayPad}/${monthPad}`;

    return events.find(e => 
      e.dateStr === fullDateKey || 
      e.dateStr === shortDateKey || 
      e.dateStr.endsWith(shortDateKey)
    );
  };

  const handleOpenDay = (dayNum: number) => {
    const dayPad = String(dayNum).padStart(2, '0');
    const monthPad = String(month + 1).padStart(2, '0');
    const fullDateKey = `${year}-${monthPad}-${dayPad}`;

    const existing = getEventForDate(dayNum);
    setEditingDate(fullDateKey);

    if (existing) {
      setEventTitle(existing.title);
      setEventType(existing.type);
      setBlockVisits(existing.blockVisits);
      setNotes(existing.notes || '');
    } else {
      setEventTitle('');
      setEventType('company');
      setBlockVisits(true);
      setNotes('');
    }

    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert('Por favor, informe o título do evento.');
      return;
    }

    const dayNum = parseInt(editingDate.split('-')[2], 10);
    const dayPad = String(dayNum).padStart(2, '0');
    const monthPad = String(month + 1).padStart(2, '0');
    const shortKey = `${dayPad}/${monthPad}`;

    const newEvent: CalendarEvent = {
      id: `evt-${editingDate}-${Date.now()}`,
      dateStr: editingDate,
      title: eventTitle.trim(),
      type: eventType,
      blockVisits,
      notes: notes.trim()
    };

    // Remove evento existente para o mesmo dia e adiciona o novo
    const filtered = events.filter(e => 
      e.dateStr !== editingDate && 
      e.dateStr !== shortKey && 
      !e.dateStr.endsWith(shortKey)
    );

    onChangeEvents([...filtered, newEvent]);
    setIsModalOpen(false);
  };

  const handleRemoveEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChangeEvents(events.filter(ev => ev.id !== id));
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'holiday':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'bridge':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <BuildingOffice2Icon className="h-3.5 w-3.5 text-purple-600" />;
      case 'holiday':
        return <FlagIcon className="h-3.5 w-3.5 text-rose-600" />;
      case 'bridge':
        return <span className="text-[10px]">🌉</span>;
      case 'meeting':
        return <span className="text-[10px]">👥</span>;
      default:
        return <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <CalendarDaysIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Calendário Corporativo, Eventos & Feriados
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mês Alvo: <strong className="capitalize text-slate-800">{monthName}</strong>. Clique em qualquer dia para adicionar eventos da Unitá, feriados ou reuniões.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 flex items-center gap-1.5">
            <LockClosedIcon className="h-3.5 w-3.5" />
            {events.filter(e => e.blockVisits).length} data(s) com visitas bloqueadas
          </span>
        </div>
      </div>

      {/* Grade do Calendário Mensal */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase py-1">
          {weekDayNames.map(wd => (
            <div key={wd}>{wd}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {/* Espaços vazios para alinhar o primeiro dia do mês */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 rounded-2xl bg-slate-50/40 border border-transparent"></div>
          ))}

          {/* Dias reais do mês */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateObj = new Date(year, month, dayNum);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const event = getEventForDate(dayNum);
            const isBlocked = event?.blockVisits;

            return (
              <div
                key={dayNum}
                onClick={() => handleOpenDay(dayNum)}
                className={`h-16 p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  event
                    ? isBlocked
                      ? 'bg-purple-50/70 border-purple-300 hover:border-purple-500 shadow-sm'
                      : 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400'
                    : isWeekend
                    ? 'bg-slate-50/80 border-slate-100 hover:border-slate-300'
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${
                    event 
                      ? 'text-purple-900' 
                      : isWeekend 
                      ? 'text-slate-400' 
                      : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>

                  {event && (
                    <span className="shrink-0">
                      {getTypeIcon(event.type)}
                    </span>
                  )}
                </div>

                {event ? (
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-black block truncate text-purple-950 leading-tight">
                      {event.title}
                    </span>
                    {isBlocked && (
                      <span className="text-[8px] font-bold text-rose-600 block leading-none">
                        Sem Visitas
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 font-bold">
                    + Evento
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Eventos Configurados */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Eventos e Feriados Ativos no Mês:
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            Visitas agendadas são automaticamente realocadas para outros dias úteis
          </span>
        </div>

        {events.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {events.map(ev => {
              const displayDate = ev.dateStr.includes('-') 
                ? `${ev.dateStr.split('-')[2]}/${ev.dateStr.split('-')[1]}`
                : ev.dateStr;

              return (
                <div
                  key={ev.id}
                  className={`pl-3 pr-2 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${getBadgeStyle(ev.type)}`}
                >
                  <span className="font-mono text-[11px] bg-white/70 px-1.5 py-0.5 rounded text-slate-800">
                    {displayDate}
                  </span>
                  <span>{ev.title}</span>
                  {ev.blockVisits && (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-black rounded uppercase border border-rose-200">
                      Bloqueado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveEvent(ev.id, e)}
                    className="p-1 hover:bg-black/10 rounded text-slate-500 hover:text-slate-800 transition-colors"
                    title="Remover evento"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Nenhum evento ou feriado configurado. Clique em qualquer data no calendário acima para adicionar.
          </p>
        )}
      </div>

      {/* Modal / Dialog para Adicionar/Editar Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {eventTitle ? 'Editar Evento do Calendário' : 'Novo Evento / Bloqueio'}
                </h3>
                <span className="text-xs font-bold text-purple-600">
                  Data: {editingDate.split('-')[2]}/{editingDate.split('-')[1]}/{editingDate.split('-')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Nome do Evento / Feriado:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Evento da Unitá, Feriado Municipal, etc."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-slate-800"
                />
              </div>

              {/* Tipo de Evento */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Categoria:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType('company')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      eventType === 'company'
                        ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <BuildingOffice2Icon className="h-4 w-4 text-purple-600" />
                    <span>🏢 Evento Unitá</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('holiday')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      eventType === 'holiday'
                        ? 'bg-rose-100 border-rose-500 text-rose-900 ring-2 ring-rose-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <FlagIcon className="h-4 w-4 text-rose-600" />
                    <span>🏖️ Feriado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('bridge')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      eventType === 'bridge'
                        ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🌉 Emenda / Ponte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('meeting')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      eventType === 'meeting'
                        ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>👥 Reunião Interna</span>
                  </button>
                </div>
              </div>

              {/* Bloqueio de Visitas */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    Bloquear Visitas de Campo neste Dia
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Nenhuma obra será roteirizada para este dia (reserva para escritório/evento).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={blockVisits}
                  onChange={(e) => setBlockVisits(e.target.checked)}
                  className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-200"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
