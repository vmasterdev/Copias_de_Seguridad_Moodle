export interface BackupResult {
  id: string;
  file_name: string;
  category: 'ESCRIBA' | 'CRIBA' | 'INNOVAME' | 'DISTANCIA 4.0';
  program_code: string;
  program_name: string;
  rectoria: string;
  sede: string | null;
  period: string | null;
  year: number | null;
  size_bytes: number | null;
  checksum: string | null;
  created_at: string | null;
}

export interface SearchFacet {
  value: string;
  count: number;
  label?: string;
}

export interface SearchResponse {
  items: BackupResult[];
  total: number;
  facets: {
    categories: SearchFacet[];
    rectorias: SearchFacet[];
    sedes: SearchFacet[];
    periods: SearchFacet[];
    programs: SearchFacet[];
  };
}
