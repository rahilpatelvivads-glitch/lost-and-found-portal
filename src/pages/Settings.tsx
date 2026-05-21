import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings as SettingsIcon, User, Moon, Sun, Monitor, Bell, 
  Shield, ArrowLeft, Save, Globe, Eye, EyeOff, Key, Mail,
  Smartphone, HardDrive, AlertTriangle, CheckCircle, ShieldCheck,
  Check, Info, Sparkles, ArrowRight, Search, FileText,
  BookOpen, HelpCircle, Activity, ShieldAlert, HandHeart
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { GlassCard, Button } from "../components/ui/UI";
import { useTheme } from "../components/ThemeProvider";
import { cn } from "../lib/utils";
import { LANGUAGES, TRANSLATIONS } from "../data/translations";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type ActiveTab = "profile" | "appearance" | "notifications" | "about" | "language";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [lang, setLang] = useState(() => localStorage.getItem("language") || "en");
  
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password Update Fields
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Preference Settings
  const [enable2FA, setEnable2FA] = useState(() => localStorage.getItem("setting_2fa") === "true");
  const [profileVisible, setProfileVisible] = useState(() => localStorage.getItem("setting_profile_visible") !== "false");
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem("setting_email_alerts") !== "false");
  const [pushAlerts, setPushAlerts] = useState(() => localStorage.getItem("setting_push_alerts") !== "false");
  const [systemAlerts, setSystemAlerts] = useState(() => localStorage.getItem("setting_system_alerts") !== "false");

  // Danger Warnings
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [revokingDevices, setRevokingDevices] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    loadProfileDetails();
  }, []);

  const loadProfileDetails = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (authUser) {
        setUser(authUser);
        
        // Query Profiles Table
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Fetch profile error:", fetchError);
        }

        let finalProfile = profile;

        if (!profile) {
          // If profile does NOT exist, automatically create profile row
          const defaultDisplayName = authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || "";
          const defaultAvatarUrl = authUser.user_metadata?.avatar_url || "";
          const defaultBio = authUser.user_metadata?.bio || "";
          const defaultLanguage = localStorage.getItem("language") || "en";
          const defaultTheme = theme || "system";

          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .upsert({
              id: authUser.id,
              email: authUser.email,
              display_name: defaultDisplayName,
              full_name: defaultDisplayName,
              avatar_url: defaultAvatarUrl,
              bio: defaultBio,
              preferred_language: defaultLanguage,
              theme: defaultTheme,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();

          if (createError) {
            console.error("Auto-create profile error:", createError);
          } else if (newProfile) {
            finalProfile = newProfile;
          }
        }

        if (finalProfile) {
          setDisplayName(finalProfile.display_name || finalProfile.full_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || "");
          setAvatarUrl(finalProfile.avatar_url || authUser.user_metadata?.avatar_url || "");
          setBio(finalProfile.bio || authUser.user_metadata?.bio || "");
          
          if (finalProfile.preferred_language) {
            setLang(finalProfile.preferred_language);
            localStorage.setItem("language", finalProfile.preferred_language);
          }
          if (finalProfile.theme) {
            setTheme(finalProfile.theme as any);
          }
        } else {
          setDisplayName(authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || "");
          setAvatarUrl(authUser.user_metadata?.avatar_url || "");
          setBio(authUser.user_metadata?.bio || "");
        }
      }
    } catch (error) {
      console.error("Error loading account preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No authenticated user session found");
      
      // 1. Update Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          display_name: displayName,
          full_name: displayName, // support for older visual layouts mapping full_name
          avatar_url: avatarUrl,
          bio: bio,
          preferred_language: lang,
          theme: theme,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 2. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: bio
        }
      });

      if (authError) throw authError;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Security policy: password must contain 6+ characters.");
      return;
    }
    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success(t.toastPassSuccess);
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Credential modification rejected.");
    } finally {
      setChangingPass(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`
      });
      if (error) throw error;
      toast.success(t.toastResetSuccess);
    } catch (error: any) {
      toast.error(error.message || "Failed to dispatch recovery token.");
    } finally {
      setSendingReset(false);
    }
  };

  const changeLanguage = (code: string) => {
    setLang(code);
    localStorage.setItem("language", code);
    toast.success(`${LANGUAGES.find(l => l.code === code)?.name} translation active.`);
  };

  const toggle2FA = () => {
    const newVal = !enable2FA;
    setEnable2FA(newVal);
    localStorage.setItem("setting_2fa", String(newVal));
    toast.success(newVal ? "Dual Factor Verification (2FA) scheduled." : "2FA Verification suspended.");
  };

  const handleLogoutAllDevices = () => {
    setRevokingDevices(true);
    setTimeout(() => {
      setRevokingDevices(false);
      toast.success(t.toastLogoutAllSuccess);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-7xl mx-auto px-4 relative">
      {/* Background radial highlights */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10"></div>

      {/* Navigation & Header */}
      <section className="space-y-4 mb-10">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t.backToProfile}
        </Link>
        <div className="space-y-2">
           <h1 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white leading-none capitalize">
              {t.title.split(" ")[0]} <span className="text-gradient">{t.title.split(" ")[1] || "Settings"}</span>
           </h1>
           <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm md:text-base">
              {t.subtitle}
           </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <GlassCard className="p-3 space-y-1 sticky top-24 border-slate-200 dark:border-slate-800">
            {[
              { id: "profile", name: t.profile, icon: User },
              { id: "appearance", name: t.appearance, icon: Moon },
              { id: "notifications", name: t.notifications, icon: Bell },
              { id: "about", name: "About CampusTrace", icon: Info },
              { id: "language", name: t.language, icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300",
                    isActive 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02] border-none" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-blue-500"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.name}</span>
                </button>
              );
            })}
          </GlassCard>
        </div>

        {/* Dynamic Panels Content area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              
              {/* Profile Config tab */}
              {activeTab === "profile" && (
                <GlassCard className="p-8 space-y-8 border-slate-200 dark:border-slate-800" hover={false}>
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-blue-500/10 flex items-center justify-center text-3xl font-extrabold text-blue-500 overflow-hidden shadow-inner uppercase">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar profile" className="w-full h-full object-cover" onError={() => setAvatarUrl("")} />
                        ) : (
                          displayName?.[0] || user?.email?.[0] || "?"
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h3 className="text-xl font-black uppercase tracking-wide text-slate-800 dark:text-white">{t.profile}</h3>
                      <p className="text-xs text-slate-400 font-bold max-w-sm">
                        Synchronize your avatar visual feeds, academia alias, and personal campus description ledger.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.emailLabel}</label>
                        <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-white/5 rounded-2xl p-4 text-sm font-semibold text-slate-400 cursor-not-allowed select-none flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {user?.email}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.displayIdentityLabel}</label>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Full name"
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 dark:focus:ring-blue-500/20 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.avatarUrlLabel}</label>
                      <input 
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                        className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-semibold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      />
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        Input a custom secure URL address link to render your digital avatar icon identity.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.bioLabel} ({t.bioLabel ? "Optional" : ""})</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Computing Engineering Student. Looking for my lost mechanical keys."
                        rows={3}
                        className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-semibold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      />
                    </div>

                    <Button type="submit" disabled={saving} className="w-full h-14 rounded-2xl shadow-xl shadow-blue-600/15 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      {saving ? t.synchronizing : t.saveChanges}
                    </Button>
                  </form>
                </GlassCard>
              )}

              {/* Appearance Controls tab */}
              {activeTab === "appearance" && (
                <GlassCard className="p-8 space-y-8 border-slate-200 dark:border-slate-800" hover={false}>
                  <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xl font-black uppercase tracking-wide text-slate-800 dark:text-white">{t.visualInterface}</h3>
                    <p className="text-xs text-slate-400 font-bold">{t.customizeInterface}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Light Mode */}
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 group relative overflow-hidden",
                        theme === 'light' 
                          ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10" 
                          : "border-slate-100 dark:border-white/5 hover:border-amber-500/20 dark:hover:bg-slate-950/30"
                      )}
                    >
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Sun className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{t.dayMode}</span>
                      {theme === 'light' && (
                        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                      )}
                    </button>
                    
                    {/* Dark Mode */}
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 group relative overflow-hidden",
                        theme === 'dark' 
                          ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" 
                          : "border-slate-100 dark:border-white/5 hover:border-blue-500/20 dark:hover:bg-slate-950/30"
                      )}
                    >
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Moon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{t.cyberMode}</span>
                      {theme === 'dark' && (
                        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </button>

                    {/* System Theme Mode */}
                    <button
                      onClick={() => setTheme('system')}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 group relative overflow-hidden",
                        theme === 'system' 
                          ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" 
                          : "border-slate-100 dark:border-white/5 hover:border-indigo-500/20 dark:hover:bg-slate-950/30"
                      )}
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{t.systemMode}</span>
                      {theme === 'system' && (
                        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      )}
                    </button>
                  </div>
                </GlassCard>
              )}

              {/* Notification Preferences */}
              {activeTab === "notifications" && (
                <GlassCard className="p-8 space-y-8 border-slate-200 dark:border-slate-800" hover={false}>
                  <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xl font-black uppercase tracking-wide text-slate-800 dark:text-white">{t.notificationSettings}</h3>
                    <p className="text-xs text-slate-400 font-bold">{t.configureNotifications}</p>
                  </div>

                  <div className="space-y-6">
                    {/* Item 1: Email notices */}
                    <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm dark:text-white">{t.emailAlerts}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl">{t.emailAlertsDesc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const val = !emailAlerts;
                          setEmailAlerts(val);
                          localStorage.setItem("setting_email_alerts", String(val));
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 outline-none shrink-0",
                          emailAlerts ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", emailAlerts ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>

                    {/* Item 2: Push notifications */}
                    <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm dark:text-white">{t.pushAlerts}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl">{t.pushAlertsDesc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const val = !pushAlerts;
                          setPushAlerts(val);
                          localStorage.setItem("setting_push_alerts", String(val));
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 outline-none shrink-0",
                          pushAlerts ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", pushAlerts ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>

                    {/* Item 3: System Status updates */}
                    <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm dark:text-white">{t.systemStatus}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl">{t.systemStatusDesc}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const val = !systemAlerts;
                          setSystemAlerts(val);
                          localStorage.setItem("setting_system_alerts", String(val));
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 outline-none shrink-0",
                          systemAlerts ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", systemAlerts ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* About CampusTrace tab */}
              {activeTab === "about" && (
                <div className="space-y-10">
                  
                  {/* Guide Header */}
                  <div className="p-8 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 rounded-[2.5rem] border border-blue-500/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-blue-500/15 rounded-2xl flex items-center justify-center border border-blue-500/20 shrink-0">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="text-center md:text-left space-y-2">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">Onboarding Center</span>
                        <h2 className="text-3xl font-black tracking-tight dark:text-white uppercase leading-none">CampusTrace Guide</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed max-w-xl">
                          Learn how to use the Campus Lost & Found ecosystem effectively. Explore features, protocols, and safety norms.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: How to Report Lost Items */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">1. How to Report Lost Items</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { step: "STEP 1", title: "Click \"Report Lost\"", desc: "Initiate your lost item record by selecting the central action drawer or navigation link from the dashboard.", color: "from-pink-500/20 to-rose-500/10", border: "border-pink-500/20" },
                        { step: "STEP 2", title: "Add Parameters", desc: "Detail your item's name, category, description, location, and upload a clear reference photo files.", color: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/20" },
                        { step: "STEP 3", title: "Submit Report", desc: "Instantly transmit the item characteristics to our live database feed to enable matches across the network.", color: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/20" }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-6 bg-gradient-to-br ${item.color} rounded-3xl border ${item.border} hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden`}>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300/60 block mb-2">{item.step}</span>
                          <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-lg mb-2">{item.title}</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 2: How to Report Found Items */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                        <HandHeart className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">2. How to Report Found Items</h4>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 p-8 space-y-6">
                      <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                        Help reunite classmates with their belongings. When you discover an unclaimed physical asset anywhere on campus property, launch the found item process:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                          <div>
                            <h5 className="font-extrabold text-sm dark:text-white">Upload Found Item</h5>
                            <p className="text-xs text-slate-400 mt-1">Specify detailed category parameters, color nuances, and upload an on-site image snapshot safely.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                          <div>
                            <h5 className="font-extrabold text-sm dark:text-white">Mention Location</h5>
                            <p className="text-xs text-slate-400 mt-1">Input the specific campus library, floor level, seminar classroom, or yard area coordinates where found.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                          <div>
                            <h5 className="font-extrabold text-sm dark:text-white">Wait for Ownership Claim</h5>
                            <p className="text-xs text-slate-400 mt-1">Keep the asset secure or drop it off at designated desks while waiting for owners to file valid claim matches.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                          <div>
                            <h5 className="font-extrabold text-sm dark:text-white">Admin Verification Process</h5>
                            <p className="text-xs text-slate-400 mt-1">Authorized campus dispatch groups certify verification files to ensure items land into correctly validated hands.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 3: How Claim System Works */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">3. How Claim System Works</h4>
                    </div>
                    
                    <div className="p-8 bg-slate-50/20 dark:bg-slate-900/10 rounded-[2.5rem] border border-slate-150 dark:border-slate-805/60 overflow-hidden relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative z-10">
                        
                        {/* Node 1 */}
                        <div className="bg-white dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-150 dark:border-white/5 text-center group hover:scale-[1.03] transition-transform duration-300 shadow-inner">
                          <div className="mx-auto w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-3">
                            <User className="w-5 h-5 animate-pulse" />
                          </div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider dark:text-purple-300 font-bold">Lost User</h5>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">Publishes active lost database records</p>
                        </div>

                        {/* Arrow 1 */}
                        <div className="text-center text-slate-300 dark:text-slate-705 font-extrabold flex items-center justify-center rotate-90 md:rotate-0">
                          <ArrowRight className="w-5 h-5 text-blue-500 animate-[bounce_2s_infinite]" />
                        </div>

                        {/* Node 2 */}
                        <div className="bg-white dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-150 dark:border-white/5 text-center group hover:scale-[1.03] transition-transform duration-300 shadow-inner">
                          <div className="mx-auto w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-3">
                            <Search className="w-5 h-5" />
                          </div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider dark:text-blue-300 font-extrabold">Found Item Match</h5>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">Found item matches characteristics</p>
                        </div>

                        {/* Arrow 2 */}
                        <div className="text-center text-slate-300 dark:text-slate-705 font-extrabold flex items-center justify-center rotate-90 md:rotate-0">
                          <ArrowRight className="w-5 h-5 text-blue-500 animate-[bounce_2s_infinite]" />
                        </div>

                        {/* Node 3 */}
                        <div className="bg-white dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-150 dark:border-white/5 text-center group hover:scale-[1.03] transition-transform duration-300 shadow-inner">
                          <div className="mx-auto w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider dark:text-amber-300 font-extrabold">Claim Request</h5>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">Claim request sent to reporter</p>
                        </div>

                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative z-10 mt-6 lg:mt-10">
                        <div className="md:col-span-1"></div>
                        <div className="text-center text-slate-300 dark:text-slate-750 font-extrabold flex items-center justify-center rotate-90 md:rotate-0 md:col-span-1 border-slate-205">
                          <div className="hidden md:block h-8 border-l-2 border-dashed border-slate-300 dark:border-slate-800 absolute -top-8"></div>
                        </div>

                        {/* Node 4 */}
                        <div className="bg-white dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-150 dark:border-white/5 text-center group hover:scale-[1.03] transition-transform duration-300 shadow-inner md:col-span-1">
                          <div className="mx-auto w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
                            <Shield className="w-5 h-5" />
                          </div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider dark:text-emerald-300 font-extrabold">Verification</h5>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">Claim verification check approved</p>
                        </div>

                        {/* Arrow 3 */}
                        <div className="text-center text-slate-300 dark:text-slate-705 font-extrabold flex items-center justify-center rotate-90 md:rotate-0">
                          <ArrowRight className="w-5 h-5 text-blue-500 animate-[bounce_2s_infinite]" />
                        </div>

                        {/* Node 5 */}
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-5 rounded-3xl border border-emerald-500/20 text-center group hover:scale-[1.03] transition-transform duration-300 shadow-lg shadow-emerald-500/5 md:col-span-1">
                          <div className="mx-auto w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20">
                            <Check className="w-5 h-5" />
                          </div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-300 font-extrabold">Item Returned</h5>
                          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1 leading-snug">Belonging safely returned</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 4: Smart Search Guide */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl">
                        <Search className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">4. Smart Search Guide</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { phrase: "\"I lost my wallet\"", label: "Detects wallets/cards", text: "Instantly filter financial parameters, accessories, pouches & card wallets folders." },
                        { phrase: "\"found iphone\"", label: "Opens electronics", text: "Instantly directs query focus to cellphones, chargers, dynamic tablet units." },
                        { phrase: "\"missing bag\"", label: "Opens bags category", text: "Maps query variables across student luggage files, backpacks & athletic sacks." }
                      ].map((item, idx) => (
                        <div key={idx} className="p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-slate-150 dark:border-white/5 hover:border-purple-500/30 transition-all duration-300 relative group overflow-hidden">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-500 block mb-2">{item.label}</span>
                          <h5 className="font-bold text-slate-800 dark:text-white text-base mb-2 font-mono">{item.phrase}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 5: Notification Protocols */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Bell className="w-4 h-4 text-amber-500" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">5. Notification System</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { title: "Realtime Alerts", desc: "Mobile visual flags and push signals pops instantly on matches." },
                        { title: "Claim Updates", desc: "Notification flags dispatch immediately when claim requests are updated." },
                        { title: "Returned Item Notices", desc: "Visual status checks update on approved/rejected and returned items." },
                        { title: "Admin Announcements", desc: "Safe keeping notices and maintenance logs broadcasted by system control nodes." }
                      ].map((info, idx) => (
                        <div key={idx} className="p-5 bg-slate-50/55 dark:bg-slate-950/25 rounded-2xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 transition-all">
                          <h5 className="font-extrabold text-sm dark:text-white leading-tight mb-2 uppercase tracking-wide">{info.title}</h5>
                          <p className="text-xs text-slate-400 leading-snug">{info.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 6: Safety Guidelines */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">6. Safety Guidelines</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: "Never Share Passwords", desc: "Never share account credentials or reset tokens with anyone.", color: "from-rose-500/10 to-red-500/5", border: "border-rose-500/20" },
                        { title: "Verify Ownership First", desc: "Examine claim details carefully before accepting claims or handovers.", color: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/20" },
                        { title: "Meet in Campus Safe Zones", desc: "Coordinate physical handovers strictly inside public campus safe zones.", color: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/20" },
                        { title: "Report Suspicious Activity", desc: "Instantly flag users or items showing suspicious or malicious signals.", color: "from-purple-500/10 to-violet-500/5", border: "border-purple-500/20" }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-5 bg-gradient-to-br ${item.color} rounded-2xl border ${item.border} space-y-2`}>
                          <h5 className="font-bold text-sm text-slate-800 dark:text-white">{item.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-normal font-semibold">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section 7: About Platform */}
                  <section className="space-y-4">
                    <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 text-white rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                      <div className="relative space-y-6">
                        <div className="space-y-2">
                          <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[9px] font-mono uppercase tracking-[0.2em] text-blue-300">PLATFORM SPECIFICATIONS</span>
                          <h4 className="text-xl font-bold font-mono">7. ABOUT PLATFORM</h4>
                          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                            CampusTrace is an AI-powered smart recovery ecosystem designed for modern campuses. We optimize peer-to-peer lost and found logistics through decentralized claim channels, automated alerts, and instant visual verification workflows.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/15">
                          {[
                            { title: "Realtime Tracking", desc: "Live database state synchronizations." },
                            { title: "AI Search", desc: "Intent-driven item classification." },
                            { title: "Smart Claims", desc: "Contextual matching proof flows." },
                            { title: "Secure Verification", desc: "Admin verified physical clearances." },
                            { title: "Multilingual Support", desc: "Unified translations across languages." },
                            { title: "Modern Notification System", desc: "Instant visual and email event logs." }
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="text-xs font-bold font-mono text-blue-400 block">{item.title}</span>
                              <span className="text-[10px] text-slate-400">{item.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              )}

              {/* Language Protocol Selector tab */}
              {activeTab === "language" && (
                <GlassCard className="p-8 space-y-8 border-slate-200 dark:border-slate-800" hover={false}>
                  <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-xl font-black uppercase tracking-wide text-slate-800 dark:text-white">{t.selectLanguage}</h3>
                    <p className="text-xs text-slate-400 font-bold">{t.chooseLanguageDesc}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {LANGUAGES.map((language) => {
                      const isSelected = lang === language.code;
                      return (
                        <button
                          key={language.code}
                          onClick={() => changeLanguage(language.code)}
                          className={cn(
                            "p-5 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 group relative overflow-hidden",
                            isSelected 
                              ? "border-blue-500 bg-blue-500/5 shadow-md" 
                              : "border-slate-150 dark:border-slate-800/50 hover:border-blue-300 dark:hover:bg-slate-950/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none" role="img" aria-label={language.name}>{language.flag}</span>
                            <div>
                              <p className="text-sm font-black dark:text-white leading-tight">
                                {language.name}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                {language.nativeName}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Delete Confirmation Warning Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-red-500/20 dark:border-red-500/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-8 space-y-6"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-800 dark:text-white leading-none">
                  Purge Identity Security Card?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {t.deleteWarning}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)} 
                  className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider text-slate-500"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    toast.error(t.toastDeleteWarn);
                  }} 
                  className="w-full bg-red-500 dark:bg-red-600 dark:hover:bg-red-700 text-white hover:bg-red-600 rounded-xl py-3 text-xs font-black uppercase tracking-wider"
                >
                  Purge Profile
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
