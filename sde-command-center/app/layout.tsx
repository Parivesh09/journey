import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BrowserReminderListener from "@/app/notifications/browser-listener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SDE Command Center",
  description:
    "A focused workspace for planning and completing your SDE roadmap.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <BrowserReminderListener />
      </body>
    </html>
  );
}
