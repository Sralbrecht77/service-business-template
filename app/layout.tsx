import type { Metadata } from "next";
import { businessConfig } from "@/lib/business-config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${businessConfig.company.name} | Movers + Truck & Crew Only`,
  description:
    "Guidestone Moving Co offers Movers + Truck and Crew Only help for local and regional moves.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
