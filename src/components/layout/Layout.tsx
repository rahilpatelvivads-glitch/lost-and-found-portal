import React from "react";
import Navbar from "./Navbar";
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" closeButton />
      <footer className="px-8 py-6 bg-slate-950 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 tracking-wide uppercase font-semibold">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <span>&copy; {new Date().getFullYear()} University Student Portal</span>
          <span className="w-1 h-1 rounded-full bg-slate-800 hidden md:block"></span>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Support Center</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Server Online
          </span>
          <span className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px] tracking-widest font-bold">v1.4.2</span>
        </div>
      </footer>
    </div>
  );
}
