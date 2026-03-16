import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://walletroast.fun"
  ),
  title: "Wallet Roaster — Get Your On-Chain History Dragged by AI",
  description:
    "Pay 0.01 SOL to get your Solana wallet roasted by AI. Every fee buys back $TOKEN.",
  openGraph: {
    title: "Wallet Roaster",
    description:
      "Pay 0.01 SOL to get your on-chain history dragged by AI. Every fee buys back $TOKEN.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallet Roaster",
    description: "Pay 0.01 SOL to get your on-chain history dragged by AI.",
    images: ["/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
