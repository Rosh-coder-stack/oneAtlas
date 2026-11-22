import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  description,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5 border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80 transition-colors", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded",
              trend === "up" && "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50",
              trend === "down" && "bg-rose-950/80 text-rose-400 border border-rose-800/50",
              trend === "neutral" && "bg-slate-800 text-slate-300"
            )}
          >
            {trend === "up" && "↑ "}
            {trend === "down" && "↓ "}
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1.5 text-xs text-slate-500 leading-normal">
          {description}
        </p>
      )}
    </Card>
  );
}
