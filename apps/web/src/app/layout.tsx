import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CommunityChatLazy } from "@/components/community-chat-lazy";
import { CookieConsent } from "@/components/cookie-consent";
import { FavoritesProvider } from "@/components/favorites-provider";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#05070c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "VladfsBET — Premier Online Casino & Sportsbook",
    template: "%s | VladfsBET",
  },
  description:
    "Full-scale online casino and global sportsbook platform featuring provably fair originals, Megaways slots, live dealer tables, and double-entry financial ledger architecture.",
  applicationName: "VladfsBET",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-mark.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vladfsbet.com",
    siteName: "VladfsBET",
    title: "VladfsBET — Premier Online Casino & Sportsbook",
    description:
      "Provably fair crypto originals, cinematic cascading slots, live roulette & blackjack, and global sports betting.",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "VladfsBET Luxury Casino",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VladfsBET — Premier Online Casino & Sportsbook",
    description: "Provably fair gaming, cascading slots, and sportsbook powered by double-entry ledger architecture.",
    images: ["/hero.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        <AuthProvider>
          <FavoritesProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <MobileNav />
            <CommunityChatLazy />
            <CookieConsent />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
