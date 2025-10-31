import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { createRouteSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const isLogin = request.nextUrl.pathname === '/admin/login';

  let isAdmin = isAdminSession(session);

  if (session && !isAdmin) {
    try {
      const adminClient = createServiceRoleClient();
      const {
        data: userData,
        error: adminError
      } = await adminClient.auth.admin.getUserById(session.user.id);

      if (adminError) {
        console.error('Supabase admin.getUserById error', adminError);
      }

      const role =
        (userData?.user?.app_metadata as { app_role?: string } | undefined)?.app_role ??
        (userData?.user?.user_metadata as { app_role?: string } | undefined)?.app_role ??
        null;
      if (role === 'admin') {
        isAdmin = true;
      }
    } catch (error) {
      console.error('Error verificando rol admin', error);
    }
  }

  if (!session && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return applyCookieMutations(NextResponse.redirect(redirectUrl));
  }

  if (session && !isAdmin) {
    await supabase.auth.signOut();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.delete('redirectTo');
    redirectUrl.searchParams.set('error', 'unauthorized');
    return applyCookieMutations(NextResponse.redirect(redirectUrl));
  }

  if (session && isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/uploads';
    redirectUrl.searchParams.delete('redirectTo');
    return applyCookieMutations(NextResponse.redirect(redirectUrl));
  }

  return applyCookieMutations(response);
}

export const config = {
  matcher: ['/admin/:path*']
};
