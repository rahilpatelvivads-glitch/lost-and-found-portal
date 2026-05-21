import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Package, MapPin, Calendar, Phone, Image as ImageIcon, 
  Send, AlertCircle, CheckCircle, Type, Info, ChevronRight, X, Loader2
} from "lucide-react";
import { Button, GlassCard } from "../components/ui/UI";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";

export default function ReportItem() {
  const { type = "lost" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLost, setIsLost] = useState(type === "lost");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Electronics",
    description: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    contact: "",
  });

  const categories = ["Electronics", "Books", "Bags", "Clothing", "Keys", "ID Cards/Wallets", "Jewelry", "Others"];

  useEffect(() => {
    setIsLost(type === "lost");
  }, [type]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to report an item");
        navigate("/auth");
        return;
      }

      let image_url = "";
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${isLost ? 'lost' : 'found'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);
        
        image_url = publicUrl;
      }

      const table = isLost ? 'lost_items' : 'found_items';
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        [isLost ? 'lost_location' : 'found_location']: formData.location,
        [isLost ? 'lost_date' : 'found_date']: formData.date,
        contact: formData.contact,
        image_url,
        user_id: user.id,
        status: isLost ? 'lost' : 'found'
      };

      const { error } = await supabase.from(table).insert([payload]);
      if (error) throw error;

      toast.success(`Successfully reported ${isLost ? 'lost' : 'found'} item!`);
      navigate(isLost ? "/lost" : "/found");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 relative">
       {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-blob"></div>

      <div className="mb-16 text-center space-y-6">
        <div className="inline-flex glass p-1.5 rounded-full shadow-2xl">
           <button
            onClick={() => { setIsLost(true); navigate("/report/lost"); }}
            className={cn(
              "px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              isLost ? "bg-blue-600 shadow-xl text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
           >
            Lost Item
           </button>
           <button
             onClick={() => { setIsLost(false); navigate("/report/found"); }}
             className={cn(
               "px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
               !isLost ? "bg-emerald-500 shadow-xl text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
             )}
           >
            Found Item
           </button>
        </div>
        <h1 className="text-6xl font-black tracking-tighter dark:text-white leading-tight">
          Report <span className="text-gradient leading-relaxed">{isLost ? 'Lost' : 'Found'}</span> Activity
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium text-lg">
          Helping the campus community stay connected. Please provide the most accurate details for our matching engine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard className="p-10 space-y-10" hover={false}>
            <div className="space-y-4 group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 ml-4 flex items-center">
                <Type className="w-4 h-4 mr-3 text-blue-500" />
                Item Identification
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Space Grey iPad Pro 12.9 with Magic Keyboard"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 ml-4 flex items-center">
                  <Package className="w-4 h-4 mr-3 text-indigo-500" />
                  Classification
                </label>
                <div className="relative group">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 ml-4 flex items-center">
                  <Calendar className="w-4 h-4 mr-3 text-purple-500" />
                  Incident Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 ml-4 flex items-center">
                <Info className="w-4 h-4 mr-3 text-emerald-500" />
                Contextual Intelligence
              </label>
              <textarea
                rows={5}
                required
                placeholder="List brand, color, dents, stickers, or specific serial numbers that help verify ownership..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-10 border-blue-500/10 bg-blue-500/[0.02]" hover={false}>
             <div className="flex gap-6 items-start">
               <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-3xl text-blue-600 dark:text-blue-400 shrink-0">
                  <Phone className="w-6 h-6" />
               </div>
               <div className="space-y-4 flex-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Secure Contact Channel</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter phone or university email for coordination"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-6 py-4 rounded-[1.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all"
                  />
               </div>
             </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
           <GlassCard className="p-6" hover={false}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 ml-4 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-3 text-red-500" />
              Precise Location
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science Lab 402, Left row"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </GlassCard>

          <GlassCard className="p-2 overflow-hidden group" hover={false}>
            {imagePreview ? (
              <div className="relative aspect-square sm:aspect-video lg:aspect-square w-full rounded-[1.4rem] overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <button type="button" onClick={removeImage} className="p-4 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-2xl">
                      <X className="w-6 h-6 border-2 border-white rounded-full p-1" />
                   </button>
                </div>
              </div>
            ) : (
              <label className="w-full relative aspect-square sm:aspect-video lg:aspect-square cursor-pointer flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-950/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.4rem] hover:border-blue-500/50 hover:bg-blue-500/5 group transition-all">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-slate-100 dark:border-slate-800">
                  <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="text-center mt-8">
                  <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Visual Proof</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-3">JPG, PNG, WEBP (Max 10MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </GlassCard>

          <Button 
            variant="gradient" 
            className="w-full py-6 rounded-[2rem] text-lg lg:mt-4 shadow-2xl" 
            disabled={loading}
            type="submit"
          >
            {loading ? (
               <div className="flex items-center gap-3">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 Processing...
               </div>
            ) : (
               <div className="flex items-center gap-3">
                 <Send className="w-6 h-6" />
                 Finalize Report
               </div>
            )}
          </Button>
          
          <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
             Cross-referencing technology enabled
          </p>
        </div>
      </form>
    </div>
  );
}
