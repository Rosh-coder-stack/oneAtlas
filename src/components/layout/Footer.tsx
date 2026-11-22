import * as React from "react";
import { Icons } from "@/components/ui/Icons";

export function Footer() {
  const techStack = [
    "Next.js App Router",
    "React 19",
    "TypeScript",
    "Tailwind CSS",
    "Node.js",
    "PostgreSQL",
    "Prisma ORM",
  ];

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <Icons.AtlasOrb className="h-6 w-6" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              OneAtlas &bull; AI Model Discovery & Intelligence
            </p>
            <p className="text-[11px] text-slate-500">
              Enterprise architecture for foundation models, open weights, and benchmark tracking.
            </p>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-end">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Operational</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            Node.js &bull; Clean Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
