import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Metadata } from "next";

const siteDomain = process.env.NEXT_PUBLIC_APEX_DOMAIN || "example.com";
const siteName =  "Correu electrònic — " + siteDomain;
const siteDescription = "Aquesta pàgina web és la plataforma de correu electrònic pel domini fisica.cat. Permet enviar i rebre correus, amb il·limitats nombres d'usuaris, rols d'administrador i molt més. Fet possible gràcia a ForwardEmail, SMTP2GO, Supabase, Vercel i Cloudflare.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mail.example.com";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "es_CA",
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/logo/og-image.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/logo/og-image.png"],
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="canonical" href={siteUrl} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
