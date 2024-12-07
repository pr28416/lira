import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/contexts/node-context";
import { FlowProvider } from "@/contexts/node-context";
import { Toaster } from "@/components/ui/toaster";

import { Roboto_Mono } from "next/font/google";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LiRA",
  description: "The open-source research assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <FlowProvider>{children}</FlowProvider>
        <Toaster />
      </body>
    </html>
  );
}
