import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Clock, MapPin, Box, ArrowLeft } from "lucide-react";
import { GlassCard, Button } from "../components/ui/UI";
import { returnedItemsService } from "../services/returnedItemsService";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ReturnedItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturnedItems();

    const lostChannel = supabase
      .channel('returned-lost')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items', filter: 'status=eq.returned' }, () => {
        loadReturnedItems();
      })
      .subscribe();

    const foundChannel = supabase
      .channel('returned-found')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'found_items', filter: 'status=eq.returned' }, () => {
        loadReturnedItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lostChannel);
      supabase.removeChannel(foundChannel);
    };
  }, []);

  const loadReturnedItems = async () => {
    setLoading(true);
    try {
      const data = await returnedItemsService.getReturnedItems();
      setItems(data);
    } catch (error) {
      console.error("Error fetching returned items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 relative px-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mt-12">
        <div className="space-y-6">
          <Link to="/found" className="group flex items-center gap-3 text-slate-400 hover:text-blue-500 transition-all font-black text-[10px] uppercase tracking-[0.2em]">
             <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-4 h-4" /> 
             </div>
             Back to active grid
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="px-3 py-1 bg-emerald-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">Archived Records</div>
            </div>
            <h1 className="text-7xl font-black tracking-tighter dark:text-slate-100 leading-none">Returned <span className="text-emerald-500">Archive</span></h1>
            <p className="text-slate-500 dark:text-slate-300 font-medium mt-4 text-xl max-w-xl leading-relaxed">A permanent ledger of successfully resolved cases and reunited assets within the campus network.</p>
          </div>
        </div>
        
        <GlassCard className="p-10 text-center min-w-[280px] border-emerald-500/10 hover:border-emerald-500/30 transition-all" hover={true}>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Success Velocity</p>
           <p className="text-7xl font-black text-emerald-500 dark:text-emerald-400 tracking-tighter">{items.length}</p>
           <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 py-2 px-4 rounded-full">
              <CheckCircle className="w-3 h-3" /> VERIFIED RECOVERIES
           </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-8">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10">
             <Clock className="w-12 h-12 text-emerald-600 animate-spin" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Decrypting archive records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-40 glass rounded-[4rem] border-slate-200 dark:border-slate-800 space-y-10">
           <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-800">
              <Box className="w-12 h-12 text-slate-200" />
           </div>
           <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tight dark:text-slate-100 uppercase tracking-widest text-xs">Pristine Archive</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">The resolution ledger is currently empty. Successful item reunions will be permanently logged here.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.7, ease: "easeOut" }}
              >
                <GlassCard className="h-full flex flex-col group hover:border-emerald-500/30 transition-all border-slate-200 dark:border-slate-800 overflow-hidden rounded-[2.5rem]" hover={true}>
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200 dark:text-slate-800">
                        <CheckCircle className="w-24 h-24 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-6 left-6 bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> RESOLVED CASE
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Sector: {item.category}</span>
                      </div>
                      <h3 className="text-3xl font-black dark:text-slate-100 mt-1 line-clamp-2 leading-tight tracking-tighter">{item.title}</h3>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 transition-colors group-hover:border-emerald-500/10">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Operational Intelligence</p>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-300 flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-emerald-500" /> {item.lost_location || item.found_location}
                        </p>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-300 flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-500" /> Resolved {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 mt-auto border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID {item.id.substring(0, 12)}</span>
                       <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest h-9">
                          Case File
                       </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
