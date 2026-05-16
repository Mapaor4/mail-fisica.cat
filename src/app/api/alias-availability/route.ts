import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/server';

function sanitizeAlias(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const alias = request.nextUrl.searchParams.get('alias')?.trim() || '';
    const sanitizedAlias = sanitizeAlias(alias);

    if (!sanitizedAlias || sanitizedAlias.length < 2) {
      return NextResponse.json(
        { available: false, error: 'Alias must be at least 2 characters' },
        { status: 400 }
      );
    }

    const existingProfiles = await sql`
      SELECT 1
      FROM public.profiles
      WHERE alias = ${sanitizedAlias}
      LIMIT 1
    `;

    const available = existingProfiles.length === 0;

    return NextResponse.json({
      available,
      alias: sanitizedAlias,
      message: available ? 'Alias is available' : 'Alias is already taken',
    });
  } catch (error) {
    console.error('Alias availability check failed:', error);
    return NextResponse.json(
      { available: false, error: 'Unable to check alias availability' },
      { status: 500 }
    );
  }
}