import { ConstructionSite } from '../types';

export interface GeoLocation {
  lat: number;
  lng: number;
  macroRegion: string;
  city: string;
  isOutsideCapital: boolean;
  suggestedTransit: string;
}

export interface SiteWithGeo extends ConstructionSite {
  lat: number;
  lng: number;
  macroRegion: string;
  cityResolved: string;
  isOutsideCapital: boolean;
  distanceFromHubKm: number;
  suggestedTransit: string;
}

// Hubs centrais de referência
export const HUB_PEIXOTO_GOMIDE = {
  name: 'Escritório Central Peixoto Gomide',
  address: 'Rua Peixoto Gomide, Bela Vista / Cerqueira César, São Paulo - SP',
  lat: -23.5615,
  lng: -46.6575,
  metro: 'Linha 2-Verde (Trianon-MASP / Consolação) e Linha 4-Amarela (Paulista)'
};

export const RESIDENCIA_BRIGADEIRO = {
  name: 'Residência Semanal em SP',
  address: 'Av. Brigadeiro Luís Antônio, 1649, Bela Vista, São Paulo - SP',
  lat: -23.5620,
  lng: -46.6480,
  metro: 'Linha 1-Azul (São Joaquim) e Linha 2-Verde (Brigadeiro)'
};

/**
 * Base de geolocalização precisa para bairros de São Paulo,
 * estações de Metrô/CPTM e municípios da RMSP (incluindo Alto Tietê / Mogi das Cruzes).
 */
interface LocationEntry {
  lat: number;
  lng: number;
  region: string;
  city: string;
  outsideCapital: boolean;
  transit: string;
}

const KNOWN_LOCATIONS: Record<string, LocationEntry> = {
  // ALTO TIETÊ / MOGI DAS CRUZES (CRÍTICO: > 45km da Capital!)
  'vila suissa': { lat: -23.518, lng: -46.147, region: 'Alto Tietê (RMSP)', city: 'Mogi das Cruzes', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Estudantes) + Ônibus Municipal Mogi' },
  'mogi das cruzes': { lat: -23.524, lng: -46.192, region: 'Alto Tietê (RMSP)', city: 'Mogi das Cruzes', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Mogi das Cruzes / Estudantes)' },
  'braz cubas': { lat: -23.535, lng: -46.223, region: 'Alto Tietê (RMSP)', city: 'Mogi das Cruzes', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Braz Cubas)' },
  'jundiapeba': { lat: -23.545, lng: -46.262, region: 'Alto Tietê (RMSP)', city: 'Mogi das Cruzes', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Jundiapeba)' },
  'cesar de souza': { lat: -23.509, lng: -46.155, region: 'Alto Tietê (RMSP)', city: 'Mogi das Cruzes', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Estudantes) + Ônibus' },
  'suzano': { lat: -23.534, lng: -46.311, region: 'Alto Tietê (RMSP)', city: 'Suzano', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Suzano)' },
  'poa': { lat: -23.528, lng: -46.347, region: 'Alto Tietê (RMSP)', city: 'Poá', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Poá)' },
  'ferraz de vasconcelos': { lat: -23.541, lng: -46.368, region: 'Alto Tietê (RMSP)', city: 'Ferraz de Vasconcelos', outsideCapital: true, transit: 'Linha 11-Coral CPTM (Estação Ferraz de Vasconcelos)' },
  'itaquaquecetuba': { lat: -23.486, lng: -46.348, region: 'Alto Tietê (RMSP)', city: 'Itaquaquecetuba', outsideCapital: true, transit: 'Linha 12-Safira CPTM (Estação Itaquaquecetuba)' },

  // ZONA LESTE 2 (Extremo Leste da Capital)
  'artur alvim': { lat: -23.540, lng: -46.484, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Artur Alvim)' },
  'arthur alvim': { lat: -23.540, lng: -46.484, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Artur Alvim)' },
  'itaquera': { lat: -23.533, lng: -46.456, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha / Linha 11-Coral (Corinthians-Itaquera)' },
  'corinthians itaquera': { lat: -23.542, lng: -46.471, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha / Linha 11-Coral (Corinthians-Itaquera)' },
  'vila matilde': { lat: -23.532, lng: -46.529, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Vila Matilde)' },
  'penha': { lat: -23.524, lng: -46.549, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Penha)' },
  'guilhermina': { lat: -23.534, lng: -46.503, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Guilhermina-Esperança)' },
  'patriarca': { lat: -23.535, lng: -46.495, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Patriarca)' },
  'sao miguel': { lat: -23.497, lng: -46.442, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 12-Safira CPTM (Estação São Miguel Paulista)' },
  'guaianases': { lat: -23.542, lng: -46.416, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 11-Coral CPTM (Estação Guaianases)' },

  // ZONA LESTE 1 (Mooca, Belém, Tatuapé, Carrão)
  'belem': { lat: -23.542, lng: -46.589, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Belém)' },
  'bresser': { lat: -23.544, lng: -46.606, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Bresser-Mooca)' },
  'mooca': { lat: -23.560, lng: -46.598, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Bresser-Mooca) / Linha 10-Turquesa' },
  'tatuape': { lat: -23.540, lng: -46.576, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha / Linha 11-Coral (Estação Tatuapé)' },
  'carrao': { lat: -23.541, lng: -46.536, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Carrão)' },
  'analia franco': { lat: -23.558, lng: -46.561, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Tatuapé/Carrão) + Ônibus' },
  'vila prudente': { lat: -23.582, lng: -46.583, region: 'Zona Leste/Sudeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde / Linha 15-Prata (Estação Vila Prudente)' },
  'ipiranga': { lat: -23.593, lng: -46.602, region: 'Zona Sudeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Santos-Imigrantes/Alto do Ipiranga) / Linha 10-Turquesa' },
  'sacoma': { lat: -23.601, lng: -46.602, region: 'Zona Sudeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Estação Sacomã)' },

  // CENTRO E PAULISTA
  'bela vista': { lat: -23.558, lng: -46.647, region: 'Centro / Hub Central', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Brigadeiro / Trianon-MASP) / Linha 1-Azul' },
  'consolacao': { lat: -23.553, lng: -46.658, region: 'Centro / Hub Central', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Consolação) / Linha 4-Amarela (Paulista)' },
  'cerqueira cesar': { lat: -23.558, lng: -46.666, region: 'Centro / Jardins', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Consolação / Clínicas)' },
  'paulista': { lat: -23.555, lng: -46.662, region: 'Centro / Eixo Paulista', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Consolação) / Linha 4-Amarela (Paulista)' },
  'jardins': { lat: -23.568, lng: -46.668, region: 'Centro / Jardins', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Trianon / Oscar Freire)' },
  'paraiso': { lat: -23.573, lng: -46.643, region: 'Centro-Sul', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul / Linha 2-Verde (Estação Paraíso)' },
  'liberdade': { lat: -23.555, lng: -46.634, region: 'Centro', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Japão-Liberdade)' },
  'se': { lat: -23.550, lng: -46.633, region: 'Centro', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul / Linha 3-Vermelha (Estação da Sé)' },
  'republica': { lat: -23.544, lng: -46.643, region: 'Centro', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha / Linha 4-Amarela (Estação República)' },

  // ZONA NORTE
  'santana': { lat: -23.501, lng: -46.626, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Santana)' },
  'tucuruvi': { lat: -23.479, lng: -46.603, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Tucuruvi)' },
  'parada inglesa': { lat: -23.487, lng: -46.609, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Parada Inglesa)' },
  'jardim sao paulo': { lat: -23.492, lng: -46.617, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Jd. São Paulo-Ayrton Senna)' },
  'carandiru': { lat: -23.509, lng: -46.624, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Carandiru)' },
  'casa verde': { lat: -23.513, lng: -46.663, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Santana) + Ônibus' },
  'limao': { lat: -23.509, lng: -46.681, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Barra Funda) + Ônibus' },

  // ZONA SUL 1 (Vila Mariana, Saúde, Jabaquara)
  'vila mariana': { lat: -23.589, lng: -46.634, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul / Linha 2-Verde (Ana Rosa / Vila Mariana)' },
  'ana rosa': { lat: -23.581, lng: -46.638, region: 'Zona Sul (Eixo Linha 1/2)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul / Linha 2-Verde (Estação Ana Rosa)' },
  'saude': { lat: -23.615, lng: -46.639, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Saúde)' },
  'praca da arvore': { lat: -23.610, lng: -46.637, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Praça da Árvore)' },
  'sao judas': { lat: -23.626, lng: -46.640, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação São Judas)' },
  'conceicao': { lat: -23.635, lng: -46.641, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Conceição)' },
  'jabaquara': { lat: -23.646, lng: -46.641, region: 'Zona Sul (Eixo Linha 1)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Terminal Jabaquara)' },
  'moema': { lat: -23.603, lng: -46.662, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Moema / Eucaliptos)' },

  // ZONA SUL 2 (Brooklin, Campo Belo, Santo Amaro, Morumbi)
  'campo belo': { lat: -23.626, lng: -46.671, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Campo Belo)' },
  'brooklin': { lat: -23.617, lng: -46.689, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Brooklin)' },
  'borba gato': { lat: -23.633, lng: -46.702, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Borba Gato)' },
  'alto da boa vista': { lat: -23.641, lng: -46.705, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Alto da Boa Vista)' },
  'santo amaro': { lat: -23.654, lng: -46.708, region: 'Zona Sul (Eixo Linha 5/9)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás / Linha 9-Esmeralda (Santo Amaro)' },
  'chacara santo antonio': { lat: -23.628, lng: -46.706, region: 'Zona Sul (Eixo Linha 9)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 9-Esmeralda (Granja Julieta) / Linha 5-Lilás' },
  'morumbi': { lat: -23.601, lng: -46.719, region: 'Zona Sul / Oeste', city: 'São Paulo', outsideCapital: false, transit: 'Linha 4-Amarela (São Paulo-Morumbi) / Linha 9-Esmeralda' },
  'vila andrade': { lat: -23.627, lng: -46.732, region: 'Zona Sul', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Giovanni Gronchi)' },
  'giovanni gronchi': { lat: -23.643, lng: -46.733, region: 'Zona Sul (Eixo Linha 5)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Giovanni Gronchi)' },

  // ZONA SUL EXTREMO (Vila das Belezas, Campo Limpo, Capão Redondo)
  'vila das belezas': { lat: -23.642, lng: -46.738, region: 'Zona Sul Extremo', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Vila das Belezas)' },
  'campo limpo': { lat: -23.649, lng: -46.757, region: 'Zona Sul Extremo', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Campo Limpo)' },
  'capao redondo': { lat: -23.659, lng: -46.776, region: 'Zona Sul Extremo', city: 'São Paulo', outsideCapital: false, transit: 'Linha 5-Lilás (Estação Capão Redondo)' },
  'interlagos': { lat: -23.704, lng: -46.697, region: 'Zona Sul Extremo', city: 'São Paulo', outsideCapital: false, transit: 'Linha 9-Esmeralda (Estação Autódromo / Primavera-Interlagos)' },

  // ZONA OESTE
  'pinheiros': { lat: -23.567, lng: -46.693, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 4-Amarela / Linha 9-Esmeralda (Estação Pinheiros)' },
  'vila madalena': { lat: -23.546, lng: -46.690, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde (Estação Vila Madalena)' },
  'perdizes': { lat: -23.536, lng: -46.674, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Palmeiras-Barra Funda) + Ônibus' },
  'butanta': { lat: -23.571, lng: -46.708, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 4-Amarela (Estação Butantã)' },
  'vila sonia': { lat: -23.593, lng: -46.734, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 4-Amarela (Estação Vila Sônia)' },
  'lapa': { lat: -23.521, lng: -46.703, region: 'Zona Oeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 7-Rubi / Linha 8-Diamante (Estação Lapa)' },

  // OUTROS MUNICÍPIOS RMSP
  'guarulhos': { lat: -23.462, lng: -46.533, region: 'RMSP Norte', city: 'Guarulhos', outsideCapital: true, transit: 'Linha 13-Jade CPTM / Ônibus EMTU' },
  'santo andre': { lat: -23.657, lng: -46.533, region: 'ABC Paulista (RMSP)', city: 'Santo André', outsideCapital: true, transit: 'Linha 10-Turquesa CPTM (Estação Santo André)' },
  'sao bernardo': { lat: -23.691, lng: -46.565, region: 'ABC Paulista (RMSP)', city: 'São Bernardo do Campo', outsideCapital: true, transit: 'Trolebús Metropolitano EMTU / Conexão Linha 2 Sacomã' },
  'sao caetano': { lat: -23.622, lng: -46.574, region: 'ABC Paulista (RMSP)', city: 'São Caetano do Sul', outsideCapital: true, transit: 'Linha 10-Turquesa CPTM (Estação São Caetano)' },
  'diadema': { lat: -23.686, lng: -46.623, region: 'ABC Paulista (RMSP)', city: 'Diadema', outsideCapital: true, transit: 'Corredor ABD Metropolitano EMTU / Jabaquara' },
  'taboao da serra': { lat: -23.608, lng: -46.758, region: 'RMSP Sudoeste', city: 'Taboão da Serra', outsideCapital: true, transit: 'Linha 4-Amarela (Vila Sônia) + Ônibus EMTU Integrado' },
  'osasco': { lat: -23.532, lng: -46.792, region: 'RMSP Oeste', city: 'Osasco', outsideCapital: true, transit: 'Linha 8-Diamante / Linha 9-Esmeralda (Estação Osasco)' },
  'barueri': { lat: -23.511, lng: -46.876, region: 'RMSP Oeste', city: 'Barueri', outsideCapital: true, transit: 'Linha 8-Diamante CPTM (Estação Barueri)' },
  'alphaville': { lat: -23.498, lng: -46.852, region: 'RMSP Oeste', city: 'Barueri / Santana de Parnaíba', outsideCapital: true, transit: 'Linha 8-Diamante (Barueri) + Ônibus Alphaville' },
  'cotia': { lat: -23.603, lng: -46.919, region: 'RMSP Oeste', city: 'Cotia', outsideCapital: true, transit: 'Linha 4-Amarela (Vila Sônia) + Ônibus EMTU Raposo Tavares' },
  'ribeirao pires': { lat: -23.712, lng: -46.413, region: 'ABC Paulista (RMSP)', city: 'Ribeirão Pires', outsideCapital: true, transit: 'Linha 10-Turquesa CPTM (Estação Ribeirão Pires)' }
};

/**
 * Normaliza strings para busca sem acentos e em minúsculas
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Fórmula de Haversine para calcular a distância geodésica real em quilômetros.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Geocodifica uma obra com base em endereço, setor (bairro), cidade, cep e nome da obra.
 */
export function geocodeSite(site: ConstructionSite): SiteWithGeo {
  const searchable = cleanText(
    `${site.nomeObra} ${site.setor} ${site.cidade} ${site.endereco}`
  );

  let match: LocationEntry | undefined = undefined;

  // 1. Procura primeiro por bairros/cidades específicas mais longas
  const sortedKeys = Object.keys(KNOWN_LOCATIONS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (searchable.includes(key)) {
      match = KNOWN_LOCATIONS[key];
      break;
    }
  }

  // 2. Se não encontrou, tenta por cidade
  if (!match) {
    const cityClean = cleanText(site.cidade);
    if (cityClean.includes('mogi')) {
      match = KNOWN_LOCATIONS['mogi das cruzes'];
    } else if (cityClean.includes('suzano')) {
      match = KNOWN_LOCATIONS['suzano'];
    } else if (cityClean.includes('guarulhos')) {
      match = KNOWN_LOCATIONS['guarulhos'];
    } else if (cityClean.includes('andre')) {
      match = KNOWN_LOCATIONS['santo andre'];
    } else if (cityClean.includes('bernardo')) {
      match = KNOWN_LOCATIONS['sao bernardo'];
    } else if (cityClean.includes('caetano')) {
      match = KNOWN_LOCATIONS['sao caetano'];
    } else if (cityClean.includes('osasco')) {
      match = KNOWN_LOCATIONS['osasco'];
    } else if (cityClean.includes('taboao')) {
      match = KNOWN_LOCATIONS['taboao da serra'];
    } else if (cityClean.includes('barueri')) {
      match = KNOWN_LOCATIONS['barueri'];
    } else if (cityClean.includes('cotia')) {
      match = KNOWN_LOCATIONS['cotia'];
    }
  }

  // 3. Fallback inteligente por zona
  if (!match) {
    const setorClean = cleanText(site.setor);
    if (setorClean.includes('norte') || searchable.includes('santana') || searchable.includes('tucuruvi')) {
      match = KNOWN_LOCATIONS['santana'];
    } else if (setorClean.includes('sul') || searchable.includes('santo amaro') || searchable.includes('brooklin')) {
      match = KNOWN_LOCATIONS['campo belo'];
    } else if (setorClean.includes('leste') || searchable.includes('tatuape') || searchable.includes('mooca')) {
      match = KNOWN_LOCATIONS['tatuape'];
    } else if (setorClean.includes('oeste') || searchable.includes('pinheiros') || searchable.includes('butanta')) {
      match = KNOWN_LOCATIONS['pinheiros'];
    } else {
      // Centro padrão de SP
      match = KNOWN_LOCATIONS['bela vista'];
    }
  }

  const distHub = calculateDistanceKm(
    HUB_PEIXOTO_GOMIDE.lat,
    HUB_PEIXOTO_GOMIDE.lng,
    match.lat,
    match.lng
  );

  return {
    ...site,
    lat: match.lat,
    lng: match.lng,
    macroRegion: match.region,
    cityResolved: match.city,
    isOutsideCapital: match.outsideCapital,
    distanceFromHubKm: distHub,
    suggestedTransit: match.transit
  };
}

/**
 * Validação rigorosa de compatibilidade logística entre duas obras no mesmo dia:
 * NUNCA agrupa obras com mais de 10 km de distância,
 * NUNCA agrupa uma obra da Capital (ex: Artur Alvim) com uma obra fora da Capital (ex: Vila Suíssa / Mogi das Cruzes)!
 */
export function areSitesLogisticallyCompatible(
  siteA: SiteWithGeo,
  siteB: SiteWithGeo
): { compatible: boolean; reason?: string; distanceKm: number } {
  const distance = calculateDistanceKm(siteA.lat, siteA.lng, siteB.lat, siteB.lng);

  // Caso gritante: Mogi das Cruzes / Alto Tietê com Artur Alvim / Zona Leste da Capital
  if (
    (siteA.cityResolved === 'Mogi das Cruzes' && siteB.cityResolved !== 'Mogi das Cruzes') ||
    (siteB.cityResolved === 'Mogi das Cruzes' && siteA.cityResolved !== 'Mogi das Cruzes')
  ) {
    return {
      compatible: false,
      reason: `Incompatível: ${siteA.nomeObra} (${siteA.cityResolved}) e ${siteB.nomeObra} (${siteB.cityResolved}) estão a ${distance} km de distância. Mogi das Cruzes exige dia exclusivo/Turno Integral!`,
      distanceKm: distance
    };
  }

  // Obra fora da capital vs dentro da capital
  if (siteA.isOutsideCapital !== siteB.isOutsideCapital && distance > 10) {
    return {
      compatible: false,
      reason: `Incompatível: Uma obra é da Capital e a outra é na RMSP (${siteA.macroRegion} vs ${siteB.macroRegion}), distantes ${distance} km.`,
      distanceKm: distance
    };
  }

  // Limite máximo de 10 km para duas visitas no mesmo dia em SP
  if (distance > 10) {
    return {
      compatible: false,
      reason: `Distância excessiva (${distance} km) entre ${siteA.nomeObra} e ${siteB.nomeObra}. No trânsito de SP, duas visitas no mesmo dia devem estar a no máximo 8 a 10 km.`,
      distanceKm: distance
    };
  }

  return {
    compatible: true,
    distanceKm: distance
  };
}
