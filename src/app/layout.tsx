import type { Metadata } from "next";
import { fontVariables } from "@/app/fonts/fonts";
import "./globals.css";

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
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
      </head>
      <body
        className={`${fontVariables} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
