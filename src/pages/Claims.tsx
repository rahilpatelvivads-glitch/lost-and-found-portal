import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HandHeart, Clock, CheckCircle2, XCircle, AlertCircle, 
  MapPin, Calendar, Search, ShieldAlert, Sparkles, RefreshCw, 
  MessageSquare, UserCheck, Inbox, ArrowRight, Eye, Phone, HelpCircle
} from "lucide-react";
import { GlassCard, Button } from "../components/ui/UI";
import { claimService } from "../services/claimService";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Claims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  useEffect(() => {
    loadClaims();

    // Subscribe to claim changes in real time
    const channel = supabase
      .channel('claim-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claim_requests' },
        () => {
          loadClaims(false); // Silent re-check for real-time smoothness
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadClaims = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await claimService.getMyClaims();
      setClaims(data);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast.error("Unable to fetch claim records");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await loadClaims(true);
      toast.success("Claim ledger synchronized successfully!");
    } catch (error) {
      console.error("Error on sync:", error);
      toast.error("Unable to fetch claim records");
    }
  };

  // Stats Counters
  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const rejectedClaims = claims.filter(c => c.status === 'rejected').length;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          badge: 'bg-emerald-500 text-white',
          label: 'APPROVED',
          verification: 'Verified Owner',
          desc: 'Your evidence successfully matches. Claim finalized.'
        };
      case 'rejected':
        return {
          color: 'text-red-500 bg-red-500/10 border-red-500/20',
          badge: 'bg-red-500 text-white',
          label: 'REJECTED',
          verification: 'Verification Denied',
          desc: 'Declared credentials could not match reported parameters.'
        };
      case 'returned':
        return {
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          badge: 'bg-blue-600 text-white',
          label: 'RETURNED',
          verification: 'Successfully Returned',
          desc: 'Item is back in the possession of the certified owner.'
        };
      default: // pending
        return {
          color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
          badge: 'bg-yellow-500 text-slate-900',
          label: 'PENDING',
          verification: 'Pending Review',
          desc: 'The reported finder is verifying your stated credentials.'
        };
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-7xl mx-auto px-4 relative">
      {/* Background gradients */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10"></div>

      {/* Header section */}
      <section className="space-y-4 mb-10">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors mb-2 group">
           <Inbox className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Profile Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white leading-none">
              My Claim <span className="text-gradient">Requests</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm md:text-base">
              Monitor ownership verification procedures, system approval traces, and returned items.
            </p>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              onClick={handleSync} 
              className="rounded-2xl flex items-center gap-2 px-5 py-3 h-auto"
            >
              <RefreshCw className="w-4 h-4" /> Synchronize Ledger
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Querying claim databases...</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="space-y-12">
          {/* A A. Stats Header (Zero values) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-6 border-slate-100 dark:border-slate-800 text-center" hover={false}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Claims</p>
              <h3 className="text-3xl font-black dark:text-white">0</h3>
            </GlassCard>
            <GlassCard className="p-6 border-slate-100 dark:border-slate-800 text-center" hover={false}>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Pending Verification</p>
              <h3 className="text-3xl font-black text-yellow-500">0</h3>
            </GlassCard>
            <GlassCard className="p-6 border-slate-100 dark:border-slate-800 text-center" hover={false}>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Approved Claims</p>
              <h3 className="text-3xl font-black text-emerald-500">0</h3>
            </GlassCard>
            <GlassCard className="p-6 border-slate-100 dark:border-slate-800 text-center" hover={false}>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Rejected Claims</p>
              <h3 className="text-3xl font-black text-red-500">0</h3>
            </GlassCard>
          </div>

          {/* B B & C. Empty State */}
          <div className="text-center py-20 bg-white/40 dark:bg-slate-900/20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80 p-8">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative group">
              <HandHeart className="w-10 h-10 text-blue-500 animate-[pulse_2s_infinite]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight dark:text-white uppercase leading-none">No Claims Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto text-sm leading-relaxed">
                Your ownership verification requests will appear here.
              </p>
            </div>
            <Link to="/found-items" className="inline-block mt-6">
              <Button variant="gradient" className="rounded-xl px-6 py-3 font-semibold text-sm">
                Explore Found Items
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* A. Header stats dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <GlassCard className="p-6 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 relative overflow-hidden group" hover={false}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Claims Logs</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black dark:text-white">{totalClaims}</span>
                <span className="text-xs font-semibold text-slate-400">requests</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 relative overflow-hidden" hover={false}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest leading-none mb-2">Pending verification</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-yellow-600 dark:text-yellow-400">{pendingClaims}</span>
                <span className="text-xs font-bold text-yellow-500/70">awaiting</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 relative overflow-hidden" hover={false}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-2">Approved Claims</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-emerald-500">{approvedClaims}</span>
                <span className="text-xs font-bold text-emerald-500/70">certified</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 relative overflow-hidden" hover={false}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-2">Rejected Claims</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-red-500">{rejectedClaims}</span>
                <span className="text-xs font-bold text-red-500/70">canceled</span>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* C. Professional Claims Cards List */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Claim Trajectories</h2>
              <AnimatePresence mode="popLayout">
                {claims.map((claim, idx) => {
                  const item = claim.lost_items || claim.found_items || {
                    title: "Deleted Item",
                    category: "Unknown",
                    lost_location: "Campus",
                    found_location: "Campus",
                    image_url: "",
                    description: "Supplementary description record was cleared."
                  };
                  
                  const isLost = claim.item_type === 'lost';
                  const location = item.lost_location || item.found_location;
                  const itemDate = item.lost_date || item.found_date;
                  const formattedItemDate = itemDate ? format(new Date(itemDate), 'MMM d, yyyy') : 'No Date';
                  const statInfo = getStatusInfo(claim.status);

                  return (
                    <motion.div
                      key={claim.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <GlassCard 
                        className="p-6 md:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/20 hover:shadow-xl transition-all"
                        hover={true}
                      >
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                          
                          {/* Item Image */}
                          <div className="w-full md:w-44 h-40 bg-slate-50 dark:bg-slate-950/40 rounded-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800/80 shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="text-slate-300 dark:text-slate-700">
                                <HandHeart className="w-12 h-12 stroke-[1.5]" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-0.5 bg-white/90 dark:bg-slate-950/95 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 shadow">
                                {item.category}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${isLost ? 'bg-orange-500/15 text-orange-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                                {claim.item_type}
                              </span>
                            </div>
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-extrabold text-xl dark:text-white uppercase tracking-wide leading-snug truncate max-w-sm">
                                  {item.title}
                                </h3>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black tracking-widest border font-sans",
                                  statInfo.color
                                )}>
                                  {statInfo.label}
                                </span>
                              </div>
                              
                              <p className="text-xs text-slate-400 font-extrabold flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Filed {claim.created_at ? format(new Date(claim.created_at), 'PPPP') : ''}
                              </p>

                              {/* Message statement */}
                              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed italic relative">
                                <MessageSquare className="w-3.5 h-3.5 absolute right-4 top-4 text-slate-300 dark:text-slate-700" />
                                <strong className="block text-[8px] font-black uppercase tracking-widest text-slate-400 not-italic mb-1 leading-none">Your Verification Statement:</strong>
                                "{claim.message}"
                              </div>
                            </div>

                            {/* Verification Footer stats */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {location}</span>
                                <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-indigo-500" /> {statInfo.verification}</span>
                              </div>

                              <div>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => setSelectedClaim(claim)}
                                  className="rounded-xl px-4 py-2 font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 h-auto text-slate-600 dark:text-slate-200"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-500" /> View Details
                                </Button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* B. Claim timeline visual tracker */}
            <div className="space-y-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Verification Timeline</h2>
              <GlassCard className="p-6 md:p-8 space-y-8 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-950/30" hover={false}>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-wider">Milestones Overview</h4>
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                    Staged trajectory showing the status updates of your claim requests.
                  </p>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800/80 space-y-8">
                  {claims.slice(0, 4).map((claim, idx) => {
                    const item = claim.lost_items || claim.found_items || { title: "Item" };
                    const detail = getStatusInfo(claim.status);
                    
                    return (
                      <div key={idx} className="relative group">
                        {/* Bullet circle */}
                        <span className={cn(
                          "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-slate-100 dark:border-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-125",
                          claim.status === 'approved' ? 'bg-emerald-500' :
                          claim.status === 'rejected' ? 'bg-red-500' :
                          claim.status === 'returned' ? 'bg-blue-500' : 'bg-yellow-500 animate-pulse'
                        )}></span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {claim.created_at ? format(new Date(claim.created_at), 'MMM d, h:mm a') : 'Recent'}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-800 dark:text-white leading-none">
                            {item.title}
                          </h5>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                            {detail.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative group">
                    <span className="absolute -left-[27px] top-1 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest leading-none">Portal Gateway Active</h5>
                      <p className="text-slate-500 text-[10px] font-semibold">Ready to receive updates.</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* Claim Detail Modal overlay */}
      <AnimatePresence>
        {selectedClaim && (() => {
          const item = selectedClaim.lost_items || selectedClaim.found_items || {};
          const statInfo = getStatusInfo(selectedClaim.status);
          const location = item.lost_location || item.found_location;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedClaim(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
              >
                <div className="relative aspect-[16/9] bg-slate-50 dark:bg-slate-950">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-800">
                      <HandHeart className="w-16 h-16 stroke-[1.2]" />
                    </div>
                  )}

                  <button 
                    onClick={() => setSelectedClaim(null)}
                    className="absolute top-4 right-4 p-2 bg-slate-950/50 hover:bg-slate-950 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-white/95 dark:bg-slate-900/95 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-800 dark:text-white shadow">
                      {item.category}
                    </span>
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow border", statInfo.color)}>
                      {statInfo.label}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-wide tracking-tight text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold">
                      Stored declaration record associated via {selectedClaim.item_type} protocol
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Incident Area</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-white leading-tight">
                          {location || 'General Campus'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Stated Occurrence</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-white leading-tight">
                          {item.lost_date || item.found_date ? format(new Date(item.lost_date || item.found_date), 'MMMM d, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statement of Ownership Proof</label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/40 whitespace-pre-wrap font-semibold leading-relaxed">
                      "{selectedClaim.message}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Backup Channel Contact</label>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800/40">
                      <Phone className="w-4 h-4 text-emerald-500 mr-2" /> {selectedClaim.contact_info || "No supplemental details declared."}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                      Claim requests rely on verification matching by administrative moderators and finders. Contact campus support if help is needed.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setSelectedClaim(null)} className="rounded-xl px-6">
                      Close Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
