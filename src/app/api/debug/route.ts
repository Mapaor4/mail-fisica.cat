import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Try to get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user_id: user.id,
      user_email: user.email,
      profile_found: !!profile,
      profile_error: profileError?.message || null,
      profile_data: profile,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Exception',
      details: (error as Error).message
    }, { status: 500 });
  }
}
