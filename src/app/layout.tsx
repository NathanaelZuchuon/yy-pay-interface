import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YowYob Payment",
  description:
    "Plateforme de paiement et abonnements IWM - wallet, transactions et services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} yypay:h-full yypay:antialiased`}
    >
      <body className="yypay:min-h-full yypay:flex yypay:flex-col yypay:font-sans">
        <Providers />
        {children}
      </body>
    </html>
  );
}
