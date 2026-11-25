import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "YowYob Payment",
    template: "%s · YowYob Payment",
  },
  description:
    "Gérez votre wallet, vos paiements et vos abonnements YowYob en toute sécurité.",
  applicationName: "YowYob Payment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} yypay:h-full yypay:antialiased`}
    >
      <body className="yypay:min-h-full yypay:flex yypay:flex-col yypay:bg-background yypay:font-sans yypay:text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
