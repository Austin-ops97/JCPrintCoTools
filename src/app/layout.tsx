import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JC Print Co Tools",
  description: "Modern tool suite for small shirt printing businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
