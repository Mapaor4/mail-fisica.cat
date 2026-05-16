import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { createAuthedClient } from '@/lib/neon/client';
import { sql } from '@/lib/neon/server';

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'example.com';

// Ensure this route can handle POST requests
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use service role for webhooks (no user auth required)
// GET endpoint to monitor recent webhook deliveries (admin only)
export async function GET(request: NextRequest) {
  console.log('GET request to webhook endpoint');
  try {
    // Authenticate user for GET requests
    const { data: session } = await auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tokenData, error: tokenError } = await auth.token();

    if (!tokenData?.token || tokenError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authedDb = createAuthedClient(tokenData.token);

    // Check if user is admin
    const { data: profile, error: profileError } = await authedDb
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch recent incoming emails as webhook logs
    const data = await sql`
      SELECT *
      FROM public.emails
      WHERE type = 'incoming'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch webhook logs' },
        { status: 500 }
      );
    }

    type WebhookEmail = {
      id: string | number;
      from_email: string;
      to_email: string;
      subject: string;
      received_at?: string | null;
      created_at: string;
      body?: string | null;
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Recent webhook deliveries (incoming emails)',
        count: data.length,
        webhooks: (data as WebhookEmail[]).map((email) => ({
          id: email.id,
          from: email.from_email,
          to: email.to_email,
          subject: email.subject,
          received_at: email.received_at || email.created_at,
          body_preview: email.body ? `${email.body.substring(0, 100)}...` : '',
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('='.repeat(80));
  console.log(`WEBHOOK POST RECEIVED - ${timestamp}`);
  console.log(`Request ID: ${requestId}`);
  console.log('='.repeat(80));
  
  try {
    // Log EVERYTHING about the request first
    const url = request.url;
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Read the body
    const rawBody = await request.text();
    console.log('Body Length:', rawBody.length);
    console.log('Raw Body:', rawBody.substring(0, 1000)); // First 1000 chars
    
    // Try to parse body
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('Body is valid JSON');
      console.log('Parsed Body:', JSON.stringify(parsedBody, null, 2));
    } catch {
      console.log('Body is not JSON');
      parsedBody = { raw: rawBody };
    }
    
    console.log('='.repeat(80));
    console.log('Environment Check:');
    console.log('- Database URL exists:', !!process.env.DATABASE_URL);
    console.log('='.repeat(80));
    console.log('Neon SQL client ready');
    
    // Now process the parsed body
    const body = parsedBody;

    // Extract email fields from ForwardEmail's format
    // ForwardEmail sends: { from: { value: [{ address, name }], text }, recipients: [...], text, html, ... }
    let fromEmail = 'unknown@example.com';
    
    if (body.from?.value && Array.isArray(body.from.value) && body.from.value.length > 0) {
      fromEmail = body.from.value[0].address || fromEmail;
    } else if (body.from?.text) {
      fromEmail = body.from.text;
    } else if (typeof body.from === 'string') {
      fromEmail = body.from;
    } else if (body.session?.sender) {
      fromEmail = body.session.sender;
    }

    // Get recipient from recipients array or session
    let toEmail = `alias@${APEX_DOMAIN}`;
    if (body.recipients && Array.isArray(body.recipients) && body.recipients.length > 0) {
      toEmail = body.recipients[0];
    } else if (body.session?.recipient) {
      toEmail = body.session.recipient;
    } else if (body.to) {
      toEmail = typeof body.to === 'string' ? body.to : body.to.text || body.to.value?.[0]?.address;
    }

    const subject = body.subject || '(No Subject)';
    const text = body.text || body.textAsHtml || '';
    const html = body.html || body.textAsHtml || '';
    const attachments = body.attachments || [];

    // Log extracted fields for debugging
    // console.log('Extracted fields:', { fromEmail, toEmail, subject, hasText: !!text, hasHtml: !!html });

    // Validate required fields
    if (!fromEmail || !toEmail) {
      console.error('Missing required fields:', { fromEmail, toEmail });
      return NextResponse.json(
        { 
          error: 'Missing required fields: from or to',
          received: { fromEmail, toEmail, subject },
          hint: 'Check ForwardEmail webhook documentation for correct field names'
        },
        { status: 400 }
      );
    }

    // Build normalized recipients list (handle multiple formats)
    let recipients: string[] = [];
    if (body.recipients && Array.isArray(body.recipients) && body.recipients.length > 0) {
      recipients = body.recipients.slice();
    } else if (body.to?.value && Array.isArray(body.to.value)) {
      recipients = body.to.value.map((v: { address?: string }) => v.address).filter(Boolean) as string[];
    } else if (body.session?.recipient) {
      recipients = [body.session.recipient];
    } else if (typeof body.to === 'string') {
      recipients = body.to.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else {
      recipients = [toEmail];
    }

    // Deduplicate and normalize
    recipients = Array.from(new Set(recipients.map((r: string) => r.toLowerCase())));

    // console.log('Resolved recipients:', recipients);

    // Prepare inserts for all found users; track misses
    const inserts: Array<Record<string, unknown>> = [];
    const missed: string[] = [];

    for (const rec of recipients) {
      try {
        const alias = String(rec).split('@')[0];
        // console.log('Looking up profile for alias:', alias);

        // Use maybeSingle() to avoid PGRST116 when no rows
        const profiles = await sql`
          SELECT id, alias, email, forward_to
          FROM public.profiles
          WHERE alias = ${alias}
          LIMIT 1
        `;
        const profile = profiles[0] as { id: string; alias: string; email: string; forward_to: string | null } | undefined;

        if (!profile) {
          console.warn('⚠️ No profile found for alias:', alias);
          missed.push(rec);
          continue;
        }

        // console.log('Found profile:', { id: profile.id, alias: profile.alias, email: profile.email });

        inserts.push({
          user_id: profile.id,
          from_email: fromEmail,
          to_email: rec,
          subject,
          body: text,
          html_body: html,
          received_at: new Date().toISOString(),
          type: 'incoming',
          is_read: false,
          message_id: body.messageId || body.message_id || null,
          attachments: attachments.map((att: { filename?: string; name?: string; contentType?: string; type?: string; size?: number }) => ({
            filename: att.filename || att.name || 'unknown',
            content_type: att.contentType || att.type || 'application/octet-stream',
            size: att.size || 0,
          })),
          metadata: {
            raw_webhook: body,
            received_timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('💥 Unexpected error processing recipient', rec, err);
        missed.push(rec);
        continue;
      }
    }

    if (inserts.length === 0) {
      console.error('❌ No recipients matched any user. Missed:', missed);
      return NextResponse.json(
        {
          error: 'No recipient matched',
          missed,
        },
        { status: 404 }
      );
    }

    // Insert one or many email rows in a single call
    type InsertedRow = { id: string | number; user_id: string | number; to_email: string };
    const created: InsertedRow[] = [];

    for (const insert of inserts) {
      const [row] = await sql`
        INSERT INTO public.emails (
          user_id,
          from_email,
          to_email,
          subject,
          body,
          html_body,
          received_at,
          type,
          is_read,
          message_id,
          attachments,
          metadata
        ) VALUES (
          ${insert.user_id},
          ${insert.from_email},
          ${insert.to_email},
          ${insert.subject},
          ${insert.body},
          ${insert.html_body},
          ${insert.received_at},
          ${insert.type},
          ${insert.is_read},
          ${insert.message_id},
          ${JSON.stringify(insert.attachments)}::jsonb,
          ${JSON.stringify(insert.metadata)}::jsonb
        )
        RETURNING id, user_id, to_email
      `;
      if (row) {
        created.push(row as InsertedRow);
      }
    }

    return NextResponse.json(
      {
        success: true,
        created_count: created.length,
        created,
        missed,
        message: 'Email(s) received and stored successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('='.repeat(80));
    console.error('💥 WEBHOOK ERROR');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('='.repeat(80));
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}
