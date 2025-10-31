export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string;
          code: string;
          name: string;
          rectoria: string;
          sede: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          rectoria: string;
          sede?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          rectoria?: string;
          sede?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      backups: {
        Row: {
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
          storage_key: string;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          file_name: string;
          category: 'ESCRIBA' | 'CRIBA' | 'INNOVAME' | 'DISTANCIA 4.0';
          program_code: string;
          program_name: string;
          rectoria: string;
          sede?: string | null;
          period?: string | null;
          year?: number | null;
          size_bytes?: number | null;
          checksum?: string | null;
          storage_key: string;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          file_name?: string;
          category?: 'ESCRIBA' | 'CRIBA' | 'INNOVAME' | 'DISTANCIA 4.0';
          program_code?: string;
          program_name?: string;
          rectoria?: string;
          sede?: string | null;
          period?: string | null;
          year?: number | null;
          size_bytes?: number | null;
          checksum?: string | null;
          storage_key?: string;
          created_by?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backups_program_code_fkey';
            columns: ['program_code'];
            referencedRelation: 'programs';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'backups_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      search_backups: {
        Args: {
          p_search?: string | null;
          p_category?: Database['public']['Tables']['backups']['Row']['category'] | null;
          p_rectoria?: string | null;
          p_sede?: string | null;
          p_program_code?: string | null;
          p_period?: string | null;
          p_year?: number | null;
          p_page?: number;
          p_page_size?: number;
          p_similarity_threshold?: number;
        };
        Returns: Json;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
