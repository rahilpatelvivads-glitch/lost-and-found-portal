import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  Users, Package, CheckCircle, ShieldAlert, 
  Trash2, Search, Filter, MoreHorizontal, Download, ArrowUpRight, TrendingUp,
  HandHeart, XCircle, Clock, Mail, MapPin, Box
} from "lucide-react";
import { GlassCard, Button } from "../components/ui/UI";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { claimService } from "../services/claimService";
import { returnedItemsService } from "../services/returnedItemsService";
import { notificationService } from "../services/notificationService";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchReports();
    fetchClaims();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: lostData, error: lostError } = await supabase.from('lost_items').select('*');
      const { data: foundData, error: foundError } = await supabase.from('found_items').select('*');
      
      if (lostError) throw lostError;
      if (foundError) throw foundError;

      const lost = (lostData || []).map(i => ({ ...i, type: 'lost' }));
      const found = (foundData || []).map(i => ({ ...i, type: 'found' }));
      
      const all = [...lost, ...found].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReports(all);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const allClaims = await claimService.getAllClaims();
      setClaims(allClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm("Delete this report?")) return;
    const table = type === 'lost' ? 'lost_items' : 'found_items';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast.success("Report deleted");
      fetchReports();
    }
  };

  const markAsReturned = async (id: string, type: string, ownerId: string) => {
    try {
      // Find if there's an approved claim for this item to get the finder/claimant details
      const { data: claims } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('item_id', id)
        .eq('item_type', type)
        .eq('status', 'approved')
        .single();

      let finderId = undefined;
      let matchedItemId = undefined;

      if (claims) {
        // If it was a lost item being claimed, the claimant is the owner, and the user who found it is the finder
        // Actually, logic depends on who reported what. 
        // For simplicity: if the item being marked is the one that was 'found', the claimant is likely the owner.
        if (type === 'found') {
          finderId = ownerId; // Original reporter of the found item
          const ownerIdFromClaim = claims.claimant_id;
          await returnedItemsService.markAsReturned(id, 'found', ownerIdFromClaim, finderId, claims.matched_item_id);
        } else {
          // If marking a lost item as returned
          await returnedItemsService.markAsReturned(id, 'lost', ownerId, undefined, claims.matched_item_id);
        }
      } else {
        await returnedItemsService.markAsReturned(id, type as any, ownerId);
      }

      toast.success("Transaction finalized in ledger");
      fetchReports();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleClaimAction = async (claim: any, status: 'approved' | 'rejected') => {
    try {
      await claimService.updateClaimStatus(claim.id, status);
      
      const item = claim.lost_items || claim.found_items;
      
      await notificationService.createNotification(
        claim.claimant_id,
        `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your claim for "${item.title}" has been ${status}. ${status === 'approved' ? 'Please check your contact info for next steps.' : ''}`
      );

      toast.success(`Claim ${status}`);
      fetchClaims();
    } catch (error) {
      toast.error("Failed to update claim");
    }
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'EEE');
  };

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'EEE');
  }).reverse();

  const temporalData = last7Days.map(day => {
    const dayReports = reports.filter(r => getDayName(r.created_at) === day);
    return {
      name: day,
      lost: dayReports.filter(r => r.type === 'lost').length,
      found: dayReports.filter(r => r.type === 'found').length,
    };
  });

  const categoryData = reports.reduce((acc: any[], report) => {
    const label = report.category.substring(0, 6);
    const existing = acc.find(item => item.n === label);
    if (existing) {
      existing.v += 1;
    } else {
      acc.push({ n: label, v: 1 });
    }
    return acc;
  }, []).slice(0, 5);

  if (!isAdmin && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
        <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-500/20">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">Security Violation</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">Elevated privileges are required to access the central campus intelligence terminal.</p>
        </div>
        <Button variant="gradient" onClick={() => window.location.href = '/'}>Return to Surface</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 relative px-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/20">Authorized Access</div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter dark:text-white leading-none">Command Center</h1>
          <p className="text-slate-500 font-medium mt-3 text-lg">Central hub for monitoring and managing the campus recovery network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl" onClick={fetchReports}>
             <Clock className="w-4 h-4 mr-2" /> Sync Records
          </Button>
          <Button variant="gradient" className="rounded-2xl shadow-xl shadow-indigo-500/20">
            <Download className="w-4 h-4 mr-2" /> Export Intelligence
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 glass p-1.5 rounded-3xl w-fit">
        {["Overview", "Reports", "Claims", "Network"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeTab === tab.toLowerCase() 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                : "text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Total Operations", value: reports.length, icon: Package, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/10" },
              { label: "Successful Recoveries", value: reports.filter(r => r.status === 'returned').length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/10" },
              { label: "Active Missing", value: reports.filter(r => r.type === 'lost' && r.status !== 'returned').length, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/10" },
              { label: "Unidentified Assets", value: reports.filter(r => r.type === 'found' && r.status !== 'returned').length, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/10" },
            ].map((stat, i) => (
              <GlassCard key={i} className={cn("p-10 relative overflow-hidden group", stat.border)} hover={true}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                   <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-current/20", stat.bg, stat.color)}>
                    <stat.icon className="w-7 h-7" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                   <h3 className="text-5xl font-black mt-3 tracking-tighter dark:text-slate-100">{stat.value}</h3>
                   <div className="mt-8 flex items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                      LIVE FEED <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 animate-pulse" />
                   </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <GlassCard className="p-10" hover={false}>
              <div className="flex justify-between items-center mb-12">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 flex items-center">
                  Operational Flow <TrendingUp className="w-4 h-4 ml-3 text-blue-500" />
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Lost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Found</span>
                  </div>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={temporalData}>
                    <defs>
                      <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: '900'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: '900'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15)' }}
                    />
                    <Area type="monotone" dataKey="lost" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorLost)" />
                    <Area type="monotone" dataKey="found" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorFound)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-10" hover={false}>
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 mb-12 flex items-center">
                System Distribution <ArrowUpRight className="w-4 h-4 ml-3 text-indigo-500" />
              </h3>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: '900'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: '900'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="v" fill="url(#premium-gradient)" radius={[12, 12, 0, 0]} barSize={50}>
                       <defs>
                        <linearGradient id="premium-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                 </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <GlassCard className="overflow-hidden border-slate-200 dark:border-slate-800" hover={false}>
           <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full max-m-md group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  placeholder="Query global encrypted records..." 
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium transition-all" 
                />
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" size="sm" className="rounded-xl"><Filter className="w-4 h-4 mr-2" /> Parameters</Button>
              </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-y border-slate-100 dark:border-slate-800">
                   <th className="px-8 py-6">Intelligence Profile</th>
                   <th className="px-8 py-6">Priority</th>
                   <th className="px-8 py-6">Sector</th>
                   <th className="px-8 py-6">Status Indicator</th>
                   <th className="px-8 py-6 text-right">Execution</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {reports.map((report) => (
                   <tr key={report.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all duration-300">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                              {report.image_url ? (
                                <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                   <Package className="w-5 h-5" />
                                </div>
                              )}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{report.title}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{format(new Date(report.created_at), 'MMM dd | HH:mm')}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                          report.type === 'lost' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                        )}>
                          {report.type}
                        </span>
                     </td>
                     <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{report.category}</p>
                        <p className="text-[10px] text-slate-400 flex items-center mt-1">
                           <MapPin className="w-3 h-3 mr-2" /> {report.lost_location || report.found_location}
                        </p>
                     </td>
                     <td className="px-8 py-6">
                        <div className={cn(
                          "flex items-center gap-3 px-3 py-1.5 rounded-xl border w-fit font-black text-[10px] uppercase tracking-widest",
                          report.status === 'returned' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-blue-500/5 text-blue-600 border-blue-500/10"
                        )}>
                          <span className={cn("w-2 h-2 rounded-full bg-current")} />
                          {report.status}
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {report.status !== 'returned' && (
                             <button onClick={() => markAsReturned(report.id, report.type, report.user_id)} className="w-10 h-10 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center">
                               <CheckCircle className="w-5 h-5" />
                             </button>
                           )}
                           <button onClick={() => handleDelete(report.id, report.type)} className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center">
                             <Trash2 className="w-5 h-5" />
                           </button>
                           <button className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all flex items-center justify-center">
                              <MoreHorizontal className="w-5 h-5" />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displaying {reports.length} Verified Records</p>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="rounded-xl px-6" disabled>Prev</Button>
                 <Button variant="outline" size="sm" className="rounded-xl px-6" disabled>Next</Button>
              </div>
           </div>
        </GlassCard>
      )}

      {activeTab === "claims" && (
        <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
           {claims.map((claim) => {
             const item = claim.lost_items || claim.found_items;
             return (
               <GlassCard key={claim.id} className="p-10 border-slate-100 dark:border-slate-800" hover={true}>
                 <div className="flex flex-col lg:flex-row gap-10">
                   <div className="w-full lg:w-48 h-48 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item?.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300" />
                      )}
                      <div className="absolute top-4 left-4">
                         <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Target Item</span>
                      </div>
                   </div>
                   
                   <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-3xl font-black tracking-tighter dark:text-white">{item?.title}</h3>
                            <div className="flex items-center gap-4 mt-2">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">
                                     {claim.users?.name?.charAt(0) || 'U'}
                                  </div>
                                  {claim.users?.name || 'Authorized Claimant'}
                               </div>
                               <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                               <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{claim.item_type} CLAIM</div>
                            </div>
                         </div>
                         <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                            claim.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                            claim.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                         )}>
                           {claim.status}
                         </div>
                      </div>

                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                         <div className="text-slate-400 absolute top-4 right-4">
                            <ArrowUpRight className="w-4 h-4" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Claimant Intelligence Statement</p>
                         <p className="text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">"{claim.message}"</p>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                               <Mail className="w-4 h-4" />
                               {claim.contact_info}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                               <Clock className="w-4 h-4" />
                               {format(new Date(claim.created_at), 'MMM dd')}
                            </div>
                         </div>
                         
                         {claim.status === 'pending' && (
                           <div className="flex gap-2">
                             <Button 
                               variant="gradient" 
                               size="sm" 
                               className="rounded-xl px-8"
                               onClick={() => handleClaimAction(claim, 'approved')}
                             >
                               Validate & Release
                             </Button>
                             <button 
                               onClick={() => handleClaimAction(claim, 'rejected')}
                               className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all"
                             >
                               Negate Claim
                             </button>
                           </div>
                         )}
                      </div>
                   </div>
                 </div>
               </GlassCard>
             );
           })}

           {claims.length === 0 && (
             <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center">
                   <HandHeart className="w-10 h-10 text-slate-300" />
                </div>
                <div className="space-y-1">
                   <p className="text-xl font-black tracking-tight dark:text-white uppercase tracking-widest text-xs">Clear Signal</p>
                   <p className="text-slate-500 font-medium">No pending validation requests identified.</p>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === "network" && (
        <div className="py-32 flex flex-col items-center justify-center space-y-8 animate-pulse">
           <div className="w-32 h-32 bg-indigo-600/5 rounded-[3rem] border border-indigo-500/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e522,transparent_70%)] animate-pulse"></div>
              <TrendingUp className="w-12 h-12 text-indigo-500 relative z-10" />
           </div>
           <div className="text-center space-y-2">
              <p className="text-3xl font-black tracking-tighter dark:text-white uppercase tracking-widest text-xs">Network Analysis Engaged</p>
              <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">Assembling behavioral campus intelligence metrics...</p>
           </div>
        </div>
      )}
    </div>
  );
}
