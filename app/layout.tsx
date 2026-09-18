import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BrowserReminderListener from "@/app/notifications/browser-listener";
import LogoutButton from "@/app/logout-button";
import { isAuthenticated } from "@/lib/auth";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const authenticated = await isAuthenticated();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {authenticated ? <LogoutButton /> : null}
        <BrowserReminderListener />
      </body>
    </html>
  );
}
