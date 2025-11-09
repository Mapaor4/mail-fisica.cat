# Quick Start Guide - fisica.cat Mail Dashboard

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Environment Variables

Copy `.env.local` and fill in your credentials:

```bash
# Get these from supabase.com (free tier)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...

# Get this from smtp2go.com (free tier)
SMTP2GO_API_KEY=api-xxxxx
SMTP2GO_SENDER_EMAIL=alias@fisica.cat
```

### Step 2: Set Up Supabase Database

1. Go to your Supabase project → SQL Editor
2. Copy and paste the SQL from `src/lib/supabase.ts` (the commented section)
3. Run the query to create the `emails` table

### Step 3: Run the Application

```bash
npm run dev
```

Open http://localhost:3000 - you'll be redirected to the inbox!

### Step 4: Test Sending an Email

1. Click "Compose" in the sidebar
2. Fill in recipient, subject, and message
3. Click "Send Email"
4. Check the "Sent" folder to see your email

### Step 5: Set Up ForwardEmail (Production)

When you deploy to production:

1. Configure ForwardEmail for `fisica.cat` domain
2. Set up webhook URL: `https://your-domain.com/api/webhooks/incomingMail`
3. Configure alias: `alias@fisica.cat` → webhook
4. Test by sending an email to `alias@fisica.cat`

## 📁 File Structure Overview

```
Key Files:
├── src/app/api/
│   ├── emails/route.ts          ← Fetch/update emails
│   ├── send/route.ts            ← Send via SMTP2GO
│   └── webhooks/incomingMail/   ← Receive via ForwardEmail
├── src/app/dashboard/
│   ├── inbox/page.tsx           ← Inbox view
│   ├── sent/page.tsx            ← Sent emails
│   └── compose/page.tsx         ← Compose new email
├── src/components/              ← Reusable UI components
└── src/lib/                     ← Utilities & types
```

## 🎨 Features

✅ Inbox - View incoming emails
✅ Sent - View sent emails  
✅ Compose - Send new emails
✅ Mark as read/unread
✅ Email detail view
✅ Responsive design
✅ Loading states & error handling

## 🔧 Customization

### Change sender email
Edit `SMTP2GO_SENDER_EMAIL` in `.env.local`

### Adjust UI colors
Edit Tailwind classes in components (currently using blue theme)

### Add more features
- Search functionality
- Email filters
- Attachments support
- Rich text editor
- Email templates

## 🐛 Troubleshooting

**Emails not showing?**
- Check Supabase connection
- Verify table was created correctly
- Check browser console for errors

**Can't send emails?**
- Verify SMTP2GO API key
- Check sender email is verified in SMTP2GO
- Review API response in Network tab

**Webhook not receiving?**
- Ensure webhook URL is publicly accessible
- Check ForwardEmail configuration
- Test webhook with a tool like Postman

## 📚 Next Steps

1. Deploy to Vercel/Netlify
2. Set up custom domain
3. Configure ForwardEmail webhook
4. Add authentication if needed
5. Implement email search
6. Add file attachments support

For detailed setup, see `SETUP.md`
