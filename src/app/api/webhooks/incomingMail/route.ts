import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming email from ForwardEmail webhook
    const body = await request.json();
    
    // ForwardEmail sends the email data in the webhook
    // Adjust the field names based on ForwardEmail's actual webhook format
    const {
      from,
      to,
      subject,
      text,
      html,
      attachments = [],
    } = body;

    // Validate required fields
    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, or subject' },
        { status: 400 }
      );
    }

    // Store the email in Supabase
    const { data, error } = await supabase
      .from('emails')
      .insert({
        from_email: from,
        to_email: to,
        subject: subject,
        body: text || '',
        html_body: html || '',
        received_at: new Date().toISOString(),
        type: 'incoming',
        is_read: false,
        attachments: attachments.map((att: { filename?: string; name?: string; contentType?: string; type?: string; size?: number }) => ({
          filename: att.filename || att.name || 'unknown',
          content_type: att.contentType || att.type || 'application/octet-stream',
          size: att.size || 0,
        })),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, email_id: data.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
