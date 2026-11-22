"use client";

import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { SearchProvider } from "@/context/SearchContext";
import { ComparisonProvider } from "@/context/ComparisonContext";
import { ComparisonTray } from "@/components/modules/ComparisonTray";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <SearchProvider>
      <ComparisonProvider>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
          <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="flex-1 flex flex-row overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <main id="main-scroll-container" className="flex-1 flex flex-col overflow-y-auto min-w-0 scroll-smooth">
              <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto pb-24">
                {children}
              </div>
              <Footer />
            </main>
          </div>

          <ComparisonTray />
        </div>
      </ComparisonProvider>
    </SearchProvider>
  );
}
