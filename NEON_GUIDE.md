## Neon setup guide
1. Log In or Sign Up at https://console.neon.tech
2. Create a new project
3. In the sidebar go to the Auth page, enable Auth and then copy the Auth URL and JWKS URL, put them in you `.env.local` following the `.env.example` (remember to later on put them on Vercel as well).
   [IMAGE]
4. Also in the Auth page, add your domain (where the website will be published) as a trusted domain.
5. Now go to the Data API page and copy the API URL to the env file.
6. Now go to the dashboard of the project and click 'Connection String', then on the bottom of the pop-up click the show password button and copy the connection string. Paste it in the env file as well (as NEON_DATABASE_URL).
7. Finally ppen the SQL Editor, and paste there the contents of [`database-setup.sql`](./database-setup.sql) and then press Run.
  [IMAGE]
