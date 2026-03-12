import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      { url: "/logo/flow-frame-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/logo/flow-frame-light.png",
    apple: "/logo/flow-frame-light.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
