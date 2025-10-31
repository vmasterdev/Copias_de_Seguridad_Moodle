import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

async function main() {
  const supabase = createServiceRoleClient();

  const programs: Database['public']['Tables']['programs']['Insert'][] = [
    {
      code: 'VDEDI013',
      name: 'Administración de Empresas',
      rectoria: 'Centro Sur',
      sede: 'Neiva'
    },
    {
      code: 'VDTEC045',
      name: 'Ingeniería de Sistemas',
      rectoria: 'Centro Norte',
      sede: 'Bogotá'
    },
    {
      code: 'VDFOR021',
      name: 'Formación Docente Virtual',
      rectoria: 'Rectoria Virtual',
      sede: null
    },
    {
      code: 'VDSAL033',
      name: 'Salud Ocupacional',
      rectoria: 'Centro Oriente',
      sede: 'Pasto'
    },
    {
      code: 'VDAGR010',
      name: 'Agronegocios Inteligentes',
      rectoria: 'Centro Occidente',
      sede: 'Medellín'
    }
  ];

  const { error: programError } = await supabase.from('programs').upsert(programs, { onConflict: 'code' });
  if (programError) {
    throw programError;
  }

  const backups: Database['public']['Tables']['backups']['Insert'][] = [
    {
      file_name: 'ESCRIBA-AdministracionEmpresas-2024-1.mbz',
      category: 'ESCRIBA',
      program_code: 'VDEDI013',
      program_name: 'Administración de Empresas',
      rectoria: 'Centro Sur',
      sede: 'Neiva',
      period: '2024-1',
      year: 2024,
      size_bytes: 45_678_912,
      checksum: 'd41d8cd98f00b204e9800998ecf8427e',
      storage_key: 'seed/escriba-admon-2024-1.mbz'
    },
    {
      file_name: 'INNOVAME-IngenieriaSistemas-2024-2.mbz',
      category: 'INNOVAME',
      program_code: 'VDTEC045',
      program_name: 'Ingeniería de Sistemas',
      rectoria: 'Centro Norte',
      sede: 'Bogotá',
      period: '2024-2',
      year: 2024,
      size_bytes: 61_234_567,
      checksum: '2fd4e1c67a2d28fced849ee1bb76e739',
      storage_key: 'seed/innovame-sistemas-2024-2.mbz'
    },
    {
      file_name: 'CRIBA-Formacion-Docente-2023-2.mbz',
      category: 'CRIBA',
      program_code: 'VDFOR021',
      program_name: 'Formación Docente Virtual',
      rectoria: 'Rectoria Virtual',
      sede: null,
      period: '2023-2',
      year: 2023,
      size_bytes: 38_901_222,
      checksum: '9b74c9897bac770ffc029102a200c5de',
      storage_key: 'seed/criba-formacion-2023-2.mbz'
    },
    {
      file_name: 'DISTANCIA-4.0-SaludOcupacional-2024-1.mbz',
      category: 'DISTANCIA 4.0',
      program_code: 'VDSAL033',
      program_name: 'Salud Ocupacional',
      rectoria: 'Centro Oriente',
      sede: 'Pasto',
      period: '2024-1',
      year: 2024,
      size_bytes: 52_345_678,
      checksum: '4a7d1ed414474e4033ac29ccb8653d9b',
      storage_key: 'seed/distancia-salud-2024-1.mbz'
    },
    {
      file_name: 'ESCRIBA-Agronegocios-2023-1.mbz',
      category: 'ESCRIBA',
      program_code: 'VDAGR010',
      program_name: 'Agronegocios Inteligentes',
      rectoria: 'Centro Occidente',
      sede: 'Medellín',
      period: '2023-1',
      year: 2023,
      size_bytes: 47_890_111,
      checksum: '5f4dcc3b5aa765d61d8327deb882cf99',
      storage_key: 'seed/escriba-agronegocios-2023-1.mbz'
    }
  ];

  await supabase.from('backups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: backupError } = await supabase.from('backups').insert(backups);
  if (backupError) {
    throw backupError;
  }

  console.log('Seed completado');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
