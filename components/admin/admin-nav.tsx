'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/components/providers';

const NAV_ITEMS = [
  { href: '/admin/uploads', label: 'Subidas' },
  { href: '/admin/backups', label: 'Catálogo' }
];

export const AdminNav = () => {
  const pathname = usePathname();
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Panel administrativo</h2>
        <p className="text-sm text-slate-500">Gestiona copias, metadatos y prefirmados.</p>
      </div>
      <nav className="flex items-center gap-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'text-sm font-medium text-slate-600 hover:text-brand-600',
              pathname === item.href && 'text-brand-600'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{session?.user.email}</span>
        <Button variant="secondary" onClick={handleSignOut} className="inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Salir
        </Button>
      </div>
    </div>
  );
};
