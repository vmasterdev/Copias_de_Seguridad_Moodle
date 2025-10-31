'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/components/providers';

interface LoginFields {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const errorParam = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFields>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setErrorMessage('Tu cuenta no tiene acceso al panel administrativo.');
    }
  }, [errorParam]);

  const onSubmit = async (values: LoginFields) => {
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(redirectTo || '/admin/uploads');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="usuario@institucion.edu"
            className="border-0 p-0"
            {...register('email', { required: 'Ingresa tu correo' })}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Lock className="h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="border-0 p-0"
            {...register('password', { required: 'Ingresa tu contraseña' })}
          />
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
      </Button>
    </form>
  );
};
