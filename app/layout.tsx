import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import ToastContainer from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowFrame | Distributed Systems Simulator",
  description:
    "Design architectures and simulate distributed request flow frame-by-frame.",
  icons: {
    icon: [
      { url: "/logo/flow-frame-dark.png" },
      {
        url: "/logo/flow-frame-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/logo/flow-frame-light.png",
    apple: "/logo/flow-frame-light.png",
  },
  verification: {
    google: "wGPEG09WnWZRHgiShZe_c3bTAi9hh8dr7JsLqIXb0Fg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('flowframe-theme');
                  var theme = 'dark';
                  if (raw) {
                    try {
                      var parsed = JSON.parse(raw);
                      if (parsed && parsed.state && parsed.state.theme) {
                        theme = parsed.state.theme;
                      } else if (raw === 'light' || raw === 'dark') {
                        theme = raw;
                      }
                    } catch (e) {
                      if (raw === 'light' || raw === 'dark') theme = raw;
                    }
                  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                    theme = 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        {children}
        <ToastContainer />
        <Analytics />
      </body>

      <GoogleAnalytics gaId="G-DZ9W53N39V" />
    </html>
  );
}
