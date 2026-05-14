import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

// This single instance provides all server-side auth functionality:
// - `.handler()` for API routes
// - `.middleware()` for route protection
// - `.getSession()` and all Better Auth server methods
// See the [Next.js Server SDK reference](https://neon.com/docs/auth/reference/nextjs-server) for complete API documentation.