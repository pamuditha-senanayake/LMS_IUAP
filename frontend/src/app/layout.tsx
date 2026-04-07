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
  title: "IUAP CORE",
  description: "Modern campus and institutional management platform",
  icons: {
    icon: "/brand-icon.ico",
  },
};

import { GoogleOAuthProvider } from "@react-oauth/google";

import FetchInterceptor from "@/components/FetchInterceptor";

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_CLIENT_ID";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}
    >
      <body className="min-h-screen flex flex-col bg-[#020617] text-slate-200 overflow-x-hidden">
        <FetchInterceptor />
        <GoogleOAuthProvider clientId={clientId}>
          <Navbar />
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
