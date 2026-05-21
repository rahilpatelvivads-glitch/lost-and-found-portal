import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, Github, ShieldCheck } from "lucide-react";
import { Button, GlassCard } from "../components/ui/UI";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("Welcome back to CampusTrace!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from("users").insert([
            {
              id: data.user.id,
              name: formData.fullName,
              email: formData.email,
              role: "student"
            }
          ]);
        }

        toast.success("Account created! Please verify your email.");
      }
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[450px] relative z-10"
      >
        <GlassCard className="p-10 border-white/10 dark:border-slate-800 shadow-2xl relative overflow-hidden" hover={false}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-premium"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-premium rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              {isLogin ? <LogIn className="w-10 h-10 text-white" /> : <UserPlus className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-4xl font-black tracking-tighter dark:text-slate-100">
               {isLogin ? "Welcome Back" : "Claim your spot"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">
              {isLogin ? "Sign in to access the campus recovery network" : "Join thousands of students on CampusTrace"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="relative group"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 ml-4 mb-2 block">Full Collegiate Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 ml-4 mb-2 block">Collegiate Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="jane@university.edu"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 ml-4 mb-2 block">Ultra Secret Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <Button 
              variant="gradient" 
              className="w-full py-5 rounded-[1.5rem] mt-6" 
              disabled={loading}
              type="submit"
            >
              {loading ? "Authenticating..." : isLogin ? "Secure Login" : "Initialize Account"}
              {!loading && <ArrowRight className="w-5 h-5 ml-3" />}
            </Button>
          </form>

          <div className="mt-10 space-y-8">
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               Enterprise Security Guaranteed
            </div>

            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account yet?" : "Already part of the network?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-600 dark:text-blue-400 font-black hover:underline transition-all"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
