import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://focusdesk.app"),
  title: {
    default:
      "FocusDesk — Free Aesthetic Study Tracker, Pomodoro Timer & Habit Planner",
    template: "%s | FocusDesk Study Tracker",
  },
  description:
    "Free, distraction-free aesthetic study tracker and Pomodoro timer. Track study hours, daily streaks, habits, milestone achievements, and ambient soundscapes.",
  keywords: [
    "study tracker",
    "aesthetic study tracker",
    "online study timer",
    "pomodoro timer with streak",
    "study tracker app free",
    "exam countdown tracker",
    "student productivity tracker",
    "study hours milestone tracker",
  ],
  authors: [{ name: "FocusDesk Team" }],
  openGraph: {
    title: "FocusDesk — Free Aesthetic Study Tracker & Pomodoro Timer",
    description:
      "Track study hours, daily streaks, exam countdowns, and aesthetic ambient sounds without distractions.",
    url: "https://focusdesk.app",
    siteName: "FocusDesk",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FocusDesk Aesthetic Study Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusDesk — Minimalist Study Tracker & Timer",
    description:
      "Track study hours, daily streaks, and study achievements with ambient soundscapes.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "taPuhwoWJwrsm9V2Wg80muNi5FrpxHG2-poPn7Bhy_g", 
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FocusDesk",
              applicationCategory: "EducationalApplication, Productivity",
              operatingSystem: "All",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Minimalist study tracker, Pomodoro timer, habit planner, and study achievement tracker for students.",
              featureList: [
                "Pomodoro & Stopwatch study timer",
                "Step-by-step hour milestone badges (1h to 1000h)",
                "Daily streak tracking with timezone reset",
                "Habit tracker & weekly study heatmaps",
                "Background ambient study sounds (Rain, Cafe, Lofi, White Noise)",
                "Exam countdown and study session scheduler",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased font-sans selection:bg-neutral-800 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
