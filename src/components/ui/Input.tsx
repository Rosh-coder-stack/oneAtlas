import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 text-sm text-slate-100 placeholder:text-slate-500",
            "transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-10 pr-4" : "px-3.5",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
