import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { createAuthedClient } from '@/lib/neon/client';

export async function GET() {
  try {
    // Get authenticated user
    const { data: session, error: authError } = await auth.getSession();

    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 500 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: tokenData, error: tokenError } = await auth.token();

    if (!tokenData?.token || tokenError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbClient = createAuthedClient(tokenData.token);

    // Try to get profile
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      success: true,
      user_id: session.user.id,
      user_email: session.user.email,
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
