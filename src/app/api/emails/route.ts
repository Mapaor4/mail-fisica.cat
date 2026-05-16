import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { createAuthedClient } from '@/lib/neon/client';
import { sql } from '@/lib/neon/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: session, error: authError } = await auth.getSession();

    if (authError) {
      console.error('Auth error in emails GET:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tokenData, error: tokenError } = await auth.token();

    if (!tokenData?.token || tokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbClient = createAuthedClient(tokenData.token);

    console.log('Fetching emails for user:', session.user.id, session.user.email);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'incoming', 'outgoing', or null for all
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filtered by user_id (RLS will also enforce this)
    let query = dbClient
      .from('emails')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && (type === 'incoming' || type === 'outgoing')) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Neon error fetching emails:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        user_id: session.user.id,
        type: type
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch emails', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    console.log(`Found ${data?.length || 0} emails for user ${session.user.id}`);

    return NextResponse.json(
      { 
        success: true, 
        emails: data,
        total: count,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH endpoint to mark email as read
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: session, error: authError } = await auth.getSession();

    if (authError) {
      console.error('Auth error in emails PATCH:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_read } = body;

    if (!id || typeof is_read !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id and is_read (boolean)' },
        { status: 400 }
      );
    }

    const updatedRows = await sql`
      UPDATE public.emails
      SET is_read = ${is_read}
      WHERE id = ${id}
        AND user_id = ${session.user.id}
      RETURNING *
    `;

    const data = updatedRows[0];

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to update email', details: 'Email not found or not owned by current user' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, email: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
