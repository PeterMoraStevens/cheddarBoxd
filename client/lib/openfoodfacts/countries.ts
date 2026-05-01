const ISO_TO_COUNTRY: Record<string, string> = {
  US: 'united-states', GB: 'united-kingdom', FR: 'france', DE: 'germany',
  ES: 'spain',         IT: 'italy',          CA: 'canada', AU: 'australia',
  NL: 'netherlands',  BE: 'belgium',         CH: 'switzerland', AT: 'austria',
  JP: 'japan',         CN: 'china',           BR: 'brazil', MX: 'mexico',
  PL: 'poland',        SE: 'sweden',          DK: 'denmark', NO: 'norway',
  PT: 'portugal',      IE: 'ireland',         KR: 'south-korea',
}

export function detectCountryFromAcceptLanguage(header: string): string {
  for (const part of header.split(',')) {
    const locale = part.split(';')[0].trim()
    const region = locale.split('-')[1]?.toUpperCase()
    if (region && ISO_TO_COUNTRY[region]) return ISO_TO_COUNTRY[region]
  }
  return ''
}

export interface CountryOption {
  value: string
  label: string
  candidates: string[]
}

export const COUNTRIES: CountryOption[] = [
  {
    value: 'united-states',
    label: 'United States',
    candidates: [
      'United States', 'États-Unis', 'Vereinigte Staaten', 'Estados Unidos',
      'en:united-states', 'en:us', 'en:usa',
    ],
  },
  {
    value: 'france',
    label: 'France',
    candidates: [
      'France', 'Frankreich', 'França', 'Francia', 'Francie', 'Франция',
      'en:france', 'en:fr',
    ],
  },
  {
    value: 'germany',
    label: 'Germany',
    candidates: [
      'Germany', 'Deutschland', 'Allemagne', 'Alemania', 'Германия',
      'en:germany', 'en:de',
    ],
  },
  {
    value: 'united-kingdom',
    label: 'United Kingdom',
    candidates: [
      'United Kingdom', 'UK', 'Vereinigtes Königreich', 'Royaume-Uni',
      'Reino Unido', 'Verenigd Koninkrijk', 'Великобритания',
      'en:united-kingdom', 'en:gb', 'en:uk',
    ],
  },
  {
    value: 'spain',
    label: 'Spain',
    candidates: [
      'Spain', 'España', 'Espagne', 'Espanha', 'Spanien',
      'en:spain', 'en:es',
    ],
  },
  {
    value: 'italy',
    label: 'Italy',
    candidates: [
      'Italy', 'Italia', 'Italien', 'Italie', 'Itália',
      'en:italy', 'en:it',
    ],
  },
  {
    value: 'canada',
    label: 'Canada',
    candidates: [
      'Canada', 'Kanada',
      'en:canada', 'en:ca',
    ],
  },
  {
    value: 'australia',
    label: 'Australia',
    candidates: [
      'Australia', 'Australie', 'Australien',
      'en:australia', 'en:au',
    ],
  },
  {
    value: 'netherlands',
    label: 'Netherlands',
    candidates: [
      'Netherlands', 'Nederland', 'Niederlande', 'Pays-Bas', 'Países Bajos',
      'en:netherlands', 'en:nl',
    ],
  },
  {
    value: 'belgium',
    label: 'Belgium',
    candidates: [
      'Belgium', 'België', 'Belgique', 'Belgien', 'Belgio',
      'en:belgium', 'en:be',
    ],
  },
  {
    value: 'switzerland',
    label: 'Switzerland',
    candidates: [
      'Switzerland', 'Schweiz', 'Suisse', 'Svizzera', 'Suiza',
      'en:switzerland', 'en:ch',
    ],
  },
  {
    value: 'austria',
    label: 'Austria',
    candidates: [
      'Austria', 'Österreich', 'Autriche', 'Austria',
      'en:austria', 'en:at',
    ],
  },
  {
    value: 'japan',
    label: 'Japan',
    candidates: [
      'Japan', 'Japon', 'Japón', 'Japan', '日本',
      'en:japan', 'en:jp',
    ],
  },
  {
    value: 'china',
    label: 'China',
    candidates: [
      'China', 'Chine', 'Cina', '中国', '中國',
      'en:china', 'en:cn',
    ],
  },
  {
    value: 'brazil',
    label: 'Brazil',
    candidates: [
      'Brazil', 'Brasil', 'Brésil', 'Brasilien',
      'en:brazil', 'en:br',
    ],
  },
  {
    value: 'mexico',
    label: 'Mexico',
    candidates: [
      'Mexico', 'México', 'Mexique', 'Mexiko',
      'en:mexico', 'en:mx',
    ],
  },
  {
    value: 'poland',
    label: 'Poland',
    candidates: [
      'Poland', 'Polska', 'Polen', 'Pologne',
      'en:poland', 'en:pl',
    ],
  },
  {
    value: 'sweden',
    label: 'Sweden',
    candidates: [
      'Sweden', 'Sverige', 'Schweden', 'Suède',
      'en:sweden', 'en:se',
    ],
  },
  {
    value: 'denmark',
    label: 'Denmark',
    candidates: [
      'Denmark', 'Danmark', 'Dänemark', 'Danemark', 'Dinamarca',
      'en:denmark', 'en:dk',
    ],
  },
  {
    value: 'norway',
    label: 'Norway',
    candidates: [
      'Norway', 'Norge', 'Norwegen', 'Norvège',
      'en:norway', 'en:no',
    ],
  },
  {
    value: 'portugal',
    label: 'Portugal',
    candidates: [
      'Portugal',
      'en:portugal', 'en:pt',
    ],
  },
  {
    value: 'ireland',
    label: 'Ireland',
    candidates: [
      'Ireland', 'Irland', 'Irlande', 'Irlanda',
      'en:ireland', 'en:ie',
    ],
  },
  {
    value: 'south-korea',
    label: 'South Korea',
    candidates: [
      'South Korea', 'Korea', '한국', 'Südkorea', 'Corée du Sud',
      'en:south-korea', 'en:kr',
    ],
  },
]
