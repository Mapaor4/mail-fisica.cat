import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Keep-alive endpoint for Supabase
 * No authentication required - safe for cron jobs
 * Only returns a count, no sensitive data leaked
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Count query with head: true returns only count metadata, no actual data
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Keep-alive error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: error.message 
        },
        { status: 500 }
      );
    }
    
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