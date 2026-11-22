import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "info" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full tracking-wide transition-colors";

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 leading-none",
    md: "text-xs px-2.5 py-0.5",
  };

  const variantStyles = {
    default:
      "bg-slate-800 text-slate-300 border border-slate-700/70",
    outline:
      "bg-transparent text-slate-300 border border-slate-700",
    success:
      "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50",
    warning:
      "bg-amber-950/60 text-amber-300 border border-amber-800/50",
    info:
      "bg-sky-950/60 text-sky-400 border border-sky-800/50",
    purple:
      "bg-purple-950/60 text-purple-300 border border-purple-800/50",
  };

  return (
    <span
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
