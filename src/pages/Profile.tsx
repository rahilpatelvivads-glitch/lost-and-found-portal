import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, Mail, Calendar, Shield, LogOut, Check, Save, 
  Settings as SettingsIcon, BadgeCheck, Sun, Moon, Sparkles, ArrowLeft
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { GlassCard, Button } from "../components/ui/UI";
import { useTheme } from "../components/ThemeProvider";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Fetch from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setFullName(profileData.display_name || profileData.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || "");
      } else {
        setFullName(user.user_metadata?.display_name || user.email?.split('@')[0] || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          display_name: fullName,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 2. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: fullName }
      });

      if (authError) throw authError;

      toast.success("Profile saved successfully");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save profile modifications");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const joinDate = user.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Recently joined';

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-4xl mx-auto px-4 relative">
      {/* Background visual accents */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

      {/* Header */}
      <section className="space-y-4 mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Campus
        </Link>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h1 className="text-4xl font-black tracking-tighter dark:text-white leading-none">
                My <span className="text-gradient leading-normal">Profile</span>
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                Manage your credentials, security preferences, and themes.
             </p>
          </div>
          <Link to="/settings">
            <Button variant="outline" className="rounded-2xl p-3">
              <SettingsIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Account card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column - Avatar and Premium Status */}
        <div className="space-y-6">
          <GlassCard className="p-8 text-center space-y-6 bg-gradient-to-b from-blue-500/5 to-purple-500/5" hover={false}>
            <div className="relative inline-block group">
              <div className="w-28 h-28 rounded-full bg-gradient-premium flex items-center justify-center text-white text-4xl font-extrabold shadow-xl relative z-10 select-none">
                {fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity"></div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight dark:text-white uppercase leading-tight truncate">
                {fullName}
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-500 font-black tracking-widest uppercase">
                <BadgeCheck className="w-4 h-4 text-blue-500" /> Verified Member
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Access Node</span>
                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-black text-[9px] uppercase tracking-wider">
                  Campus Resident
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Account Level</span>
                <span className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tier 2
                </span>
              </div>
            </div>
          </GlassCard>
          
          {/* Support status */}
          <GlassCard className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-blue-500/20" hover={false}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm dark:text-white">Active System Monitoring</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                  Your campus trace active session is protected under high cryptographic safety standards.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right column - Main Profile Panels */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile}>
            <GlassCard className="p-8 space-y-8" hover={false}>
              
              {/* SECTION 1: Personal Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <User className="w-4 h-4 text-blue-500" /> Personal Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Display Identity</label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jean Dupont"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Join Date</label>
                    <div className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-transparent rounded-2xl p-4 text-sm font-semibold text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {joinDate}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Associated Email Account</label>
                  <div className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-transparent rounded-2xl p-4 text-sm font-semibold text-slate-500 flex items-center gap-2 select-all">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {user.email}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Account Security */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <Shield className="w-4 h-4 text-indigo-500" /> Account Security
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Protocol</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">FULLY VERIFIED</p>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Account Role</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">CAMPUS USER</p>
                    </div>
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Preferences */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <Sun className="w-4 h-4 text-amber-500" /> Preferences
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Theme Preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-semibold text-sm ${
                        theme === 'light' 
                          ? "border-blue-500 bg-blue-500/5 text-blue-600" 
                          : "border-slate-200 dark:border-slate-800/60 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Sun className="w-4 h-4 text-orange-500" />
                      Day Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-semibold text-sm ${
                        theme === 'dark' 
                          ? "border-blue-500 bg-blue-500/5 text-blue-400" 
                          : "border-slate-200 dark:border-slate-800/60 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-400" />
                      Cyber Mode
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full sm:flex-1 h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Updating..." : "Save Identity Changes"}
                </Button>
              </div>

            </GlassCard>
          </form>

          {/* SECTION 4: Logout Area */}
          <GlassCard className="p-8 border-red-500/10 dark:border-red-500/5 hover:border-red-500/20" hover={false}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wide leading-tight">
                  Sign Out Session
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  This will securely close your active encryption session on CampusTrace.
                </p>
              </div>
              <Button 
                variant="outline" 
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto rounded-xl border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 text-red-500 shrink-0 font-bold px-6 py-2.5 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Protocol
              </Button>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
