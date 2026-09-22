import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import ToastContainer from "@/components/Toast";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowFrame | Distributed Systems Simulator",
  description:
    "Design architectures and simulate distributed request flow frame-by-frame.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlowFrame",
  },
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
                  var theme = 'light';
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
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          {children}
          <ToastContainer />
          <PWAInstallPrompt />
          <SessionExpiredModal />
        </TooltipProvider>
        <Analytics />
      </body>

      <GoogleAnalytics gaId="G-DZ9W53N39V" />
    </html>
  );
}
