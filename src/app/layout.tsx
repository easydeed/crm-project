import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// The marketing page's serif. Not preloaded: nothing in the app uses it.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: "onrecord",
  description: "A monthly email about a past client's house, from the county record.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
