import type { Metadata } from "next";
import { businessConfig } from "@/lib/business-config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${businessConfig.company.name} | Moving Crew + Truck Services`,
  description: businessConfig.hero.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
