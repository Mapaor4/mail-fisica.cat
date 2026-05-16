## Overview

A minimalistic, modern email dashboard for sending and receiving mail at a custom domain for Free. Using SMTP2GO, ForwardEmail, Neon Database and Cloudflare.

![](/public/screenshots/inbox.png)

<details>
<summary>More screenshots</summary>

![](/public/screenshots/compose.png)

![](/public/screenshots/user-management.png)

![](/public/screenshots/monitor.png)

![](/public/screenshots/settings.png)

![](/public/screenshots/login.png)

![](/public/screenshots/signup.png)

All pages have a dark mode available as well.

![](/public/screenshots/singin-dark.png)

![](/public/screenshots/sent-dark.png)

</details>

### Features

- Multi-user authentication
- Receive emails at alias@yourdomain.com (and optionally forward them to your personal Gmail, Outlook, etc. inboxes)
- Send emails from your domain manually using SMTP2GO (alias@yourdomain.com).
- If you want you can still send automated emails from a subdomain (alias@mg.yourdomain.com)
- Role-based access (admin or user roles)
- Row Level Security (users only see their own emails)
- Admin dashboard for user management (delete users and their DNS records)
- Dark mode available
- Nice minimalistic UI and refresh buttons for real-time updates.

### Tech used

- Next.js 16 (with App Router), Tailwind CSS and Typescript.
- PostgreSQL with RLS and authentication (managed via Neon and Neon Auth).
- ForwardEmail for receiving emails (and forwarding them to other mail addressed and webhooks endpoints).
- SMTP2GO for sending emails manually
- (Optionally) Mailgun for sending automated emails.
- Cloudflare dashboard and Cloudflare API for managing DNS

### Context

If you have a domain, you can send and receive mails at your domain for free! There are multiple ways of doing that, one would be to set up your own mail server (self-hosted options like Postfix or similar), the problem is that is hard to achieve and maintain good email reputation for your domain and server IP. Another option would be to use Zoho or other mail providers, but their free tier, as generous as it is, is normally limited to a specific number of accounts (or aliases) and lot's of features (like email routing, webhooks, etc.) are only available as paid plans.

Then what does this repository do? It uses already existing and popular services like ForwardEmail (for receiving emails) SMPT2GO (for sending emails), Cloudflare (for managing DNS), Vercel (for hosting the NextJS web app) or Supabase (for hosting the database), allowing for a totally customizable email dashboard for sending and receiving emails at your apex domain.

## Getting Started

### 1. Clone and Install

Use GitHub Desktop or Git via terminal:
```bash
git clone https://github.com/Mapaor/mail-for-custom-domain.git
mv mail-for-custom-domain your-repo-name
cd your-repo-name
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your domain info.

```bash
# Domain info
NEXT_PUBLIC_APEX_DOMAIN=example.com
NEXT_PUBLIC_SITE_URL=https://mail.example.com

# SMTP2GO Configuration
SMTP2GO_API_KEY=your_smtp2go_api_key

# Cloudflare API Configuration
ALLOW_AUTO_REGISTER=TRUE
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
CLOUDFLARE_API_KEY=your_cloudflare_api_key

# Neon Database
NEON_AUTH_BASE_URL=https://your-neon-project.neonauth.c-3.eu-central-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=sFYTmdwOcjQjOWZ31mTusK6qp0ORadCEXPJuijODekk=
NEON_DATA_API_URL=https://your-neon-project.apirest.c-3.eu-central-1.aws.neon.tech/neondb/rest/v1
NEON_JWKS_URL=https://your-neon-project.neonauth.c-3.eu-central-1.aws.neon.tech/neondb/auth/.well-known/jwks.json
# Connection string (also called Database URL)
NEON_DATABASE_URL='postgresql://neondb_owner:npg_lx9uM0SgKDis@your-neon-project-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

You can get your environment variables for Neon, Neon Auth and Cloudflare in `NEON_GUIDE.md` and `CLOUDFLARE_GUIDE.md`.

### Promoting an Admin

New users get the `role` set to `user` by default. If you need to grant admin privileges to an existing user you must promote it manually using the Neon console. Run the following `SQL Editor` tab, replacing `<user-id>` with the user's UUID (you can find it in the `Tables` tab):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<user-id>';
```

After running the query the user will have access to admin-only features such as the User Management and Webhook Monitor pages.


## Run locally (development)

```bash
npm install
npm run dev
```
And open [http://localhost:3000](http://localhost:3000) (or similar) to see the website.

## Deploying on Vercel
First check the code can run in production with no errors:
```bash
npm run build
npm start
```
Then deploy it.

1. Push to GitHub (via GitHub Desktop or `git push`)
2. Import project in Vercel
3. Add environment variables
4. Click 'Deploy'
5. Add your custom subdomain [mail.example.com](mail.example.com) to the deployed Vercel project

Now every time a commit gets pushed to GitHub, Vercel will automatically redeploy the site.

## Questions
If you have any questions contact me at [marti@fisica.cat](mailto:marti@fisica.cat) ;)


## License

MIT License
