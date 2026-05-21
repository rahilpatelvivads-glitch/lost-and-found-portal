import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, MapPin, Clock, ArrowLeft, Box, Loader2, Calendar, LayoutGrid, List } from "lucide-react";
import { searchService, SearchResult } from "../services/searchService";
import { GlassCard, Button } from "../components/ui/UI";
import { cn } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: (searchParams.get("status") as any) || 'all',
    category: searchParams.get("category") || 'All',
    sortBy: (searchParams.get("sortBy") as any) || 'latest'
  });

  const categories = ["All", "Electronics", "Accessories", "Documents", "Bags", "Clothing", "Others"];

  useEffect(() => {
    performSearch();
  }, [query, filters]);

  async function performSearch() {
    try {
      setLoading(true);
      const data = await searchService.searchItems(query, {
        status: filters.status,
        category: filters.category,
        sortBy: filters.sortBy
      });
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateFilters = (newFilters: any) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    
    // Update URL params
    const params: any = { q: query };
    if (updated.status !== 'all') params.status = updated.status;
    if (updated.category !== 'All') params.category = updated.category;
    if (updated.sortBy !== 'latest') params.sortBy = updated.sortBy;
    setSearchParams(params);
  };

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
                Intelligence <span className="text-gradient">Fetch</span>
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                Query results for: <span className="text-blue-600 dark:text-blue-400 font-black">"{query}"</span>
             </p>
          </div>
          
          <div className="flex items-center gap-3 glass p-1.5 rounded-2xl">
            <button 
              onClick={() => setView('grid')} 
              className={cn("p-2 rounded-xl transition-all", view === 'grid' ? "bg-white dark:bg-slate-800 shadow-md text-blue-500" : "text-slate-400")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('list')} 
              className={cn("p-2 rounded-xl transition-all", view === 'list' ? "bg-white dark:bg-slate-800 shadow-md text-blue-500" : "text-slate-400")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="glass p-4 rounded-[2rem] flex flex-wrap items-center gap-6 shadow-xl border-white/10 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
        </div>
        
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Status Filter */}
          <select 
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-500/30 transition-all dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="returned">Returned</option>
          </select>

          {/* Category Filter */}
          <select 
            value={filters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-500/30 transition-all dark:text-slate-300"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort By */}
          <select 
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-500/30 transition-all dark:text-slate-300"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
           {results.length} Matches Detected
        </div>
      </section>

      {/* Results Display */}
      <section className="relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="py-40 text-center space-y-6"
            >
              <div className="relative inline-block">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full"></div>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Scanning Campus Databases...</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={cn(
                "grid gap-8",
                view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}
            >
              {results.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {view === 'grid' ? (
                    <GlassCard className="flex flex-col h-full bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 group overflow-hidden">
                       <div className="aspect-[4/5] relative overflow-hidden m-2 rounded-[1.5rem]">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                            <Box className="w-16 h-16 text-slate-300 dark:text-slate-600 opacity-20" />
                          </div>
                        )}
                        <div className={cn(
                          "absolute top-4 left-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-xl border border-white/20",
                          item.status === 'lost' ? "bg-red-500/90 text-white" : 
                          item.status === 'found' ? "bg-emerald-500/90 text-white" : 
                          "bg-blue-600/90 text-white"
                        )}>
                          {item.status}
                        </div>
                      </div>
                      
                      <div className="p-6 pt-2 flex-grow flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{item.category}</span>
                        <h3 className="font-bold text-xl leading-tight dark:text-white mt-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
                        
                        <div className="space-y-3 mt-4 mb-8">
                          <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-300">
                            <MapPin className="w-4 h-4 mr-3 text-blue-500" />
                            {item.lost_location || item.found_location}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-400 dark:text-slate-400">
                            <Clock className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>

                        <div className="grid gap-2 mt-auto">
                           <Link to={item.status === 'lost' ? `/found?id=${item.id}` : `/lost?id=${item.id}`} className="w-full">
                              <Button variant="gradient" className="w-full rounded-2xl text-xs uppercase tracking-widest py-3">
                                 {item.status === 'found' ? 'Claim Request' : item.status === 'lost' ? 'I Found it' : 'View Intelligence'}
                              </Button>
                           </Link>
                           <Link to={`/${item.status === 'lost' ? 'lost' : 'found'}?id=${item.id}`} className="w-full">
                              <Button variant="outline" className="w-full rounded-2xl group/btn text-xs uppercase tracking-widest font-black">
                                 View Details
                              </Button>
                           </Link>
                        </div>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="flex items-center p-5 group bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                       <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10">
                            <Box className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="ml-8 flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{item.category}</span>
                            <h3 className="font-bold text-2xl dark:text-slate-50 mt-1">{item.title}</h3>
                          </div>
                          <div className={cn(
                              "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl",
                              item.status === 'lost' ? "bg-red-500 text-white" : 
                              item.status === 'found' ? "bg-emerald-500 text-white" : 
                              "bg-blue-600 text-white"
                          )}>{item.status}</div>
                        </div>
                        <div className="flex items-center gap-8 mt-4">
                          <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-300">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            {item.lost_location || item.found_location}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-400 dark:text-slate-400">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="ml-8">
                         <Link to={item.status === 'lost' ? `/found?id=${item.id}` : `/lost?id=${item.id}`}>
                            <Button variant="gradient" size="sm">Intel</Button>
                         </Link>
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-40 text-center glass rounded-[3rem] border-dashed border-2 space-y-8"
            >
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tight dark:text-white leading-none">Vacuum Detected</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">Campus radar returned zero signals for <span className="text-blue-500 font-black">"{query}"</span>. Sensors are fully operational.</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                 <Link to="/lost"><Button variant="outline">Browse Lost</Button></Link>
                 <Link to="/found"><Button variant="outline">Browse Found</Button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
