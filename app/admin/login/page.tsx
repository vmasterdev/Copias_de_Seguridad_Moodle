import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/login-form';

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Accede al panel</h1>
        <p className="text-sm text-slate-500">Usa tus credenciales institucionales para gestionar las copias.</p>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Cargando formulario…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
