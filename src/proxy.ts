import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/sign-in',
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sign-in|sign-up|api/auth|api/webhooks|api/verify-passphrase|api/send|api/dns|api/forwarding|api/users).*)',
  ],
};

/* ------ OLD VERSION ------- */
/*
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip ALL middleware logic for webhooks - let them through immediately
  if (pathname.startsWith('/api/webhooks')) {
    console.log('MIDDLEWARE: WEBHOOK REQUEST DETECTED');
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (
    !user &&
    !pathname.startsWith('/sign-in') &&
    !pathname.startsWith('/sign-up') &&
    !pathname.startsWith('/api/webhooks') && // Allow webhooks without auth
    !pathname.startsWith('/api/verify-passphrase') && // Allow passphrase verification during sign-up
    !pathname.startsWith('/api/supabase-keep-alive') // Allow keep-alive endpoint for cron jobs
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access sign-in/sign-up, redirect to dashboard
  if (
    user &&
    (pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard/inbox';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
*/


// --- OLD VERSION ---
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public files (public folder)
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };


// TODO: Implement proxy for Neon Database:
// import { auth } from '@/lib/auth/server';

// export default auth.middleware({
//   // Redirects unauthenticated users to sign-in page
//   loginUrl: '/auth/sign-in',
// });

// export const config = {
//   matcher: [
//     // Protected routes requiring authentication
//     '/account/:path*',
//   ],
// };
