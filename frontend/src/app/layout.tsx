import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "DealFlow360 - Quotations | Q-1042",
  description: "Enterprise Commerce Quotation Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="bg-surface text-on-surface h-screen w-screen overflow-hidden flex flex-row antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
