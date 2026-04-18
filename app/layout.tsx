import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.name,
  description: "Find gaming teammates, duo partners, and online friends fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[var(--bg)] text-[var(--text)] antialiased">
        <div aria-hidden="true" className="app-background" />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
