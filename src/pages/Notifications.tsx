import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCircle, Clock, Filter, Trash2, ArrowLeft, Info, Search, MoreHorizontal } from "lucide-react";
import { notificationService, Notification, getNotificationTypeInfo } from "../services/notificationService";
import { GlassCard, Button } from "../components/ui/UI";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'claims' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadNotifications();
    
    const handleNotificationsCleared = () => {
      setNotifications([]);
      setFilter('all');
      setSearchQuery('');
    };
    window.addEventListener('notifications-cleared', handleNotificationsCleared);
    
    // Subscribe to real-time updates
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
          if (channel) {
            import("../lib/supabase").then(({ supabase }) => supabase.removeChannel(channel));
          }
        });
      }
    };
  }, []);

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
      toast.error("Failed to load notifications");
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
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem(`notifications_cleared_at_${user.id}`, new Date().toISOString());
        }
        setNotifications([]);
        setFilter('all');
        setSearchQuery('');
        window.dispatchEvent(new CustomEvent('notifications-cleared'));
        toast.success("Notifications cleared");
      } catch (error) {
        console.error("Error purging logs:", error);
        toast.error("Failed to purge logs");
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !n.is_read) ||
      (filter === 'system' && !n.user_id) ||
      (filter === 'claims' && n.title.toLowerCase().includes('claim')) ||
      (filter === 'lost' && n.title.toLowerCase().includes('lost')) ||
      (filter === 'found' && n.title.toLowerCase().includes('found'));
    
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 space-y-12">
      {/* Header Area */}
      <section className="space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors mb-4 group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Nexus
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-xl">
             <h1 className="text-5xl font-black tracking-tighter dark:text-white leading-none">
                Intelligence <span className="text-gradient">Stream</span>
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                Live monitoring of campus recovery protocols and community activity.
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                onClick={handleMarkAllAsRead}
                disabled={!notifications.some(n => !n.is_read)}
                className="rounded-2xl"
             >
                <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
             </Button>
             <Button 
                variant="outline" 
                onClick={handleDeleteAll}
                className="rounded-2xl border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/20 dark:hover:bg-red-500/10 text-red-500"
             >
                <Trash2 className="w-4 h-4 mr-2" /> Purge Logs
             </Button>
          </div>
        </div>
      </section>

      {/* Control Bar */}
      <section className="glass p-4 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 shadow-xl border-white/10 dark:border-white/5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-sm font-bold border-none focus:ring-2 ring-blue-500/20 transition-all outline-none dark:text-white"
             />
          </div>
        </div>
        
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {(['all', 'unread', 'system', 'claims', 'lost', 'found'] as const).map((f) => (
            <button
               key={f}
               onClick={() => setFilter(f)}
               className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === f 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
               )}
            >
               {f === 'all' ? 'All Activity' : f}
            </button>
          ))}
        </div>

        <div className="md:ml-auto text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-6 py-2.5 rounded-xl">
           {filteredNotifications.length} Records Detected
        </div>
      </section>

      {/* Notifications List */}
      <section>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="py-40 text-center space-y-6"
            >
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center animate-pulse">
                   <Clock className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Activity Stream...</p>
            </motion.div>
          ) : filteredNotifications.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              {filteredNotifications.map((item, i) => {
                const typeInfo = getNotificationTypeInfo(item.title, item.message);
                const NotifIcon = typeInfo.icon || Bell;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard 
                      className={cn(
                        "p-0 overflow-hidden group transition-all duration-300 border-slate-200/50 dark:border-slate-800/40 relative",
                        !item.is_read 
                          ? "bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-xl" 
                          : "bg-white/40 dark:bg-slate-900/40 opacity-85 hover:opacity-100 border-l-4 border-l-transparent"
                      )}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      <div className="p-6 sm:p-8 flex flex-col md:flex-row items-stretch justify-between gap-6">
                        <div className="flex gap-6 items-start flex-1">
                          
                          {/* Mapped Icon with Glowing Colors */}
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner relative duration-300",
                            typeInfo.bg,
                            typeInfo.color,
                            typeInfo.glow
                          )}>
                            <NotifIcon className="w-6 h-6" />
                            {!item.is_read && (
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                              </span>
                            )}
                          </div>
                          
                          {/* Message Body */}
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full select-none",
                                typeInfo.badge
                              )}>
                                {typeInfo.label}
                              </span>
                              {!item.is_read && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-[9px] font-black uppercase tracking-widest text-white rounded-full">New Signal</span>
                              )}
                            </div>
                            
                            <h3 className={cn(
                              "text-xl font-extrabold tracking-tight uppercase group-hover:text-blue-500 transition-colors leading-tight",
                              !item.is_read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                            )}>
                              {item.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-300 leading-relaxed max-w-3xl text-sm font-semibold">
                              {item.message}
                            </p>
                          </div>
                        </div>

                        {/* Date and ID */}
                        <div className="flex md:flex-col items-end justify-between md:justify-center gap-4 min-w-[140px] border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </div>
                            <div className="text-[10px] font-mono font-bold tracking-widest text-slate-300 dark:text-slate-600">
                              ID: {item.id.slice(0, 8)}
                            </div>
                          </div>
                          
                          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100 self-end">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-40 text-center glass rounded-[3rem] border-dashed border-2 space-y-8"
            >
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tight dark:text-white leading-none">No active notifications</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">No intelligence signals are currently active. Monitoring systems remain fully online.</p>
              </div>
              <Button variant="outline" onClick={() => loadNotifications()} className="rounded-xl">Refresh Feed</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
