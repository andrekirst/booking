import type { Metadata } from "next";
import HelpButton from "@/components/ui/HelpButton";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "@/contexts/ApiContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garten Buchungssystem",
  description: "Buchungsplattform für Familienübernachtungen im Garten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApiProvider>
          {children}
          <HelpButton topic="home" variant="full" position="fixed-bottom-right" />
        </ApiProvider>
      </body>
    </html>
  );
}
