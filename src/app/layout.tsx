import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hyundai Iraq — Content Dashboard",
  description: "Manage cars, stories, banners and contact content.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the saved theme on the server so the correct mode renders with no flash.
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "";
  return (
    <html lang="en" className={`${inter.variable} ${theme}`.trim()}>
      <body>{children}</body>
    </html>
  );
}
