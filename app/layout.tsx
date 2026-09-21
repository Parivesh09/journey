import type { Metadata } from "next";
import { Archivo, Roboto_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import BrowserReminderListener from "@/app/notifications/browser-listener";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SDE Command Center",
  description: "A focused workspace for planning and completing your SDE roadmap.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const theme = user?.theme === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${archivo.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <BrowserReminderListener />
      </body>
    </html>
  );
}