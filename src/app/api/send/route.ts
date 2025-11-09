import { NextRequest, NextResponse } from 'next/server';
import { sendEmailViaSMTP2GO } from '@/lib/smtp2go';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, html_body } = body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or body' },
        { status: 400 }
      );
    }

    // Send email via SMTP2GO
    const smtp2goResponse = await sendEmailViaSMTP2GO({
      to,
      subject,
      body: emailBody,
      html_body,
    });

    // Store the sent email in Supabase
    const senderEmail = process.env.SMTP2GO_SENDER_EMAIL || 'alias@fisica.cat';
    
    const { data, error } = await supabase
      .from('emails')
      .insert({
        from_email: senderEmail,
        to_email: to,
        subject: subject,
        body: emailBody,
        html_body: html_body || emailBody.replace(/\n/g, '<br>'),
        sent_at: new Date().toISOString(),
        type: 'outgoing',
        is_read: true, // Sent emails are considered "read"
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Email was sent but not stored - log this
      return NextResponse.json(
        { 
          success: true, 
          warning: 'Email sent but not stored in database',
          smtp2go_response: smtp2goResponse 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        email_id: data.id,
        smtp2go_response: smtp2goResponse 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: (error as Error).message },
      { status: 500 }
    );
  }
}
