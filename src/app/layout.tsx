import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientThemeWrapper } from "@/components/ClientThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "ImageXpert - Advanced Image Processing Suite",
  description: "Professional image processing tools including resizing, compression, format conversion, filters, and collage creation. Built with modern web technologies.",
  keywords: "image resize, image compression, format conversion, image filters, collage maker, image processing",
  authors: [{ name: "Kedar", url: "https://kedar355.vercel.app/" }],
  robots: "index, follow",
  icons: {
    icon: '/logoo.png',
    shortcut: '/logoo.png',
    apple: '/logoo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased h-full`}>
        <ClientThemeWrapper>
          {children}
        </ClientThemeWrapper>
      </body>
    </html>
  );
}
