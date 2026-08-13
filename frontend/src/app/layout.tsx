import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { Providers } from "@/components/shared/providers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--body",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Number Reseller",
  description: "Buy virtual numbers and receive OTPs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
