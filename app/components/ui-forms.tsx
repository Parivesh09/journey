"use client";

import type { ReactNode } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FormGroup({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="caption">{hint}</p>}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-primary", sizeClasses[size], className)}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-secondary", className)}
    >
      {children}
    </button>
  );
}

export function AccentButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-accent", className)}
    >
      {children}
    </button>
  );
}

export function TertiaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-tertiary", className)}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label className={cn("label", className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function Caption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("caption", className)}>{children}</p>;
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-border bg-muted/30", className)}
    >
      {children}
    </div>
  );
}
