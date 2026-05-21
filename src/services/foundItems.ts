import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";
import { matchingService } from "./matchingService";

export interface FoundItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  found_location: string;
  found_date: string;
  contact: string;
  image_url?: string;
  status?: "found" | "returned" | "claimed";
  user_id?: string;
  created_at?: string;
}

export const foundItemsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("found_items")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as FoundItem[];
  },

  async getRecent(limit = 3) {
    const { data, error } = await supabase
      .from("found_items")
      .select("*")
      .neq("status", "returned")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as FoundItem[];
  },

  async getStats() {
    const { count, error } = await supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .neq("status", "returned");
    
    if (error) throw error;
    return count || 0;
  },

  async getReturnedCount() {
    const { count: lostReturned, error: error1 } = await supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "returned");

    const { count: foundReturned, error: error2 } = await supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "returned");
    
    if (error1) throw error1;
    if (error2) throw error2;

    return (lostReturned || 0) + (foundReturned || 0);
  },

  async create(item: FoundItem, imageFile?: File) {
    let image_url = item.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `found-items/${fileName}`;

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
      .from("found_items")
      .insert([{ ...item, image_url }])
      .select();
    
    if (error) throw error;
    const createdItem = data[0];

    // Private Notification
    await notificationService.createNotification(
      createdItem.user_id,
      "Report Registered",
      `You successfully reported finding "${createdItem.title}".`
    );

    // Broadcast Notification
    await notificationService.createNotification(
      null,
      "New Found Item",
      `A new item was found on campus: ${createdItem.title}`
    );

    // Matching
    await matchingService.findMatchesForItem(createdItem.id, 'found');

    return createdItem;
  }
};
