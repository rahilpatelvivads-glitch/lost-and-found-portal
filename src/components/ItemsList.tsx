import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Filter, MapPin, Calendar, ArrowUpRight, 
  Tag as TagIcon, LayoutGrid, List as ListIcon, Loader2,
  CheckCircle, HandHeart, Clock, Box
} from "lucide-react";
import { Button, GlassCard } from "../components/ui/UI";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";
import ClaimModal from "./ClaimModal";
import { returnedItemsService } from "../services/returnedItemsService";
import { toast } from "sonner";

interface ItemsListProps {
  type: 'lost' | 'found';
}

export default function ItemsList({ type }: ItemsListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [user, setUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const categories = ["All", "Electronics", "Books", "Bags", "Clothing", "Keys", "ID Cards/Wallets", "Jewelry", "Others"];

  const categoryMapping: Record<string, string> = {
    "electronic": "Electronics",
    "electronics": "Electronics",
    "tech": "Electronics",
    "gadget": "Electronics",
    "phone": "Electronics",
    "laptop": "Electronics",
    "bag": "Bags",
    "bags": "Bags",
    "backpack": "Bags",
    "book": "Books",
    "books": "Books",
    "notebook": "Books",
    "keys": "Keys",
    "key": "Keys",
    "wallet": "ID Cards/Wallets",
    "wallets": "ID Cards/Wallets",
    "id card": "ID Cards/Wallets",
    "card": "ID Cards/Wallets",
    "clothing": "Clothing",
    "clothes": "Clothing",
    "shirt": "Clothing",
    "pant": "Clothing",
    "jewelry": "Jewelry",
    "jewel": "Jewelry",
    "ring": "Jewelry",
    "watch": "Jewelry",
    "other": "Others",
    "others": "Others"
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setSelectedCategory("All");
      return;
    }
    
    const words = q.split(/\s+/);
    for (const word of words) {
      if (categoryMapping[word]) {
        setSelectedCategory(categoryMapping[word]);
        break;
      }
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchItems();

    // Set up real-time subscription
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: type === 'lost' ? 'lost_items' : 'found_items',
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchItems(); // Simple approach: refetch all items on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from(type === 'lost' ? 'lost_items' : 'found_items')
        .select('*')
        .neq('status', 'returned')
        .order('created_at', { ascending: false });

      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReturned = async (item: any) => {
    try {
      await returnedItemsService.markAsReturned(item.id, type, item.user_id);
      toast.success("Item marked as returned!");
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to update item status");
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.lost_location || item.found_location).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter capitalize dark:text-slate-100">
            {type} <span className="text-blue-600 dark:text-blue-400">Items</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Browse through active reports from across the campus ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2 glass p-1.5 rounded-2xl">
          <button 
            onClick={() => setView('grid')}
            className={cn("p-2.5 rounded-xl transition-all", view === 'grid' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200")}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn("p-2.5 rounded-xl transition-all", view === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200")}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-6">
        <GlassCard className="p-2 sm:p-3" hover={false} id="dashboard-search-container">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search items, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-32 py-5 rounded-[2rem] bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium transition-all text-lg"
              id="dashboard-search-input"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button 
                variant="gradient" 
                className="rounded-2xl px-8 py-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                id="dashboard-search-button"
              >
                Search
              </Button>
            </div>
          </div>
        </GlassCard>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-center px-1">
          {categories.map(cat => (
            <button
              key={cat}
              id={`category-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-full text-xs font-black whitespace-nowrap transition-all border tracking-[0.1em] uppercase",
                selectedCategory === cat 
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105" 
                  : "bg-white dark:bg-slate-900/50 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Display */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
            <Search className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Scanning Campus Network</p>
        </div>
      ) : (
        <div className={cn(
          view === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
            : "space-y-6"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                {view === 'grid' ? (
                  <GlassCard className="group flex flex-col h-full bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                    <div className="aspect-[4/5] relative overflow-hidden m-2 rounded-[1.5rem]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                         <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700">
                           <HandHeart className="w-16 h-16 opacity-20" />
                         </div>
                      )}
                      <div className="absolute top-4 left-4 flex gap-2">
                         <div className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-xl">
                           {item.category}
                         </div>
                      </div>
                      <div className={cn(
                        "absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl",
                        item.status === 'returned' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                      )}>
                        {item.status}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-xl leading-tight dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
                       
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
                        {item.status !== 'returned' && (
                          user && user.id === item.user_id ? (
                            <Button 
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsReturned(item);
                              }}
                              className="w-full bg-emerald-500 hover:bg-emerald-600"
                            >
                              Mark as Returned
                            </Button>
                          ) : (
                            <Button 
                              variant="gradient"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                                setIsClaimModalOpen(true);
                              }}
                              className="w-full"
                            >
                              {type === 'found' ? 'Claim Item' : 'I Found it'}
                            </Button>
                          )
                        )}
                        <Button variant="outline" className="w-full rounded-2xl">
                          View Details
                        </Button>
                       </div>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard className="flex items-center p-5 group cursor-pointer bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <Box className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="ml-8 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{item.category}</span>
                          <h3 className="font-bold text-2xl dark:text-slate-50 mt-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl",
                          item.status === 'returned' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                        )}>{item.status}</div>
                      </div>
                      <div className="flex items-center gap-8 mt-5">
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
                    <div className="flex flex-col gap-2 ml-8 min-w-[160px]">
                      {item.status !== 'returned' && (
                         user && user.id === item.user_id ? (
                          <Button 
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsReturned(item);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                          >
                            Returned
                          </Button>
                        ) : (
                          <Button 
                            variant="gradient"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setIsClaimModalOpen(true);
                            }}
                          >
                            {type === 'found' ? 'Claim Item' : 'I Found it'}
                          </Button>
                        )
                      )}
                      <Button variant="outline" size="sm" className="hidden md:flex rounded-xl">
                        View Item
                      </Button>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedItem && (
        <ClaimModal 
          item={selectedItem} 
          itemType={type} 
          isOpen={isClaimModalOpen} 
          onClose={() => {
            setIsClaimModalOpen(false);
            setSelectedItem(null);
          }} 
        />
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
           <div className="bg-slate-100 dark:bg-slate-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
             <Search className="w-10 h-10 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No items found</h3>
           <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">We couldn't find any items matching your current filters or search query.</p>
           <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
             Clear all filters
           </Button>
        </div>
      )}
    </div>
  );
}
