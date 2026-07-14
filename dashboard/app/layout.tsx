import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ReadingProgressBar from "@/app/components/ReadingProgressBar";
import GlowParticles from "@/app/components/GlowParticles";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QSS | The Hybrid Autopilot for Google Ads",
  description: "Automate and optimize your Google Ads campaigns with QSS. Stop wasting budget and start scaling winners automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReadingProgressBar />
        <GlowParticles />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
