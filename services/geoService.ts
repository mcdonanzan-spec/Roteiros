import { ConstructionSite, InterSiteTransfer, TransitLeg } from '../types';

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
  'cupece': { lat: -23.662, lng: -46.655, region: 'Zona Sul (Corredor Cupecê)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Terminal Jabaquara) + Trólebus/Ônibus Corredor Cupecê (linhas 5123-10, 5013-10, EMTU 288/290)' },
  'vista cupece': { lat: -23.662, lng: -46.655, region: 'Zona Sul (Corredor Cupecê)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Terminal Jabaquara) + Trólebus/Ônibus Corredor Cupecê (linhas 5123-10, 5013-10, EMTU 288/290)' },
  'jardim miriam': { lat: -23.668, lng: -46.654, region: 'Zona Sul (Corredor Cupecê)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Terminal Jabaquara) + Trólebus Corredor Cupecê' },
  'cidade ademar': { lat: -23.662, lng: -46.662, region: 'Zona Sul (Corredor Cupecê)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Terminal Jabaquara) + Ônibus Corredor Cupecê' },
  'chacara klabin': { lat: -23.592, lng: -46.629, region: 'Zona Sul (Eixo Linha 1/2)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde / Linha 5-Lilás (Estação Chácara Klabin)' },
  'viva benx klabin': { lat: -23.592, lng: -46.629, region: 'Zona Sul (Eixo Linha 1/2)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde / Linha 5-Lilás (Estação Chácara Klabin)' },
  'ipanema 212': { lat: -23.548, lng: -46.602, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Bresser-Mooca)' },
  'ipanema': { lat: -23.548, lng: -46.602, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Estação Bresser-Mooca)' },
  'twist alto da mooca': { lat: -23.564, lng: -46.592, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Bresser-Mooca) + Ônibus 311C-10 / 3160-10' },
  'twist mooca': { lat: -23.564, lng: -46.592, region: 'Zona Leste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 3-Vermelha (Bresser-Mooca) + Ônibus 311C-10 / 3160-10' },
  'elza guimaraes': { lat: -23.504, lng: -46.626, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Santana / Carandiru)' },
  'atlantico meridional': { lat: -23.498, lng: -46.628, region: 'Zona Norte (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 1-Azul (Estação Santana)' },
  'praca santa helena': { lat: -23.586, lng: -46.579, region: 'Zona Leste/Sudeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde / Linha 15-Prata (Estação Vila Prudente)' },
  'estacao vila prudente': { lat: -23.582, lng: -46.583, region: 'Zona Leste/Sudeste (Capital)', city: 'São Paulo', outsideCapital: false, transit: 'Linha 2-Verde / Linha 15-Prata (Estação Vila Prudente)' },
  'alvorada': { lat: -23.702, lng: -46.699, region: 'Zona Sul Extremo', city: 'São Paulo', outsideCapital: false, transit: 'Linha 9-Esmeralda (Estação Autódromo / Primavera-Interlagos)' },
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

/**
 * Roteirizador Especialista Inter-Obras (Conexão Obra 1 ➔ Obra 2):
 * Prioriza e detalha a rota metroferroviária (estações, linhas, baldeações e conexões),
 * compara com alternativas de superfície e apresenta veredito fundamentado de vantagem logística.
 */
export function calculateInterSiteTransfer(
  siteA: SiteWithGeo,
  siteB: SiteWithGeo
): InterSiteTransfer {
  const distanceKm = calculateDistanceKm(siteA.lat, siteA.lng, siteB.lat, siteB.lng);
  
  const textA = cleanText(`${siteA.nomeObra} ${siteA.setor} ${siteA.endereco} ${siteA.cidade}`);
  const textB = cleanText(`${siteB.nomeObra} ${siteB.setor} ${siteB.endereco} ${siteB.cidade}`);

  // CASO DESTAQUE: Sacomã ➔ Vista Cupecê (Caso específico citado pelo usuário)
  const isSacomatoCupece = 
    (textA.includes('sacoma') && (textB.includes('cupece') || textB.includes('jabaquara'))) ||
    (textB.includes('sacoma') && (textA.includes('cupece') || textA.includes('jabaquara')));

  if (isSacomatoCupece) {
    const legs: TransitLeg[] = [
      {
        type: 'walk',
        icon: '🚶',
        instruction: 'Sair da Obra em Sacomã e caminhar até a Estação Sacomã (Metrô Linha 2-Verde)',
        durationMinutes: 6
      },
      {
        type: 'metro',
        icon: '🚇',
        lineOrRoute: 'Linha 2-Verde (sentido Vila Madalena)',
        instruction: 'Embarcar na Linha 2-Verde e viajar por 3 estações até a Estação Ana Rosa',
        durationMinutes: 8
      },
      {
        type: 'transfer',
        icon: '🔄',
        lineOrRoute: 'Baldeação Interna Ana Rosa',
        instruction: 'Transferência rápida e gratuita para a Linha 1-Azul (plataforma sentido Jabaquara)',
        durationMinutes: 3
      },
      {
        type: 'metro',
        icon: '🚇',
        lineOrRoute: 'Linha 1-Azul (sentido Jabaquara)',
        instruction: 'Seguir na Linha 1-Azul por 6 estações até o Terminal Metrô Jabaquara',
        durationMinutes: 13
      },
      {
        type: 'bus',
        icon: '🚌',
        lineOrRoute: 'Corredor Cupecê (Trólebus EMTU 288/290 ou SPTrans 5123-10 / 5013-10)',
        instruction: 'No Terminal Jabaquara, pegar Trólebus ou Ônibus no Corredor Cupecê até o ponto próximo à obra Vista Cupecê',
        durationMinutes: 10
      },
      {
        type: 'walk',
        icon: '🚶',
        instruction: 'Caminhada residual de 4 min da parada até o portão da obra Vista Cupecê',
        durationMinutes: 4
      }
    ];

    const metroSteps = legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`);

    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô L2-Verde (Sacomã) ➔ Ana Rosa (L1-Azul) ➔ Term. Jabaquara ➔ Trólebus Cupecê',
        totalMinutes: 38,
        steps: metroSteps,
        legs,
        advantageNote: 'Mais rápido e 100% previsível: foge dos semáforos e do congestionamento crônico da Av. Presidente Tancredo Neves e Av. dos Bandeirantes.'
      },
      surfaceOption: {
        title: 'Ônibus Direto SPTrans (Linha 574J-10 ou conexão via Av. Cursino)',
        durationMinutes: 54,
        steps: [
          '🚶 Caminhada de 6 min até o Terminal Sacomã',
          '🚌 Ônibus Linha 574J-10 (Metrô Conceição / Terminal Sacomã) até a conexão Cupecê (~42 min)',
          '🚶 Caminhada de 6 min até a obra Vista Cupecê'
        ],
        notes: 'Sujeito a congestionamentos severos no cruzamento da Av. Tancredo Neves com a Av. do Cursino nos horários de pico.'
      },
      verdict: {
        recommendedMode: 'metro',
        title: 'Opção Metrô é Muito Mais Vantajosa (~16 min mais rápida)',
        explanation: 'Como você dá preferência ao metrô, o itinerário trilhos (L2 + L1 até Jabaquara) + trólebus no corredor exclusivo da Cupecê é a melhor escolha. Ele blinda seu deslocamento contra os engarrafamentos da superfície e oferece tempo de viagem garantido de ~38 min.'
      },
      shortSummary: 'Metrô L2 Sacomã ➔ Ana Rosa ➔ L1 Term. Jabaquara + Ônibus Cupecê (~38 min) [Fuga de trânsito]'
    };
  }

  // CASO: Artur Alvim ➔ Flow Vila Matilde (Linha 3-Vermelha Direta)
  if (
    (textA.includes('artur') || textA.includes('arthur')) &&
    (textB.includes('matilde') || textB.includes('penha'))
  ) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: 'Caminhada da obra até a Estação Artur Alvim (Linha 3-Vermelha)', durationMinutes: 6 },
      { type: 'metro', icon: '🚇', lineOrRoute: 'Linha 3-Vermelha (sentido Barra Funda)', instruction: 'Embarque na L3-Vermelha por 3 estações até Estação Vila Matilde', durationMinutes: 6 },
      { type: 'walk', icon: '🚶', instruction: 'Caminhada curta de 5 min da estação até a obra Flow Vila Matilde', durationMinutes: 5 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô Linha 3-Vermelha Direto (Artur Alvim ➔ Vila Matilde)',
        totalMinutes: 17,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        legs,
        advantageNote: 'Linha direta sem baldeações: trajeto de 6 min nos trilhos, totalmente imune ao trânsito da Radial Leste.'
      },
      surfaceOption: {
        title: 'Ônibus SPTrans pela Radial Leste / Av. Conde de Frontin',
        durationMinutes: 28,
        steps: ['🚶 Caminhar até ponto na Radial', '🚌 Ônibus Linha 4310-10 (~18 min)', '🚶 Caminhar até a obra (~6 min)'],
        notes: 'Sujeito a semáforos frequentes na Radial Leste.'
      },
      verdict: {
        recommendedMode: 'metro',
        title: 'Metrô Linha 3-Vermelha é Imbatível (~11 min mais rápido)',
        explanation: 'Trajeto direto na Linha 3-Vermelha entre Artur Alvim e Vila Matilde. Não requer baldeação e é muito mais rápido e seguro que ônibus na superfície.'
      },
      shortSummary: 'Metrô L3-Vermelha Direto (Artur Alvim ➔ Vila Matilde, 3 estações • ~17 min)'
    };
  }

  // CASO: Teen Bumerangue (Consolação) ➔ Viva Benx Klabin (L2-Verde Direta)
  if (
    (textA.includes('bumerangue') || textA.includes('bela cintra') || textA.includes('augusta') || textA.includes('consolacao')) &&
    (textB.includes('klabin') || textB.includes('benx') || textB.includes('mariana'))
  ) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: 'Caminhar da obra até a Estação Consolação ou Trianon-MASP (Linha 2-Verde)', durationMinutes: 6 },
      { type: 'metro', icon: '🚇', lineOrRoute: 'Linha 2-Verde (sentido Vila Prudente)', instruction: 'Embarque na L2-Verde por 4 estações até Estação Chácara Klabin', durationMinutes: 9 },
      { type: 'walk', icon: '🚶', instruction: 'Caminhada de 5 min da estação até a obra Viva Benx Klabin', durationMinutes: 5 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô Linha 2-Verde Direto (Consolação / Trianon-MASP ➔ Chácara Klabin)',
        totalMinutes: 20,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        legs,
        advantageNote: 'Trajeto 100% sobre trilhos na Linha 2-Verde: escapa dos semáforos da Rua Vergueiro e Av. Brigadeiro Luís Antônio.'
      },
      surfaceOption: {
        title: 'Ônibus Corredor Paulista / Vergueiro (Linha 5119-10 ou 5185-10)',
        durationMinutes: 34,
        steps: ['🚶 Ponto na Av. Paulista', '🚌 Ônibus SPTrans (~22 min)', '🚶 Caminhada até a obra (~6 min)'],
        notes: 'Picos de lentidão na Av. Bernardino de Campos e Rua Vergueiro.'
      },
      verdict: {
        recommendedMode: 'metro',
        title: 'Metrô Linha 2-Verde Direto é Mais Vantajoso (~14 min economia)',
        explanation: 'Rota direta sem baldeações pela Linha 2-Verde da Paulista até a Chácara Klabin, oferecendo máxima pontualidade.'
      },
      shortSummary: 'Metrô L2-Verde Direto (Consolação ➔ Chácara Klabin • ~20 min)'
    };
  }

  // CASO: Ipanema 212 ➔ Twist Alto da Mooca (Mesmo Bairro Mooca, ~2.5 km)
  if (
    (textA.includes('mooca') || textA.includes('bresser') || textA.includes('ipanema')) &&
    (textB.includes('mooca') || textB.includes('twist'))
  ) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: 'Caminhar da obra até a Rua da Mooca / Av. Paes de Barros', durationMinutes: 3 },
      { type: 'bus', icon: '🚌', lineOrRoute: 'Ônibus SPTrans Linha 311C-10 ou 3160-10', instruction: 'Embarque em ônibus de bairro direto até a parada da Mooca', durationMinutes: 8 },
      { type: 'walk', icon: '🚶', instruction: 'Caminhada residual de 3 min até o portão da obra Twist Alto da Mooca', durationMinutes: 3 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô L3-Vermelha (Bresser-Mooca ➔ Belém) + Caminhada de 14 min',
        totalMinutes: 24,
        steps: [
          '🚶 Caminhada de 8 min até Estação Bresser-Mooca',
          '🚇 Linha 3-Vermelha até Belém (~4 min)',
          '🚶 Caminhada longa de 12 min até a obra (~12 min)'
        ],
        legs: [],
        advantageNote: 'Exige caminhada mais longa nas pontas porque as estações ficam nas bordas do bairro.'
      },
      surfaceOption: {
        title: 'Ônibus Direto de Bairro SPTrans (Linha 311C-10 ou 3160-10)',
        durationMinutes: 14,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        notes: 'Deslocamento ágil entre bairros vizinhos sem necessidade de entrar no subsolo do metrô.'
      },
      verdict: {
        recommendedMode: 'surface',
        title: 'Ônibus Direto de Bairro é Mais Vantajoso (Distância curta de 2.5 km)',
        explanation: 'Como ambas as obras estão no miolo da Mooca a apenas 2.5 km de distância, o ônibus direto de bairro (ou caminhada rápida) é mais ágil do que descer na estação de metrô e dar a volta pelos trilhos.'
      },
      shortSummary: 'Ônibus Direto SPTrans Linha 311C-10 / 3160-10 na Rua da Mooca (~14 min total)'
    };
  }

  // CASO: Vila Mariana ➔ Campo Belo (L1-Azul + L5-Lilás via Santa Cruz)
  if (
    (textA.includes('mariana') || textA.includes('ana rosa')) &&
    (textB.includes('campo belo') || textB.includes('brooklin'))
  ) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: 'Caminhada da obra até a Estação Vila Mariana ou Ana Rosa (Linha 1-Azul)', durationMinutes: 5 },
      { type: 'metro', icon: '🚇', lineOrRoute: 'Linha 1-Azul (sentido Jabaquara)', instruction: 'Embarque por 1 estação até a Estação Santa Cruz', durationMinutes: 3 },
      { type: 'transfer', icon: '🔄', lineOrRoute: 'Baldeação Interna (Santa Cruz)', instruction: 'Transferência rápida e coberta para a Linha 5-Lilás (sentido Capão Redondo)', durationMinutes: 3 },
      { type: 'metro', icon: '🚇', lineOrRoute: 'Linha 5-Lilás (sentido Capão Redondo)', instruction: 'Viagem de 5 estações até a Estação Campo Belo', durationMinutes: 10 },
      { type: 'walk', icon: '🚶', instruction: 'Caminhada de 5 min da estação até a obra Campo Belo', durationMinutes: 5 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô L1-Azul (Vila Mariana) ➔ Baldeação Santa Cruz (L5-Lilás) ➔ Estação Campo Belo',
        totalMinutes: 26,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        legs,
        advantageNote: 'Fuga total dos congestionamentos da Av. 23 de Maio, Av. Ibirapuera e Av. Jornalista Roberto Marinho.'
      },
      surfaceOption: {
        title: 'Ônibus Corredor Norte-Sul / Av. Ibirapuera (Linha 509M-10 ou 5154-10)',
        durationMinutes: 46,
        steps: ['🚶 Caminhada até ponto na Av. Domingos de Morais', '🚌 Ônibus SPTrans (~35 min)', '🚶 Caminhada até obra (~6 min)'],
        notes: 'Tráfego lento nos cruzamentos de Moema e Ibirapuera.'
      },
      verdict: {
        recommendedMode: 'metro',
        title: 'Metrô Linhas 1-Azul + 5-Lilás é Muito Mais Vantajoso (~20 min mais rápido)',
        explanation: 'Com baldeação expressa na Santa Cruz, a viagem sobre trilhos dura apenas 13 min entre estações, superando em 20 minutos o tempo de ônibus no trânsito pesado de Moema.'
      },
      shortSummary: 'Metrô L1-Azul ➔ Santa Cruz ➔ L5-Lilás Estação Campo Belo (~26 min) [Economia de 20 min]'
    };
  }

  // CASO: Vila das Belezas ➔ Alvorada (Linha 5-Lilás + Linha 9-Esmeralda via Santo Amaro)
  if (
    (textA.includes('belezas') || textA.includes('campo limpo')) &&
    (textB.includes('alvorada') || textB.includes('interlagos'))
  ) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: 'Caminhada da obra até a Estação Vila das Belezas (Linha 5-Lilás)', durationMinutes: 6 },
      { type: 'metro', icon: '🚇', lineOrRoute: 'Linha 5-Lilás (sentido Chácara Klabin)', instruction: 'Embarque por 2 estações até a Estação Santo Amaro', durationMinutes: 5 },
      { type: 'transfer', icon: '🔄', lineOrRoute: 'Baldeação Interna (Santo Amaro)', instruction: 'Transferência coberta para a Linha 9-Esmeralda (sentido Mendes-Vila Natal)', durationMinutes: 4 },
      { type: 'metro', icon: '🚆', lineOrRoute: 'Linha 9-Esmeralda (sentido Mendes-Vila Natal)', instruction: 'Viagem de 4 estações até a Estação Autódromo / Primavera-Interlagos', durationMinutes: 11 },
      { type: 'bus', icon: '🚌', lineOrRoute: 'Ônibus Local Integrado SPTrans', instruction: 'Ônibus circular local da estação até a obra Alvorada', durationMinutes: 6 },
      { type: 'walk', icon: '🚶', instruction: 'Caminhada residual de 4 min até o portão', durationMinutes: 4 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: 'Metrô L5-Lilás (Vila das Belezas) ➔ Santo Amaro (L9-Esmeralda) ➔ Autódromo / Interlagos',
        totalMinutes: 36,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        legs,
        advantageNote: 'Evita a ponte de Santo Amaro e os gargalos da Av. das Nações Unidas e Av. Interlagos.'
      },
      surfaceOption: {
        title: 'Ônibus SPTrans via Av. João Dias / Av. das Nações Unidas',
        durationMinutes: 55,
        steps: ['🚶 Ponto na Estrada de Itapecerica', '🚌 Ônibus Linha 695T-10 (~42 min)', '🚶 Caminhada até a obra (~7 min)'],
        notes: 'Frequentes retenções nas pontes da Marginal Pinheiros.'
      },
      verdict: {
        recommendedMode: 'metro',
        title: 'Rede sobre Trilhos (L5 + L9) é Muito Mais Vantajosa (~19 min mais rápida)',
        explanation: 'A conexão rápida em Santo Amaro para a Linha 9-Esmeralda salta por cima de todos os cruzamentos da Marginal Pinheiros e Av. Interlagos.'
      },
      shortSummary: 'Trilhos L5-Lilás ➔ Santo Amaro ➔ L9-Esmeralda Autódromo (~36 min)'
    };
  }

  // MOTOR GENÉRICO INTELIGENTE PARA QUALQUER OUTRO PAR DE OBRAS
  const stationA = siteA.suggestedTransit || 'Metrô SP';
  const stationB = siteB.suggestedTransit || 'Metrô SP';
  const isClose = distanceKm <= 3.0;

  if (isClose) {
    const legs: TransitLeg[] = [
      { type: 'walk', icon: '🚶', instruction: `Sair de ${siteA.nomeObra} e caminhar até o corredor/ponto local`, durationMinutes: 4 },
      { type: 'bus', icon: '🚌', lineOrRoute: 'Ônibus SPTrans Direto de Bairro', instruction: `Embarcar em linha direta de bairro até a parada de ${siteB.nomeObra}`, durationMinutes: 10 },
      { type: 'walk', icon: '🚶', instruction: `Caminhada final de 4 min até a portaria de ${siteB.nomeObra}`, durationMinutes: 4 }
    ];
    return {
      fromSite: siteA.nomeObra,
      toSite: siteB.nomeObra,
      distanceKm,
      metroOption: {
        title: `Metrô/CPTM Integrado (${stationA} ➔ ${stationB})`,
        totalMinutes: 28,
        steps: [
          `🚶 Caminhada de 8 min até ${stationA}`,
          `🚇 Conexão metroferroviária até ${stationB} (~12 min)`,
          `🚶 Caminhada de 8 min até ${siteB.nomeObra}`
        ],
        legs: [],
        advantageNote: 'Previsível e seguro caso o trânsito local esteja engarrafado.'
      },
      surfaceOption: {
        title: 'Ônibus Direto de Bairro / Deslocamento Local de Superfície',
        durationMinutes: 18,
        steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
        notes: 'Distância curta entre obras vizinhas (< 3 km).'
      },
      verdict: {
        recommendedMode: 'surface',
        title: `Ônibus Direto / Superfície é Mais Ágil (~10 min economia - Distância de ${distanceKm} km)`,
        explanation: `Como as obras estão a apenas ${distanceKm} km no mesmo setor geográfico, o ônibus direto de superfície (ou corrida curta) poupa o tempo de descer nas plataformas e subir escadas rolantes do metrô.`
      },
      shortSummary: `Ônibus Direto de Bairro (${distanceKm} km • ~18 min)`
    };
  }

  // Para distâncias médias/longas (> 3 km): Metrô é a escolha recomendada com preferência do usuário
  const legs: TransitLeg[] = [
    { type: 'walk', icon: '🚶', instruction: `Sair de ${siteA.nomeObra} e caminhar até ${stationA}`, durationMinutes: 6 },
    { type: 'metro', icon: '🚇', lineOrRoute: stationA, instruction: `Embarcar na rede sobre trilhos em direção ao corredor de ${siteB.nomeObra}`, durationMinutes: 16 },
    { type: 'transfer', icon: '🔄', lineOrRoute: 'Baldeação Metroferroviária', instruction: 'Integração na estação central nodal do Metrô', durationMinutes: 3 },
    { type: 'bus', icon: '🚌', lineOrRoute: 'Ônibus SPTrans / Conexão Metroferroviária', instruction: `Desembarque e trecho final de ônibus/trólebus até a parada de ${siteB.nomeObra}`, durationMinutes: 8 },
    { type: 'walk', icon: '🚶', instruction: `Caminhada final de 4 min até o portão de ${siteB.nomeObra}`, durationMinutes: 4 }
  ];

  return {
    fromSite: siteA.nomeObra,
    toSite: siteB.nomeObra,
    distanceKm,
    metroOption: {
      title: `Rede de Metrô (${stationA} ➔ ${stationB})`,
      totalMinutes: 37,
      steps: legs.map(l => `${l.icon} ${l.instruction} (~${l.durationMinutes} min)`),
      legs,
      advantageNote: 'Mais rápido e confiável: imune aos semáforos e lentidões dos eixos viários de superfície de SP.'
    },
    surfaceOption: {
      title: 'Ônibus Direto / Conexão por Linhas de Superfície SPTrans',
      durationMinutes: 52,
      steps: [
        `🚶 Caminhada até ponto de ônibus (~5 min)`,
        `🚌 Ônibus SPTrans cruzando a cidade (~40 min)`,
        `🚶 Caminhada final até ${siteB.nomeObra} (~7 min)`
      ],
      notes: 'Sujeito a congestionamentos nos cruzamentos e horários de pico.'
    },
    verdict: {
      recommendedMode: 'metro',
      title: 'Metrô é Mais Vantajoso (~15 min mais rápido)',
      explanation: `Como você dá preferência em andar de metrô, o trajeto via ${stationA} conectado a ${stationB} é a alternativa mais vantajosa. A previsibilidade dos trilhos assegura que você chegue no horário sem depender do trânsito de superfície.`
    },
    shortSummary: `Metrô ${stationA} ➔ ${stationB} (~37 min) [Preferência por Metrô • Mais previsível]`
  };
}
