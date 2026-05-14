import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { createAuthedClient } from '@/lib/neon/client';
import { createForwardEmailDNS, updateForwardEmailDNS, listForwardEmailDNS, ensureForwardEmailMXRecords } from '@/lib/cloudflare';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { data: session, error: authError } = await auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: tokenData, error: tokenError } = await auth.token();

    if (!tokenData?.token || tokenError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbClient = createAuthedClient(tokenData.token);

    // Parse request body
    const body = await request.json();
    const { alias, forwardTo } = body;

    if (!forwardTo || typeof forwardTo !== 'string') {
      return NextResponse.json(
        { error: 'Forward to email is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(forwardTo)) {
      return NextResponse.json(
        { error: 'Invalid forward to email address' },
        { status: 400 }
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'Authenticated user email is missing' },
        { status: 500 }
      );
    }

    if (!alias || typeof alias !== 'string') {
      return NextResponse.json(
        { error: 'Invalid alias provided' },
        { status: 400 }
      );
    }

    // Keep the profile email in sync with the auth identity before provisioning DNS.
    const { error: profileUpdateError } = await dbClient
      .from('profiles')
      .update({
        email: session.user.email,
        forward_to: forwardTo,
      })
      .eq('id', session.user.id);

    if (profileUpdateError) {
      console.error('Failed to sync profile before DNS creation:', profileUpdateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileUpdateError.message },
        { status: 500 }
      );
    }

    // Create DNS record via Cloudflare API
    const result = await createForwardEmailDNS(alias, forwardTo);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create DNS record' },
        { status: 500 }
      );
    }

    const mxResult = await ensureForwardEmailMXRecords();

    if (!mxResult.success) {
      console.warn('ForwardEmail MX provisioning skipped or failed:', mxResult.error);
    }

    // Store DNS record ID in profiles table for future updates
    if (result.record?.id) {
      const { error: updateError } = await dbClient
        .from('profiles')
        .update({
          dns_record_id: result.record.id,
          forward_to: forwardTo,
          email: session.user.email,
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Failed to store dns_record_id:', updateError);
        // Don't fail the request, DNS was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      record: result.record,
      message: 'DNS record created successfully',
    });
  } catch (error) {
    console.error('Error in DNS API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// PATCH - Update existing DNS record
export async function PATCH(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { data: session, error: authError } = await auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: tokenData, error: tokenError } = await auth.token();

    if (!tokenData?.token || tokenError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbClient = createAuthedClient(tokenData.token);

    // Get user's profile with dns_record_id
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('alias, dns_record_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { forwardTo } = body;

    // If no dns_record_id, try to find it
    let recordId = profile.dns_record_id;
    
    if (!recordId) {
      console.log('No dns_record_id stored, searching for existing record...');
      const listResult = await listForwardEmailDNS();
      
      if (listResult.success && listResult.records) {
        const existingRecord = listResult.records.find(
          (record) => record.content.includes(`forward-email=${profile.alias}:`)
        );
        
        if (existingRecord?.id) {
          recordId = existingRecord.id;
          // Store it for future use
          await dbClient
            .from('profiles')
            .update({ dns_record_id: recordId })
            .eq('id', session.user.id);
        }
      }
    }

    if (!recordId) {
      return NextResponse.json(
        { error: 'No DNS record found. Please contact administrator.' },
        { status: 404 }
      );
    }

    // Update DNS record via Cloudflare API
    const result = await updateForwardEmailDNS(recordId, profile.alias, forwardTo);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update DNS record' },
        { status: 500 }
      );
    }

    const mxResult = await ensureForwardEmailMXRecords();

    if (!mxResult.success) {
      console.warn('ForwardEmail MX provisioning skipped or failed:', mxResult.error);
    }

    await dbClient
      .from('profiles')
      .update({ forward_to: forwardTo || null })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      message: forwardTo 
        ? 'DNS record updated with forwarding address' 
        : 'DNS record updated (forwarding removed)',
    });
  } catch (error) {
    console.error('Error in DNS PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
