import { motion, AnimatePresence } from "motion/react";
import { MapPin, Calendar, ArrowRight, CheckCircle, Clock, AlertCircle, Loader2, TrendingUp, HandHeart, Box, Sparkles, Brain, Search, Terminal, Zap } from "lucide-react";
import { Button, GlassCard } from "../components/ui/UI";
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { lostItemsService } from "../services/lostItems";
import { foundItemsService } from "../services/foundItems";
import { supabase } from "../lib/supabase";
import { searchService, SearchResult } from "../services/searchService";
import { returnedItemsService } from "../services/returnedItemsService";

const suggestions = [
  "I lost my brown leather wallet",
  "Found a silver iPhone near cafeteria",
  "Someone lost keys in the library",
  "Blue backpack found in canteens",
  "My Apple Watch is missing since yesterday",
  "Lost my student ID card at the gym",
];

function SmartCommandBox() {
  const navigate = useNavigate();
  const [command, setCommand] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (command.trim()) {
      navigate(`/smart-search?q=${encodeURIComponent(command.trim())}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-3xl mx-auto z-10"
    >
      {/* Floating AI Particles */}
      <div className="absolute -inset-10 overflow-visible pointer-events-none z-0">
        {/* Floating glow spheres */}
        <motion.div
          animate={{
            y: [-15, 15, -15],
            x: [-10, 10, -10],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-[-20px] w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-md opacity-40"
        />
        <motion.div
          animate={{
            y: [15, -15, 15],
            x: [10, -10, 10],
            scale: [0.9, 1.05, 0.9],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-5 right-[-20px] w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-40"
        />
        <motion.div
          animate={{
            y: [-8, 8, -8],
            x: [12, -12, 12],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute top-1/2 right-[15%] w-3 h-3 bg-cyan-400 rounded-full blur-[2px] opacity-60"
        />
        <motion.div
          animate={{
            y: [10, -10, 10],
            x: [-15, 15, -15],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute bottom-0 left-[25%] w-4 h-4 bg-purple-400 rounded-full blur-[3px] opacity-50"
        />
      </div>

      {/* AI Glow Aura */}
      <div className={cn(
        "absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[3.5rem] blur-2xl opacity-10 transition-opacity duration-1000 pointer-events-none",
        isFocused ? "opacity-30 animate-pulse" : "opacity-5"
      )} />

      {/* Premium Outer Gradient Border Frame */}
      <div className={cn(
        "p-[1.5px] rounded-[3rem] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 transition-all duration-700 backdrop-blur-md relative z-10",
        isFocused 
          ? "from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_40px_rgba(79,70,229,0.25)] dark:shadow-[0_0_50px_rgba(99,102,241,0.15)] scale-[1.01]" 
          : "hover:from-blue-500/40 hover:via-indigo-500/40 hover:to-purple-500/40 hover:scale-[1.005]"
      )}>
        <GlassCard 
          className="p-2 sm:p-3 rounded-[2.9rem] border-none shadow-2xl relative overflow-hidden group bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl"
          hover={false}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>

          <div className="flex items-center gap-4 px-4 sm:px-6 relative">
            <div className="relative group/brain flex items-center justify-center">
              <Brain className={cn(
                "w-8 h-8 transition-all duration-500",
                isFocused ? "text-blue-500 scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "text-slate-400 dark:text-slate-500"
              )} />
              <Sparkles className={cn(
                 "absolute -top-1 -right-1 w-4 h-4 text-purple-400 transition-opacity duration-500",
                 isFocused ? "opacity-100 animate-spin-slow" : "opacity-0"
              )} />
            </div>
            
            <input
              type="text"
              placeholder="Type a smart command (e.g. 'I lost my keys')..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full py-5 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-lg sm:text-xl font-bold tracking-tight"
            />

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="gradient" 
                size="lg" 
                className="rounded-[2rem] px-6 sm:px-8 shadow-2xl shadow-blue-500/30 hover:shadow-indigo-500/40 active:scale-95 transition-all group/btn bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold"
                onClick={handleSearch}
              >
                <span className="hidden sm:inline">Analyze</span>
                <span className="sm:hidden">Run</span>
                <Zap className="ml-2 w-4 h-4 text-white group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-transform" />
              </Button>
            </div>
          </div>

          {/* AI Status Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none opacity-85">
             <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
             </span>
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">AI Campus Intelligence Active</span>
          </div>
        </GlassCard>
      </div>

      {/* Futuristic Glass Suggestion Panel */}
      <div className="mt-8 flex justify-center">
        <div className="glass px-6 py-3 rounded-2xl border border-blue-500/10 dark:border-blue-500/5 hover:border-blue-500/20 hover:bg-white/80 dark:hover:bg-slate-950/80 rounded-2xl flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-bold shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
           <Terminal className="w-4 h-4 text-purple-500 shrink-0 animate-pulse" />
           <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-extrabold select-none">✨ Try Command:</span>
           <AnimatePresence mode="wait">
             <motion.button
               key={suggestionIndex}
               initial={{ opacity: 0, x: 10, filter: "blur(2px)" }}
               animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, x: -10, filter: "blur(2px)" }}
               onClick={() => setCommand(suggestions[suggestionIndex])}
               className="text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 font-bold text-left select-none text-sm cursor-pointer"
             >
               "{suggestions[suggestionIndex]}"
             </motion.button>
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [discoverItems, setDiscoverItems] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState([
    { label: "Items Lost", value: "0", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Items Found", value: "0", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Returned", value: "0", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  ]);
  const [recentItems, setRecentItems] = useState<any[]>([]);

  const categories = ["All", "Electronics", "Books", "Bags", "Clothing", "Keys", "ID Cards/Wallets", "Jewelry"];

  useEffect(() => {
    loadHomeData();
    // ...

    // Real-time subscription for items to update stats
    const lostChannel = supabase
      .channel('lost-item-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items' }, () => {
        loadHomeData();
      })
      .subscribe();

    const foundChannel = supabase
      .channel('found-item-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'found_items' }, () => {
        loadHomeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lostChannel);
      supabase.removeChannel(foundChannel);
    };
  }, []);

  useEffect(() => {
    fetchDiscoverItems();
  }, [selectedCategory]);

  async function fetchDiscoverItems() {
    try {
      setLoading(true);
      const data = await searchService.searchItems("", {
        category: selectedCategory === "All" ? undefined : selectedCategory
      });
      setDiscoverItems(data.slice(0, 4));
    } catch (error) {
      console.error("Error fetching discover items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHomeData() {
    try {
      setLoading(true);
      const [lostCount, foundCount, returnedCount, recentLost, recentFound] = await Promise.all([
        lostItemsService.getStats(),
        foundItemsService.getStats(),
        returnedItemsService.getTotalReturnedCount(),
        lostItemsService.getRecent(2),
        foundItemsService.getRecent(2)
      ]);

      setStats([
        { label: "Items Lost", value: lostCount.toString(), icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Items Found", value: foundCount.toString(), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Returned", value: returnedCount.toString(), icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
      ]);

      // Combine and sort by date
      const combined = [
        ...recentLost.map(item => ({ ...item, type: 'lost' })),
        ...recentFound.map(item => ({ ...item, type: 'found' }))
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 4);

      setRecentItems(combined);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-24 pb-20 overflow-hidden pt-8">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-20 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-40 right-[10%] w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center space-y-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-widest animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Modern Campus Recovery
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] dark:text-slate-100">
              Recover your <br />
              <span className="text-gradient">Belongings</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
              The smartest way to find what you've lost and return what you've found on campus. Fast, secure, and community-driven.
            </p>
          </motion.div>

          <div className="mt-12">
            <SmartCommandBox />
          </div>
        </div>
      </section>

      {/* Main Action Grid */}
      <section className="container mx-auto px-4 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <Link to="/report" className="block group">
              <GlassCard className="p-8 border-orange-500/10 hover:border-orange-500/30 transition-all bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 shrink-0 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold dark:text-slate-100">Report Lost</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Notify the community</p>
                  </div>
                </div>
              </GlassCard>
            </Link>

            <Link to="/report" className="block group">
              <GlassCard className="p-8 border-emerald-500/10 hover:border-emerald-500/30 transition-all bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex items-center gap-6 text-left">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold dark:text-slate-100">Report Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Return an item today</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>

          <GlassCard className="p-10 relative overflow-hidden" hover={false}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <TrendingUp className="w-32 h-32" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 mb-10">Campus Activity</h4>
            <div className="grid gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-bold">{stat.label}</span>
                  </div>
                  <span className="text-3xl font-black tracking-tighter dark:text-slate-100">{stat.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-7 flex flex-col gap-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-4xl font-black tracking-tighter dark:text-white">Live Discovery</h2>
            <Link to="/lost" className="group text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              Explore All <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all border tracking-widest uppercase",
                  selectedCategory === cat 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                    : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2, 3, 4].map((n) => (
                  <motion.div 
                    key={`skeleton-${n}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-64 rounded-[2rem] bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" 
                  />
                ))
              ) : discoverItems.length > 0 ? (
                discoverItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.1 * i, ease: "circOut" }}
                  >
                    <GlassCard className="p-5 flex flex-col gap-4 group h-full">
                      <div className="aspect-square w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <HandHeart className="w-16 h-16 opacity-10 group-hover:scale-110 transition-all" />
                          </div>
                        )}
                        <div className={cn(
                          "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl",
                          item.status === 'lost' ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {item.status}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{item.category}</span>
                        <h4 className="text-xl font-bold dark:text-slate-100 group-hover:text-blue-500 transition-colors line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center mt-2">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" /> {item.lost_location || item.found_location}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                           <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">{formatDate(item.created_at)}</span>
                           <Link to={`/${item.status === 'lost' ? 'lost' : 'found'}?id=${item.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 px-3 text-[9px] font-black uppercase tracking-widest">Details</Button>
                           </Link>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-20 text-center glass border-dashed rounded-[3rem]"
                >
                  <Box className="w-16 h-16 text-slate-300 mx-auto mb-6 opacity-20" />
                  <p className="text-slate-400 font-bold">No items found matching your radar.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
