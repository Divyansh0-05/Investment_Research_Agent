import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analyst — AI Investment Research Agent",
  description: "Give it a company name. It researches, scores, and decides: invest, watch, or pass.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
