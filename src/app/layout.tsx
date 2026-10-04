import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hausmanagement",
  description: "Task- und Projektmanagement-System für das Haus",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
