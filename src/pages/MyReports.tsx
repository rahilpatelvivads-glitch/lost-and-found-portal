import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, MapPin, Calendar, Trash2, Edit, Eye, 
  CheckCircle, Clock, ArrowLeft, Phone, AlertCircle, X, Search, Filter, RefreshCw
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { GlassCard, Button } from "../components/ui/UI";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function MyReports() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [lostReports, setLostReports] = useState<any[]>([]);
  const [foundReports, setFoundReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modals state
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    location: "",
    date: "",
    contact: "",
    description: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Hidden items for frontend-only deletion
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const categories = ["All", "Electronics", "Books", "Bags", "Clothing", "Keys", "ID Cards/Wallets", "Jewelry", "Others"];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        const storedHidden = localStorage.getItem(`my_reports_hidden_${user.id}`);
        if (storedHidden) {
          setHiddenIds(JSON.parse(storedHidden));
        }
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyReports();
    }
  }, [user]);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const [lostRes, foundRes] = await Promise.all([
        supabase
          .from('lost_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('found_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (lostRes.error) throw lostRes.error;
      if (foundRes.error) throw foundRes.error;

      setLostReports(lostRes.data || []);
      setFoundReports(foundRes.data || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReturned = async (item: any, type: 'lost' | 'found') => {
    try {
      const table = type === 'lost' ? 'lost_items' : 'found_items';
      const { error } = await supabase
        .from(table)
        .update({ status: 'returned' })
        .eq('id', item.id);

      if (error) throw error;

      toast.success("Item successfully status updated to Returned!");
      
      // Update local state
      if (type === 'lost') {
        setLostReports(prev => prev.map(r => r.id === item.id ? { ...r, status: 'returned' } : r));
      } else {
        setFoundReports(prev => prev.map(r => r.id === item.id ? { ...r, status: 'returned' } : r));
      }

      if (viewItem?.id === item.id) {
        setViewItem({ ...viewItem, status: 'returned' });
      }
    } catch (error: any) {
      console.error("Error marking returned:", error);
      toast.error(error.message || "Failed to mark item as returned");
    }
  };

  // Frontend-only delete (no actual DB deletion)
  const handleDeleteFrontend = (id: string) => {
    const updated = [...hiddenIds, id];
    setHiddenIds(updated);
    if (user) {
      localStorage.setItem(`my_reports_hidden_${user.id}`, JSON.stringify(updated));
    }
    toast.success("Report hidden from view dashboard");
    if (viewItem?.id === id) {
      setViewItem(null);
    }
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      category: item.category,
      location: item.lost_location || item.found_location || "",
      date: item.lost_date || item.found_date || "",
      contact: item.contact || "",
      description: item.description || ""
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSavingEdit(true);

    try {
      const isLostItem = 'lost_location' in editItem;
      const table = isLostItem ? 'lost_items' : 'found_items';
      
      const updateData = {
        title: editForm.title,
        category: editForm.category,
        description: editForm.description,
        contact: editForm.contact,
        [isLostItem ? 'lost_location' : 'found_location']: editForm.location,
        [isLostItem ? 'lost_date' : 'found_date']: editForm.date,
      };

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', editItem.id);

      if (error) throw error;

      toast.success("Report updated successfully");
      
      // Refetch
      await fetchMyReports();
      setEditItem(null);
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error(error.message || "Failed to update report");
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      lost: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
      found: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      returned: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      claimed: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
    };
    
    const label = status.toUpperCase();
    const styleClass = styles[status as keyof typeof styles] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
    
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${styleClass}`}>
        {label}
      </span>
    );
  };

  const currentReports = activeTab === 'lost' ? lostReports : foundReports;

  // Filter items
  const filteredReports = currentReports.filter(item => {
    if (hiddenIds.includes(item.id)) return false;
    
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lost_location || item.found_location || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-7xl mx-auto px-4 relative">
      {/* Background blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10 animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -z-10 animate-blob" style={{ animationDelay: '2s' }}></div>

      <section className="space-y-4 mb-10">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors mb-2 group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Profile
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white leading-none">
              My reported <span className="text-gradient">Items</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-base max-w-xl">
              Track, modify, and update the status of your reported lost and found campus activities.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchMyReports} className="rounded-2xl p-3">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link to="/report">
              <Button variant="gradient" className="rounded-2.5xl px-6 py-3 shadow-xl">
                Report New Item
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs list toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex glass p-1.5 rounded-[1.8rem] shadow-xl border border-white/10">
          <button
            onClick={() => { setActiveTab('lost'); }}
            className={`px-8 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'lost' 
                ? "bg-blue-600 shadow-xl text-white" 
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Lost Reports
          </button>
          <button
            onClick={() => { setActiveTab('found'); }}
            className={`px-8 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'found' 
                ? "bg-emerald-600 shadow-xl text-white" 
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Found Reports
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-1 md:col-span-2" hover={false}>
          <div className="relative flex items-center">
            <Search className="absolute left-5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search my reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 font-semibold focus:outline-none focus:ring-0 text-sm"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-1" hover={false}>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-5 pr-10 py-3 rounded-2xl bg-transparent text-slate-900 dark:text-slate-100 font-semibold text-sm focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All" className="bg-white dark:bg-slate-900">All Categories</option>
              {categories.slice(1).map(c => (
                <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </GlassCard>
      </div>

      {/* Main content view */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Querying database securely...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight dark:text-white uppercase leading-none">No active reports</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
              No matching records found. Any matching lost or found declarations you make will list here.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredReports.map((item, i) => {
              const location = item.lost_location || item.found_location;
              const dateStr = item.lost_date || item.found_date;
              const formattedDate = dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : '';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className="flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/60 overflow-hidden relative group">
                    
                    {/* Item Image */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-50 dark:bg-slate-950/30">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-800">
                          <Package className="w-12 h-12 stroke-[1.5]" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 shadow-md">
                          {item.category}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-xl leading-tight dark:text-white line-clamp-2 uppercase tracking-wide group-hover:text-blue-500 transition-colors">
                          {item.title}
                        </h3>
                        
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 mr-2.5 text-blue-500" />
                            {location}
                          </div>
                          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 mr-2.5 text-indigo-500" />
                            {formattedDate}
                          </div>
                          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            Reported {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                        <Button 
                          variant="secondary" 
                          onClick={() => setViewItem(item)}
                          className="rounded-xl py-2 text-xs flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => openEditModal(item)}
                          className="rounded-xl py-2 text-xs flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Button>
                        
                        {item.status !== 'returned' && (
                          <button
                            onClick={() => handleMarkAsReturned(item, activeTab)}
                            className="col-span-2 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1 border border-emerald-500/10"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark as Returned
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteFrontend(item.id)}
                          className="col-span-2 w-full py-2 bg-red-500/5 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-500/5 hover:border-red-600 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Report (Hide)
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* View Modal overlay */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-950">
                {viewItem.image_url ? (
                  <img src={viewItem.image_url} alt={viewItem.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-800">
                    <Package className="w-16 h-16 stroke-[1.2]" />
                  </div>
                )}
                
                <button 
                  onClick={() => setViewItem(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/50 hover:bg-slate-950 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="px-3.5 py-1 bg-white/95 dark:bg-slate-900/95 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white shadow">
                    {viewItem.category}
                  </span>
                  {getStatusBadge(viewItem.status)}
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide tracking-tight text-slate-900 dark:text-white leading-tight">
                    {viewItem.title}
                  </h2>
                  <p className="text-slate-400 text-xs font-semibold">
                    Reported {format(new Date(viewItem.created_at), 'PPPP')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Declared Location</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-white leading-tight">
                        {viewItem.lost_location || viewItem.found_location}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Incident Date</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-white leading-tight">
                        {viewItem.lost_date || viewItem.found_date ? format(new Date(viewItem.lost_date || viewItem.found_date), 'MMMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Contact Information</label>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex items-center gap-2 border border-slate-100 dark:border-slate-800/40 leading-none">
                    <Phone className="w-4 h-4 text-emerald-500 mr-2" />
                    {viewItem.contact || "No custom contact detailed"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Item Description</label>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/40 whitespace-pre-wrap">
                    {viewItem.description || "No supplemental details declared."}
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  {viewItem.status !== 'returned' && (
                    <Button 
                      variant="primary"
                      onClick={() => {
                        handleMarkAsReturned(viewItem, 'lost_location' in viewItem ? 'lost' : 'found');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-6"
                    >
                      Mark as Returned
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setViewItem(null)} className="rounded-xl px-6">
                    Close Details
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal overlay */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">
                  Edit Reported Record
                </h3>
                <button onClick={() => setEditItem(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Item Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                    >
                      {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Date</label>
                    <input
                      type="date"
                      required
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Location</label>
                    <input
                      type="text"
                      required
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Contact</label>
                    <input
                      type="text"
                      required
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Item Description</label>
                  <textarea
                    rows={4}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Button variant="outline" type="button" onClick={() => setEditItem(null)} className="rounded-xl px-5">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={savingEdit} className="rounded-xl px-6">
                    {savingEdit ? "Updating..." : "Save Decisions"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
