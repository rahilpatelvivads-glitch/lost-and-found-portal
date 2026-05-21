import { cn } from "../../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true, ...props }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } } : {}}
      className={cn(
        "glass relative rounded-[2rem] transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
  onClick?: any;
  disabled?: boolean;
  type?: "submit" | "reset" | "button";
  id?: string;
}

export function Button({ 
  variant = "primary", 
  size = "md", 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20",
    gradient: "bg-gradient-premium text-white shadow-xl shadow-indigo-500/25 hover:opacity-90",
    secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100",
    outline: "border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-xs font-semibold",
    md: "px-6 py-2.5 text-sm font-semibold",
    lg: "px-8 py-3.5 text-base font-bold tracking-tight"
  };

  return (
    <button 
      className={cn(
        "rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
