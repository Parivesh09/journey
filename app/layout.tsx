import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import BrowserReminderListener from "@/app/notifications/browser-listener";
import { ReduxProvider } from "./ReduxProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ReduxProvider>
          {children}
          <BrowserReminderListener />
        </ReduxProvider>
      </body>
    </html>
  );
}