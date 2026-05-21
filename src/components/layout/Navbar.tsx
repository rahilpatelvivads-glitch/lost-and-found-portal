import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PlusCircle, User, Menu, X, LogIn, Sun, Moon, Bell, Home, MapPin, Package, Archive, Clock, LogOut, Settings, ChevronDown, Shield, BellOff, HandHeart } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../ThemeProvider";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/UI";
import NotificationPanel from "../NotificationPanel";
import { notificationService } from "../../services/notificationService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      
      // Close notifications if clicking outside
      const bellButton = document.querySelector('.group\\/bell');
      const panel = document.querySelector('.notification-panel'); // I should add this class to the panel
      if (bellButton && !bellButton.contains(target) && panel && !panel.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      setIsProfileOpen(false);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      const handleNotificationsCleared = () => {
        setUnreadCount(0);
      };
      window.addEventListener('notifications-cleared', handleNotificationsCleared);
      
      // Real-time subscription for combined notifications
      let channelPromise: Promise<any> | null = null;
      
      const setup = async () => {
        channelPromise = notificationService.subscribeToMyNotifications((payload) => {
          loadUnreadCount();
          if (payload.eventType === 'INSERT' && !(payload.new as any).user_id) {
            toast.info(`System Alert: ${(payload.new as any).title}`, {
              description: (payload.new as any).message
            });
          }
        });
      };

      setup();

      return () => {
        window.removeEventListener('notifications-cleared', handleNotificationsCleared);
        if (channelPromise) {
          channelPromise.then(channel => {
            if (channel) supabase.removeChannel(channel);
          });
        }
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('created_at')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_read', false);
      
      if (error) throw error;
      
      const clearedAt = localStorage.getItem(`notifications_cleared_at_${user.id}`);
      let count = 0;
      if (data) {
        if (clearedAt) {
          const clearedTime = new Date(clearedAt).getTime();
          count = data.filter(n => new Date(n.created_at).getTime() > clearedTime).length;
        } else {
          count = data.length;
        }
      }
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Lost Items", path: "/lost", icon: MapPin },
    { name: "Found Items", path: "/found", icon: Package },
    { name: "Returned", path: "/returned-items", icon: Archive },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto dark:bg-slate-900/95 bg-white/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-6xl sm:rounded-full px-4 py-2 flex justify-between items-center relative group pointer-events-auto shadow-xl dark:shadow-2xl">
         {/* Animated inner border effect */}
         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-6xl sm:rounded-full"></div>
         
          <div className="flex items-center gap-4 lg:gap-6 relative z-10 w-full lg:w-auto">
            <Link to="/" className="flex items-center group/logo shrink-0">
              <div className="w-10 h-10 bg-gradient-premium rounded-2xl flex items-center justify-center font-black text-white mr-3 shadow-lg shadow-blue-500/30 group-hover/logo:scale-110 transition-transform">CT</div>
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-slate-100 hidden md:block">
                Campus<span className="text-blue-600 dark:text-blue-400">Trace</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 text-sm font-bold transition-all rounded-full relative flex items-center gap-2 group/link",
                    isActive(link.path)
                      ? "text-white bg-gradient-premium shadow-lg shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <link.icon className={cn("w-4 h-4 transition-transform group-hover/link:scale-110", isActive(link.path) ? "opacity-100" : "opacity-70 dark:opacity-90 group-hover/link:opacity-100")} />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-200 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {user ? (
               <div className="flex items-center gap-1 sm:gap-2">
                  <div className="relative">
                    <button 
                      onClick={toggleNotifications}
                      className={cn(
                        "p-2.5 rounded-full transition-all relative group/bell",
                        isNotificationsOpen 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-200"
                      )}
                    >
                      <Bell className="w-5 h-5 group-hover/bell:rotate-12 transition-transform" />
                      {unreadCount > 0 && (
                        <span className={cn(
                          "absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2",
                          isNotificationsOpen 
                            ? "bg-white text-blue-600 border-blue-600" 
                            : "bg-red-500 text-white border-white dark:border-slate-900"
                        )}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationPanel 
                      isOpen={isNotificationsOpen} 
                      onClose={() => setIsNotificationsOpen(false)} 
                    />
                  </div>
                
                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

                <Link to="/report" className="hidden sm:block">
                  <Button variant="gradient" size="sm" className="px-5 shadow-lg shadow-blue-500/20">Report</Button>
                </Link>

                <Button 
                  onClick={handleLogout} 
                  variant="gradient" 
                  size="sm" 
                  className="hidden sm:flex px-5 shadow-lg shadow-indigo-500/20 items-center gap-2 group/logout"
                >
                  <span>Logout</span>
                  <LogOut className="w-4 h-4 group-hover/logout:translate-x-0.5 transition-transform" />
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                        setIsNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                  >
                    <span className="text-xs font-black text-slate-600 dark:text-slate-100 truncate max-w-[80px] hidden md:block">
                      {user.email?.split('@')[0]}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-premium flex items-center justify-center text-white font-black text-xs shadow-md">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 dark:text-slate-300 transition-transform", isProfileOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-64 glass dark:bg-slate-900 overflow-hidden border-white/10 dark:border-white/5 shadow-2xl rounded-3xl z-50 p-2"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Authenticated Account</p>
                           <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                        </div>
                        
                        <div className="space-y-1">
                          {[
                            { label: 'My Profile', path: '/profile', icon: User },
                            { label: 'Notifications', path: '/notifications', icon: Bell },
                            { label: 'My Reports', path: '/my-reports', icon: Package },
                            { label: 'My Claims', path: '/claims', icon: HandHeart },
                            { label: 'Returned Items', path: '/returned-items', icon: Archive },
                            { label: 'Settings', path: '/settings', icon: Settings },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              to={item.path}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group"
                            >
                              <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                        
                        <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all group"
                        >
                          <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                          Logout Protocol
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-600 dark:text-slate-300">Log In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient" size="sm" className="shadow-lg shadow-blue-500/20">Get Started</Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden mt-4 mx-2 glass rounded-3xl overflow-hidden border-white/10 dark:border-white/5 pointer-events-auto"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition-all",
                    isActive(link.path)
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
              {user ? (
                <>
                  <Link to="/report" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <PlusCircle className="w-5 h-5 text-blue-500" />
                    Report Item
                  </Link>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <User className="w-5 h-5 text-indigo-500" />
                    My Profile
                  </Link>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-black text-blue-600 dark:text-blue-400 bg-blue-500/5">
                  <LogIn className="w-5 h-5" />
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
