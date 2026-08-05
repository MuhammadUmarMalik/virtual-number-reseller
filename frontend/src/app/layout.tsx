import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { Providers } from "@/components/shared/providers";
import "./globals.css";

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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
