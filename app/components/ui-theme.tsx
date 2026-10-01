"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function GearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10a10 10 0 0 0-10-10zm0 5a3 3 0 1 1 0 6 3 3 0 0 1-6 0z" />
    </svg>
  );
}

export function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    const current = document.documentElement.getAttribute("data-theme") || saved;
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch {}
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          "p-2 rounded-lg transition-all duration-fast",
          "hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        aria-label="Switch theme"
        title="Switch theme"
        disabled
      >
        <span className="block transition-transform duration-200 ease-out">
          <SunIcon />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-all duration-fast",
        "hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="block transition-transform duration-200 ease-out">
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
