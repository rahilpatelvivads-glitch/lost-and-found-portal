import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCircle, Clock, X, Info, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "./ui/UI";
import { notificationService, Notification, getNotificationTypeInfo } from "../services/notificationService";
import { supabase } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleNotificationsCleared = () => {
      setNotifications([]);
    };
    window.addEventListener('notifications-cleared', handleNotificationsCleared);

    if (isOpen) {
      loadNotifications();
      
      let channelPromise: Promise<any> | null = null;
      
      const setup = async () => {
        channelPromise = notificationService.subscribeToMyNotifications(() => {
          loadNotifications();
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

    return () => {
      window.removeEventListener('notifications-cleared', handleNotificationsCleared);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const data = await notificationService.getMyNotifications();
      if (user) {
        const clearedAt = localStorage.getItem(`notifications_cleared_at_${user.id}`);
        if (clearedAt) {
          const clearedTime = new Date(clearedAt).getTime();
          setNotifications(data.filter(n => new Date(n.created_at).getTime() > clearedTime));
          return;
        }
      }
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
       console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
       console.error("Error marking all as read:", error);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem(`notifications_cleared_at_${user.id}`, new Date().toISOString());
        }
        setNotifications([]);
        window.dispatchEvent(new CustomEvent('notifications-cleared'));
        toast.success("Notifications cleared");
        onClose();
      } catch (error) {
        console.error("Error clearing notifications:", error);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            className="absolute top-16 right-[-1.5rem] sm:right-0 w-[calc(100vw-1.5rem)] sm:w-[440px] max-w-[440px] z-[101] p-2 sm:p-4 notification-panel"
          >
            <GlassCard className="p-0 border-slate-200/50 dark:border-slate-800/50 shadow-[0_50px_100px_-20px_rgba(30,41,59,0.15)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden max-h-[85vh] flex flex-col rounded-[2.5rem] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl">
              
              {/* Panel Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-white/40 dark:bg-slate-950/40">
                <Link to="/notifications" onClick={onClose} className="group/header">
                  <h3 className="text-xl font-black tracking-tighter dark:text-slate-100 flex items-center gap-3 group-hover/header:text-blue-500 transition-colors">
                    Notifications
                    {notifications.filter(n => !n.is_read).length > 0 && (
                       <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-blue-500/20 animate-pulse">
                          {notifications.filter(n => !n.is_read).length} NEW
                       </span>
                    )}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Live Intelligence Feed</p>
                </Link>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={handleMarkAllAsRead}
                    disabled={notifications.length === 0 || !notifications.some(n => !n.is_read)}
                    className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group disabled:opacity-40 disabled:pointer-events-none"
                    title="Mark all as read"
                  >
                     <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   </button>
                   <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable notifications list */}
              <div className="overflow-y-auto flex-1 scrollbar-hide py-2 max-h-[45vh]">
                {loading ? (
                  <div className="p-16 text-center space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/5">
                       <Clock className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Accessing databases...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/60 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-ping"></span>
                    </div>
                    <div>
                       <p className="text-slate-800 dark:text-slate-200 font-extrabold tracking-tight text-lg">No active notifications</p>
                       <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-[240px] mx-auto leading-relaxed">Your intelligence queue is completely clear. Monitoring remains active.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/50 dark:divide-slate-900/50">
                    {notifications.slice(0, 5).map((notif, idx) => {
                      const typeInfo = getNotificationTypeInfo(notif.title, notif.message);
                      const NotifIcon = typeInfo.icon || Info;
                      
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={cn(
                            "p-5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all duration-300 cursor-pointer relative group flex gap-4 border-l-4",
                            !notif.is_read 
                              ? "bg-blue-50/20 dark:bg-indigo-950/10 border-blue-500" 
                              : "border-transparent opacity-80 hover:opacity-100"
                          )}
                        >
                          {/* Left Icon Badge */}
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform relative",
                            typeInfo.bg,
                            typeInfo.color,
                            typeInfo.glow
                          )}>
                            <NotifIcon className="w-5 h-5" />
                            {!notif.is_read && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                                {typeInfo.label}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <h4 className={cn(
                              "text-sm font-black tracking-tight leading-tight uppercase group-hover:text-blue-500 transition-colors",
                              !notif.is_read ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                            )}>
                              {notif.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                              {notif.message}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {notifications.length > 5 && (
                      <Link 
                        to="/notifications" 
                        onClick={onClose}
                        className="block py-4 text-center text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-50/30 dark:bg-slate-900/10"
                      >
                        + View {notifications.length - 5} More Notifications
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              {/* Bottom Actions Panel */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-center bg-white/50 dark:bg-slate-950/50 flex gap-2 rounded-b-[2.5rem]">
                 <Link to="/notifications" onClick={onClose} className="flex-1">
                    <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-95">
                      Open Center
                    </button>
                 </Link>
                 <button 
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                  className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white border border-red-500/10 hover:bg-red-600 dark:hover:bg-red-950/40 rounded-xl transition-all duration-300 disabled:opacity-45 disabled:pointer-events-none"
                >
                   Clear All
                 </button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
