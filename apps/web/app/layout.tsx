import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "USA Number Reseller",
  description: "Wallet-based virtual USA number purchasing platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
