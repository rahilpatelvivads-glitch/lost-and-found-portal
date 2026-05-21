import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";
import { matchingService } from "./matchingService";

export interface LostItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  lost_location: string;
  lost_date: string;
  contact: string;
  image_url?: string;
  status?: "lost" | "returned" | "claimed";
  user_id?: string;
  created_at?: string;
}

export const lostItemsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("lost_items")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as LostItem[];
  },

  async getRecent(limit = 3) {
    const { data, error } = await supabase
      .from("lost_items")
      .select("*")
      .neq("status", "returned")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as LostItem[];
  },

  async getStats() {
    const { count, error } = await supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .neq("status", "returned");
    
    if (error) throw error;
    return count || 0;
  },

  async create(item: LostItem, imageFile?: File) {
    let image_url = item.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `lost-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("item-images")
        .getPublicUrl(filePath);
      
      image_url = publicUrl;
    }

    const { data, error } = await supabase
      .from("lost_items")
      .insert([{ ...item, image_url }])
      .select();
    
    if (error) throw error;
    const createdItem = data[0];

    // Private Notification
    await notificationService.createNotification(
      createdItem.user_id,
      "Report Logged",
      `Your lost item "${createdItem.title}" has been registered in the system.`
    );

    // Broadcast Notification
    await notificationService.createNotification(
      null,
      "New Lost Item",
      `A new lost item has been reported: ${createdItem.title}`
    );

    // Matching
    await matchingService.findMatchesForItem(createdItem.id, 'lost');

    return createdItem;
  }
};
