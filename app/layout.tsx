import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redline — a schedule of flags for a document you can still change",
  description:
    "Redline inspects a negotiable document — a client agreement, statement of work, vendor or service agreement, or lease — and returns a numbered schedule of flags, ranked by the worst outcome each clause permits. Every flag quotes the sentence it came from.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
