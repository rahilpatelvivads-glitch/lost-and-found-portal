import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2, MessageSquare, Phone } from "lucide-react";
import { Button, GlassCard } from "./ui/UI";
import { claimService } from "../services/claimService";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface ClaimModalProps {
  item: any;
  itemType: 'lost' | 'found';
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimModal({ item, itemType, isOpen, onClose }: ClaimModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to claim items.");

      await claimService.createClaim({
        item_id: item.id,
        item_type: itemType,
        claimant_id: user.id,
        message,
        contact_info: contact
      });

      toast.success("Claim request submitted successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit claim request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-2xl z-[101]"
          >
            <GlassCard className="p-0 overflow-hidden rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
              <div className="flex flex-col md:flex-row">
                {/* Visual Preview Section */}
                <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 shrink-0">
                   <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center overflow-hidden mb-6 group transition-transform duration-500 hover:scale-110">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                           <MessageSquare className="w-6 h-6" />
                        </div>
                      )}
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticating</p>
                      <h4 className="text-sm font-black dark:text-white line-clamp-2 leading-tight">{item.title}</h4>
                   </div>
                </div>

                <div className="flex-1 p-8 sm:p-12 bg-white dark:bg-slate-950/40">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter dark:text-slate-100 leading-none">Security <span className="text-blue-600">Claim</span></h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 text-sm italic">"Initiating ownership verification sequence..."</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        Reason / Message & Ownership Proof
                      </label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Explain why you are claiming this and describe your proof of ownership in detail (e.g., serial number, specific scratches, context of where/when you lost it)..."
                        className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all h-32 resize-none font-medium text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 flex items-center gap-3">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Contact Number / Information
                      </label>
                      <input
                        required
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Enter your phone number or preferred contact channel..."
                        className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px]"
                        onClick={onClose}
                      >
                        Abort
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black uppercase tracking-[0.2em] text-[10px]"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                          <span className="flex items-center justify-center gap-3">
                            Execute Claim <Send className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
