import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Calendar, ArrowRight, HandHeart, Search, Sparkles, Brain, History, ShieldCheck, AlertCircle, ChevronRight, HelpCircle } from "lucide-react";
import { Button, GlassCard } from "../components/ui/UI";
import { searchService, SearchResult } from "../services/searchService";
import { cn } from "../lib/utils";

interface AIAnalysis {
  intent: 'lost' | 'found' | 'none';
  category: string;
  keywords: string[];
  location?: string;
  confidence: number;
}

export default function SmartSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query) {
      smartSearch();
    }
  }, [query]);

  async function smartSearch() {
    try {
      setLoading(true);
      setAnalyzing(true);

      // 1. Get AI Analysis from our API
      const analysisRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      const aiData = await analysisRes.json();
      setAnalysis(aiData);
      setAnalyzing(false);

      // 2. Search Supabase based on AI data
      // We search across all relevant tables
      const searchResults = await searchService.searchItems(aiData.keywords.join(" "), {
        status: aiData.intent === 'none' ? 'all' : aiData.intent,
        category: aiData.category !== 'All' ? aiData.category : undefined
      });

      // 3. Score results based on match similarity
      const scoredResults = searchResults.map(item => {
        let score = 80; // Base score for keyword matches
        
        // Bonus for category match
        if (item.category.toLowerCase() === aiData.category.toLowerCase()) score += 15;
        
        // Bonus for intent match
        if (item.status === aiData.intent) score += 5;

        // Cap at 99
        score = Math.min(score, 99);
        
        return { ...item, matchScore: score };
      });

      setResults(scoredResults);
    } catch (error) {
      console.error("Smart search failed:", error);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }

  const getConfidenceLevel = (score: number) => {
    if (score > 90) return { label: "High Confidence", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (score > 80) return { label: "Likely Match", color: "text-blue-500", bg: "bg-blue-500/10" };
    return { label: "Potential Match", color: "text-amber-500", bg: "bg-amber-500/10" };
  };

  return (
    <div className="min-h-screen pb-20 pt-24 px-4 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-40 right-[10%] w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            AI Smart Command Processing
          </motion.div>
          
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white">
              "{query}"
            </h1>
            <motion.div 
               animate={{ opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute -top-6 -right-6"
            >
               <Brain className="w-12 h-12 text-blue-500/20" />
            </motion.div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 text-slate-400 font-bold"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  Analyzing Intent & Context...
                </motion.div>
              ) : analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-500">Detected Intent:</span>
                    <span className="text-xs font-black uppercase tracking-tight text-emerald-500">{analysis.intent}</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-500">Category:</span>
                    <span className="text-xs font-black uppercase tracking-tight text-blue-500">{analysis.category}</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-500">AI Confidence:</span>
                    <span className="text-xs font-black uppercase tracking-tight text-purple-500">{analysis.confidence}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Results Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-black tracking-tighter dark:text-white flex items-center gap-3">
               Smart Matches
               <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">{results.length} results</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-96 rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
                ))
              ) : results.length > 0 ? (
                results.map((item: any, i) => {
                  const conf = getConfidenceLevel(item.matchScore);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <GlassCard className="p-6 h-full flex flex-col group relative overflow-hidden" hover={true}>
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative mb-6">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                              <HandHeart className="w-16 h-16 opacity-10" />
                            </div>
                          )}
                          <div className={cn(
                            "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl z-10",
                            item.status === 'lost' ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {item.status}
                          </div>
                          
                          {/* Confidence Badge */}
                          <div className={cn(
                            "absolute bottom-4 right-4 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-2xl z-10",
                            conf.bg
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", item.matchScore > 90 ? "bg-emerald-500" : "bg-blue-500")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", conf.color)}>
                              {item.matchScore}% Match
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 relative z-10 flex-1 flex flex-col">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{item.category}</span>
                            <h3 className="text-2xl font-black tracking-tight dark:text-white mt-1 line-clamp-2 leading-tight">
                               {item.title}
                            </h3>
                          </div>

                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" /> {item.lost_location || item.found_location}
                          </p>

                          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <Link to={`/${item.status === 'lost' ? 'lost' : 'found'}?id=${item.id}`}>
                              <Button variant="gradient" size="sm" className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-32 text-center glass border-dashed rounded-[3rem] space-y-6"
                >
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
                    <HelpCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight dark:text-white">No direct matches identified</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto">
                      AI system couldn't find exact matches for "{query}". Try checking our full lost & found boards.
                    </p>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    <Link to="/lost">
                      <Button variant="outline" className="rounded-2xl">Lost Board</Button>
                    </Link>
                    <Link to="/found">
                      <Button variant="outline" className="rounded-2xl">Found Board</Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
