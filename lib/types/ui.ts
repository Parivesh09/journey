export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "line";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export interface FormGroupProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export interface StampProps {
  tone: "neutral" | "valid" | "amber" | "stamp" | "red";
  children: React.ReactNode;
  className?: string;
}

export interface BubbleProps {
  filled: boolean;
  busy?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export interface SectionHeadProps {
  index: string;
  title: string;
  instruction?: string;
  aside?: string;
  className?: string;
}

export interface ProgressBarProps {
  value: number;
  className?: string;
}

export interface SheetProps {
  children: React.ReactNode;
  className?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export interface IconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

export interface SkeletonRowsProps {
  rows: number;
  className?: string;
}

export interface LoaderProps {
  label?: string;
  className?: string;
}

export interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export interface SecondaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "roadmap";
  className?: string;
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}