export const BACKUP_CATEGORIES: BackupCategory[] = ['ESCRIBA', 'CRIBA', 'INNOVAME', 'DISTANCIA 4.0'];

const CATEGORY_TOKENS = [
  { token: 'DISTANCIA 4.0', value: 'DISTANCIA 4.0' },
  { token: 'INNOVAME', value: 'INNOVAME' },
  { token: 'ESCRIBA', value: 'ESCRIBA' },
  { token: 'CRIBA', value: 'CRIBA' }
] as const;

const RECTORIAS = [
  'CENTRO SUR',
  'CENTRO NORTE',
  'CENTRO OCCIDENTE',
  'CENTRO ORIENTE',
  'CENTRO',
  'RECTORIA VIRTUAL',
  'RECTORIA NACIONAL'
];

const SEDES = [
  'NEIVA',
  'BOGOTA',
  'MEDELLIN',
  'PASTO',
  'PITALITO',
  'GARZON'
];

export type BackupCategory = 'ESCRIBA' | 'CRIBA' | 'INNOVAME' | 'DISTANCIA 4.0';

export interface NormalizedMetadata {
  category?: BackupCategory;
  programCode?: string;
  programName?: string;
  rectoria?: string;
  sede?: string;
  period?: string;
  year?: number;
}

const normalizeToken = (token: string) => token.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

export const normalizeMetadata = (fileName: string): NormalizedMetadata => {
  const baseName = fileName.replace(/\.mbz$/i, '');
  const normalized = normalizeToken(baseName);
  const upper = normalized.toUpperCase();

  let category: BackupCategory | undefined;
  for (const item of CATEGORY_TOKENS) {
    if (upper.includes(item.token)) {
      category = item.value;
      break;
    }
  }

  const codeMatch = upper.match(/\b[A-Z]{3,}[0-9]{2,}\b/);
  const programCode = codeMatch?.[0];

  const periodMatch = upper.match(/(20\d{2})\s*[-_]?\s*([1-2])/);
  const yearMatch = upper.match(/(20\d{2})/);

  const period = periodMatch ? `${periodMatch[1]}-${periodMatch[2]}` : undefined;
  const year = periodMatch ? Number(periodMatch[1]) : yearMatch ? Number(yearMatch[1]) : undefined;

  const rectoriaToken =
    RECTORIAS.find((item) => upper.includes(item)) ??
    RECTORIAS.find((item) => upper.includes(item.replace('RECTORIA ', '')));
  const rectoria = rectoriaToken ? toTitleCase(rectoriaToken.replace('RECTORIA ', '')) : undefined;
  const sedeToken = SEDES.find((item) => upper.includes(item));
  const sede = sedeToken ? toTitleCase(sedeToken) : undefined;

  const tokensToRemove = [category, programCode, rectoria, sede, period, year?.toString()]
    .filter(Boolean)
    .map((token) => token!.toString().toUpperCase());

  const remaining = normalized
    .split(' ')
    .filter((token) => {
      const upperToken = token.toUpperCase();
      return !tokensToRemove.some((removeToken) => removeToken.includes(upperToken) || upperToken.includes(removeToken));
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const programName = remaining.length > 4 ? remaining : undefined;

  return {
    category,
    programCode: programCode ?? undefined,
    programName: programName ? toTitleCase(programName) : undefined,
    rectoria,
    sede,
    period,
    year
  };
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(' ');
