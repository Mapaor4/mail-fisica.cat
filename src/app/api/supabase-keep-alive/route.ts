import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/server';

/**
 * Keep-alive endpoint for Neon
 * No authentication required - safe for cron jobs
 * Only returns a count, no sensitive data leaked
 */
export async function GET() {
  try {
    const result = await sql`SELECT COUNT(*)::int AS count FROM public.profiles`;
    const count = result[0]?.count ?? 0;
    
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      profiles_count: count
    });
  } catch (error) {
    console.error('Keep-alive exception:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}