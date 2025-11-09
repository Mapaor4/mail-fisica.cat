export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html_body?: string;
  received_at?: string;
  sent_at?: string;
  created_at: string;
  is_read: boolean;
  type: 'incoming' | 'outgoing';
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  html_body?: string;
}
