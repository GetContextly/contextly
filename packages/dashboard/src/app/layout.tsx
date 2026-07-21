import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { NavbarVisibility } from "@/components/NavbarVisibility";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contextly — Persistent Memory for AI Coding Agents",
  description:
    "Contextly gives Claude Code, Cursor, and GitHub Copilot a living project brief — auto-updated from git — so you never lose context when switching AI tools.",
  openGraph: {
    title: "Contextly — Persistent Memory for AI Coding Agents",
    description:
      "Contextly gives Claude Code, Cursor, and GitHub Copilot a living project brief — auto-updated from git — so you never lose context when switching AI tools.",
    images: ["/assets/og-image.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${bricolage.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col text-white">
        <NavbarVisibility />
        {children}
      </body>
    </html>
  );
}
