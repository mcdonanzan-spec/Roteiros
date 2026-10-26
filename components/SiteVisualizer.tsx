import React, { useState } from 'react';
import { Cluster, ConstructionSite } from '../types';
import { 
  HUB_PEIXOTO_GOMIDE, 
  RESIDENCIA_BRIGADEIRO, 
  geocodeSite, 
  SiteWithGeo, 
  calculateDistanceKm 
} from '../services/geoService';
import { 
  MapPinIcon, 
  BuildingOfficeIcon, 
  HomeIcon, 
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Props {
  clusters: Cluster[];
  sites?: ConstructionSite[];
}

export const SiteVisualizer: React.FC<Props> = ({ clusters, sites = [] }) => {
  const [selectedSite, setSelectedSite] = useState<SiteWithGeo | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // Geocodifica todas as obras para obter coordenadas geográficas reais
  const geocodedSites: SiteWithGeo[] = React.useMemo(() => {
    if (sites.length > 0) {
      return sites.map(s => geocodeSite(s));
    }
    // Se a lista de sites não foi fornecida diretamente, extrai dos clusters
    const extracted: SiteWithGeo[] = [];
    clusters.forEach(c => {
      c.sites.forEach(sName => {
        extracted.push(geocodeSite({
          razaoSocial: '',
          nomeObra: sName,
          endereco: '',
          setor: c.region || '',
          cidade: c.region.includes('Mogi') ? 'Mogi das Cruzes' : 'São Paulo',
          estado: 'SP',
          cep: ''
        }));
      });
    });
    return extracted;
  }, [sites, clusters]);

  // Limites geográficos reais da Grande São Paulo e Alto Tietê
  // Longitude: de Barueri/Cotia (-46.90) até Mogi das Cruzes (-46.12)
  // Latitude: de Santana/Tucuruvi/Guarulhos (-23.44) até Interlagos/Santo André (-23.72)
  const mapBounds = {
    minLng: -46.92,
    maxLng: -46.10,
    minLat: -23.72,
    maxLat: -23.44
  };

  const svgWidth = 840;
  const svgHeight = 440;
  const paddingX = 50;
  const paddingY = 40;

  // Projeção linear precisa das coordenadas (lat, lng) para pixels (X, Y) do SVG
  const projectCoords = (lat: number, lng: number): [number, number] => {
    // Clamping para manter pontos dentro do canvas
    const clampedLng = Math.max(mapBounds.minLng, Math.min(mapBounds.maxLng, lng));
    const clampedLat = Math.max(mapBounds.minLat, Math.min(mapBounds.maxLat, lat));

    const x = paddingX + ((clampedLng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * (svgWidth - paddingX * 2);
    // Latitude aumenta para o Norte (valores menos negativos), então invertemos Y no SVG
    const y = paddingY + ((mapBounds.maxLat - clampedLat) / (mapBounds.maxLat - mapBounds.minLat)) * (svgHeight - paddingY * 2);
    return [x, y];
  };

  const [hubX, hubY] = projectCoords(HUB_PEIXOTO_GOMIDE.lat, HUB_PEIXOTO_GOMIDE.lng);
  const [resX, resY] = projectCoords(RESIDENCIA_BRIGADEIRO.lat, RESIDENCIA_BRIGADEIRO.lng);

  // Paleta de cores por macro-região
  const getRegionColor = (region: string = ''): string => {
    const r = region.toLowerCase();
    if (r.includes('alto tietê') || r.includes('mogi')) return '#ea580c'; // Laranja escuro / Coral (CPTM Linha 11)
    if (r.includes('leste')) return '#dc2626'; // Vermelho (Metrô Linha 3)
    if (r.includes('norte')) return '#2563eb'; // Azul (Metrô Linha 1)
    if (r.includes('sul')) return '#9333ea'; // Roxo (Metrô Linha 5)
    if (r.includes('oeste')) return '#eab308'; // Amarelo (Metrô Linha 4)
    if (r.includes('centro') || r.includes('paulista')) return '#059669'; // Esmeralda / Verde (Metrô Linha 2)
    if (r.includes('abc')) return '#0284c7'; // Turquesa (Linha 10)
    return '#64748b';
  };

  // Linhas esquemáticas dos eixos metroferroviários principais de SP para contextualização
  const transitLines = [
    {
      name: 'Linha 11-Coral (Luz ➔ Artur Alvim ➔ Mogi das Cruzes / Estudantes - 50 km)',
      color: '#f97316',
      points: [
        projectCoords(-23.536, -46.634), // Luz
        projectCoords(-23.540, -46.576), // Tatuapé
        projectCoords(-23.542, -46.471), // Itaquera
        projectCoords(-23.534, -46.311), // Suzano
        projectCoords(-23.524, -46.192), // Mogi Centro
        projectCoords(-23.518, -46.147)  // Vila Suíssa / Estudantes
      ]
    },
    {
      name: 'Linha 3-Vermelha (Barra Funda ➔ Sé ➔ Belém ➔ Tatuapé ➔ Artur Alvim ➔ Itaquera)',
      color: '#ef4444',
      points: [
        projectCoords(-23.525, -46.666), // Barra Funda
        projectCoords(-23.550, -46.633), // Sé
        projectCoords(-23.544, -46.606), // Bresser
        projectCoords(-23.542, -46.589), // Belém
        projectCoords(-23.540, -46.576), // Tatuapé
        projectCoords(-23.532, -46.529), // Vila Matilde
        projectCoords(-23.540, -46.484), // Artur Alvim
        projectCoords(-23.533, -46.456)  // Itaquera
      ]
    },
    {
      name: 'Linha 1-Azul (Tucuruvi ➔ Santana ➔ Sé ➔ Paraíso ➔ Vila Mariana ➔ Jabaquara)',
      color: '#3b82f6',
      points: [
        projectCoords(-23.479, -46.603), // Tucuruvi
        projectCoords(-23.501, -46.626), // Santana
        projectCoords(-23.550, -46.633), // Sé
        projectCoords(-23.573, -46.643), // Paraíso
        projectCoords(-23.589, -46.634), // Vila Mariana
        projectCoords(-23.615, -46.639), // Saúde
        projectCoords(-23.646, -46.641)  // Jabaquara
      ]
    },
    {
      name: 'Linha 2-Verde (Vila Madalena ➔ Consolação/Peixoto ➔ Brigadeiro ➔ Vila Prudente)',
      color: '#10b981',
      points: [
        projectCoords(-23.546, -46.690), // Vila Madalena
        projectCoords(-23.553, -46.658), // Consolação
        projectCoords(-23.562, -46.648), // Brigadeiro
        projectCoords(-23.573, -46.643), // Paraíso
        projectCoords(-23.581, -46.638), // Ana Rosa
        projectCoords(-23.601, -46.602), // Sacomã
        projectCoords(-23.582, -46.583)  // Vila Prudente
      ]
    },
    {
      name: 'Linha 4-Amarela (Luz ➔ Paulista ➔ Pinheiros ➔ Butantã ➔ Vila Sônia)',
      color: '#facc15',
      points: [
        projectCoords(-23.536, -46.634), // Luz
        projectCoords(-23.555, -46.662), // Paulista
        projectCoords(-23.567, -46.693), // Pinheiros
        projectCoords(-23.571, -46.708), // Butantã
        projectCoords(-23.593, -46.734)  // Vila Sônia
      ]
    },
    {
      name: 'Linha 5-Lilás (Santa Cruz ➔ Moema ➔ Campo Belo ➔ Santo Amaro ➔ Capão Redondo)',
      color: '#a855f7',
      points: [
        projectCoords(-23.598, -46.636), // Santa Cruz
        projectCoords(-23.603, -46.662), // Moema
        projectCoords(-23.626, -46.671), // Campo Belo
        projectCoords(-23.617, -46.689), // Brooklin
        projectCoords(-23.641, -46.705), // Alto da Boa Vista
        projectCoords(-23.654, -46.708), // Santo Amaro
        projectCoords(-23.642, -46.738), // Vila das Belezas
        projectCoords(-23.659, -46.776)  // Capão Redondo
      ]
    }
  ];

  const filteredSites = geocodedSites.filter(site => {
    if (filterRegion === 'all') return true;
    if (filterRegion === 'outside') return site.isOutsideCapital;
    if (filterRegion === 'capital') return !site.isOutsideCapital;
    return site.macroRegion.toLowerCase().includes(filterRegion.toLowerCase());
  });

  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
      {/* Cabeçalho explicativo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <MapPinIcon className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Geolocalização Real e Topologia Urbana de São Paulo & RMSP
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Projeção em escala real (Capital vs. Região Metropolitana). Demonstra distâncias e impossibilidade de cruzar a capital com o Alto Tietê (ex: Artur Alvim ➔ Mogi das Cruzes = ~40 km).
          </p>
        </div>

        {/* Filtro rápido */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterRegion('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRegion === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({geocodedSites.length})
          </button>
          <button
            onClick={() => setFilterRegion('capital')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRegion === 'capital'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            São Paulo Capital ({geocodedSites.filter(s => !s.isOutsideCapital).length})
          </button>
          <button
            onClick={() => setFilterRegion('outside')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRegion === 'outside'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Alto Tietê / RMSP ({geocodedSites.filter(s => s.isOutsideCapital).length})
          </button>
        </div>
      </div>

      {/* SVG Canvas com Projeção Real */}
      <div className="relative bg-slate-950 rounded-2xl p-4 overflow-hidden border border-slate-900 shadow-inner">
        {/* Marcadores de orientação */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 text-[10px] font-bold text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>★ Hub Escritório (Peixoto Gomide)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>🏠 Base Residência (Brigadeiro 1649)</span>
          </div>
          <div className="flex items-center gap-2 text-rose-400">
            <span>● Linha 11-Coral (Eixo Alto Tietê: 45 km)</span>
          </div>
        </div>

        {/* Escala gráfica de distância */}
        <div className="absolute bottom-4 right-4 z-10 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <span>Escala SP:</span>
          <div className="w-20 h-1 bg-slate-600 relative">
            <div className="absolute left-0 -top-1 w-0.5 h-3 bg-slate-400"></div>
            <div className="absolute right-0 -top-1 w-0.5 h-3 bg-slate-400"></div>
          </div>
          <span>~15 km</span>
        </div>

        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-auto select-none"
        >
          {/* Grid de coordenadas */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Glow filters */}
            <filter id="glow-hub" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Áreas Macro-regionais e limites conceituais */}
          <text x={svgWidth / 2 - 80} y={paddingY + 15} className="fill-slate-700 text-[11px] font-black tracking-widest uppercase">ZONA NORTE</text>
          <text x={svgWidth / 2 - 90} y={svgHeight - 15} className="fill-slate-700 text-[11px] font-black tracking-widest uppercase">ZONA SUL</text>
          <text x={paddingX - 20} y={svgHeight / 2} className="fill-slate-700 text-[11px] font-black tracking-widest uppercase">ZONA OESTE</text>
          <text x={svgWidth / 2 + 30} y={svgHeight / 2 - 40} className="fill-slate-700 text-[11px] font-black tracking-widest uppercase">ZONA LESTE (CAPITAL)</text>
          <text x={svgWidth - 170} y={svgHeight / 2 - 80} className="fill-amber-500/80 text-[10px] font-black tracking-widest uppercase">ALTO TIETÊ / MOGI (45 KM)</text>

          {/* Divisória conceitual da Capital vs Região Metropolitana Leste */}
          <line
            x1={svgWidth - 260}
            y1={20}
            x2={svgWidth - 260}
            y2={svgHeight - 20}
            stroke="#ea580c"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <text x={svgWidth - 250} y={35} className="fill-amber-400 text-[9px] font-bold uppercase tracking-wider">
            ⇦ Limite Município de São Paulo | RMSP / Mogi das Cruzes ⇨
          </text>

          {/* Eixos Metroferroviários de Alta Capacidade */}
          {transitLines.map((line, idx) => {
            const pathData = line.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
              .join(' ');
            return (
              <g key={idx} opacity={0.65}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Linha de conexão entre Peixoto Gomide (Escritório) e Brigadeiro (Residência) */}
          <line
            x1={hubX}
            y1={hubY}
            x2={resX}
            y2={resY}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Conexão da obra selecionada até o Hub Escritório */}
          {selectedSite && (
            (() => {
              const [sx, sy] = projectCoords(selectedSite.lat, selectedSite.lng);
              const dist = selectedSite.distanceFromHubKm;
              return (
                <g>
                  <line
                    x1={hubX}
                    y1={hubY}
                    x2={sx}
                    y2={sy}
                    stroke="#818cf8"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  <rect
                    x={(hubX + sx) / 2 - 25}
                    y={(hubY + sy) / 2 - 10}
                    width="50"
                    height="18"
                    rx="4"
                    fill="#1e1b4b"
                    stroke="#4338ca"
                  />
                  <text
                    x={(hubX + sx) / 2}
                    y={(hubY + sy) / 2 + 3}
                    textAnchor="middle"
                    className="fill-indigo-200 text-[9px] font-black"
                  >
                    {dist} km
                  </text>
                </g>
              );
            })()
          )}

          {/* Marcador HUB ESCRITÓRIO PEIXOTO GOMIDE */}
          <g transform={`translate(${hubX}, ${hubY})`} filter="url(#glow-hub)" className="cursor-pointer">
            <circle r="11" fill="#f59e0b" fillOpacity="0.25" />
            <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x="10" y="4" className="fill-amber-300 text-[10px] font-black tracking-wide">
              Peixoto Gomide
            </text>
          </g>

          {/* Marcador RESIDÊNCIA BRIGADEIRO 1649 */}
          <g transform={`translate(${resX}, ${resY})`} className="cursor-pointer">
            <circle r="9" fill="#10b981" fillOpacity="0.25" />
            <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <text x="8" y="14" className="fill-emerald-300 text-[9px] font-bold">
              Brigadeiro 1649
            </text>
          </g>

          {/* PONTOS REAIS DAS OBRAS CADASTRADAS */}
          {filteredSites.map((site, i) => {
            const [x, y] = projectCoords(site.lat, site.lng);
            const isSelected = selectedSite?.nomeObra === site.nomeObra;
            const pointColor = getRegionColor(site.macroRegion);

            return (
              <g
                key={i}
                transform={`translate(${x}, ${y})`}
                onClick={() => setSelectedSite(site)}
                className="cursor-pointer group"
              >
                {/* Halo de hover / seleção */}
                <circle
                  r={isSelected ? 16 : 10}
                  fill={pointColor}
                  fillOpacity={isSelected ? 0.4 : 0.15}
                  className="transition-all duration-300 group-hover:scale-125"
                />
                {/* Ponto central da obra */}
                <circle
                  r={isSelected ? 7 : 5}
                  fill={pointColor}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all"
                />
                {/* Rótulo da obra */}
                <text
                  x="8"
                  y="3"
                  className={`text-[9px] font-black transition-all ${
                    isSelected ? 'fill-white text-[10px]' : 'fill-slate-300 group-hover:fill-white'
                  }`}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {site.nomeObra}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Cartão de Detalhe da Obra Selecionada */}
      {selectedSite ? (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded uppercase">
                {selectedSite.macroRegion}
              </span>
              <h4 className="text-sm font-black text-slate-900">{selectedSite.nomeObra}</h4>
              {selectedSite.isOutsideCapital && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded uppercase border border-amber-300">
                  ⚠️ Fora da Capital (Turno Integral Obrigatório)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              📍 <strong>Localização:</strong> {selectedSite.cityResolved} • {selectedSite.setor || 'Região'} • {selectedSite.endereco || 'Endereço cadastrado'}
            </p>
            <p className="text-xs text-indigo-900 font-semibold">
              🚇 <strong>Transporte:</strong> {selectedSite.suggestedTransit}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Distância do Hub</span>
              <span className="text-xl font-black text-indigo-700">{selectedSite.distanceFromHubKm} km</span>
            </div>
            <button
              onClick={() => setSelectedSite(null)}
              className="p-1.5 hover:bg-indigo-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500 font-medium">
          <InformationCircleIcon className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>
            Clique sobre qualquer ponto no mapa acima para inspecionar a distância real (em km) até o escritório na Peixoto Gomide, a linha de transporte sugerida e a região geográfica.
          </span>
        </div>
      )}

      {/* Legenda de Regiões */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">
          Macro-Regiões Mapeadas e Conexões Principais:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Centro / Paulista</span>
              <span className="text-[9px] text-slate-500">Linha 2-Verde</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Zona Leste (SP)</span>
              <span className="text-[9px] text-slate-500">Linha 3-Vermelha</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Alto Tietê / Mogi</span>
              <span className="text-[9px] text-slate-500">Linha 11-Coral (&gt;45km)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Zona Norte</span>
              <span className="text-[9px] text-slate-500">Linha 1-Azul</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Zona Sul</span>
              <span className="text-[9px] text-slate-500">Linha 5-Lilás</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0"></span>
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Zona Oeste</span>
              <span className="text-[9px] text-slate-500">Linha 4-Amarela</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
