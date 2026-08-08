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
    <html lang="en">
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
