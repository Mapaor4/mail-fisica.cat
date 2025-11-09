# fisica.cat Mail Dashboard

A minimalistic email dashboard for sending and receiving emails with custom domain integration.

## Features

- 📨 **Receive Emails**: Integration with ForwardEmail to receive emails at alias@fisica.cat
- 📤 **Send Emails**: Send emails via SMTP2GO API
- 💾 **Email Storage**: All emails stored in Supabase (free tier)
- 🎨 **Minimalistic UI**: Clean, modern interface built with Next.js and Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Database**: Supabase
- **Email Services**: 
  - ForwardEmail (receiving)
  - SMTP2GO (sending)
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to the SQL Editor and run the following SQL:

\`\`\`sql
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  html_body TEXT,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('incoming', 'outgoing')),
  attachments JSONB
);

CREATE INDEX idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX idx_emails_type ON emails(type);
CREATE INDEX idx_emails_is_read ON emails(is_read);
\`\`\`

4. Get your project URL and anon key from Settings > API

### 3. Configure SMTP2GO

1. Create an account at [smtp2go.com](https://smtp2go.com)
2. Get your API key from Settings > API Keys
3. Verify your sender domain or email address

### 4. Configure ForwardEmail

1. Set up ForwardEmail for your domain (fisica.cat)
2. Configure DNS records as per ForwardEmail instructions
3. Set up a webhook to point to: `https://yourdomain.com/api/webhooks/incomingMail`
4. Configure the alias: `alias@fisica.cat` to forward to the webhook

### 5. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMTP2GO Configuration
SMTP2GO_API_KEY=your_smtp2go_api_key
SMTP2GO_SENDER_EMAIL=alias@fisica.cat

# ForwardEmail Webhook Secret (optional)
FORWARD_EMAIL_WEBHOOK_SECRET=your_webhook_secret
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard.

## Project Structure

\`\`\`
mail-fisica.cat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── emails/         # Fetch and update emails
│   │   │   ├── send/           # Send emails via SMTP2GO
│   │   │   └── webhooks/
│   │   │       └── incomingMail/  # Webhook for ForwardEmail
│   │   ├── dashboard/
│   │   │   ├── inbox/          # Inbox page
│   │   │   ├── sent/           # Sent emails page
│   │   │   ├── compose/        # Compose new email
│   │   │   └── layout.tsx      # Dashboard layout
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Header.tsx          # Page header with actions
│   │   ├── EmailList.tsx       # List of emails
│   │   └── EmailDetail.tsx     # Email detail view
│   └── lib/
│       ├── supabase.ts         # Supabase client
│       ├── smtp2go.ts          # SMTP2GO integration
│       └── types.ts            # TypeScript types
├── .env.local                  # Environment variables
└── package.json
\`\`\`

## API Endpoints

### POST /api/webhooks/incomingMail
Webhook endpoint for receiving emails from ForwardEmail.

### POST /api/send
Send an email via SMTP2GO.

**Request Body:**
\`\`\`json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "Email body text"
}
\`\`\`

### GET /api/emails
Fetch emails from database.

**Query Parameters:**
- `type`: Filter by email type (`incoming`, `outgoing`)
- `limit`: Number of emails to fetch (default: 50)
- `offset`: Pagination offset (default: 0)

### PATCH /api/emails
Mark email as read/unread.

**Request Body:**
\`\`\`json
{
  "id": "email_uuid",
  "is_read": true
}
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Make sure to update your ForwardEmail webhook URL to your production domain.

## License

MIT
