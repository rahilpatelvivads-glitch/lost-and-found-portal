import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";

export interface ClaimRequest {
  id?: string;
  item_id: string;
  item_type: 'lost' | 'found';
  claimant_id: string;
  message: string;
  contact_info?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at?: string;
}

export const claimService = {
  async createClaim(claim: Omit<ClaimRequest, 'id' | 'status' | 'created_at'>) {
    const messageWithContact = claim.message + (claim.contact_info ? `\n\nContact Details Provided: ${claim.contact_info}` : "");
    
    const { data, error } = await supabase
      .from('claim_requests')
      .insert([{
        lost_item_id: claim.item_id,
        claimant_id: claim.claimant_id,
        message: messageWithContact,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Fetch item owner to send notification
    const tables = ['lost_items', 'found_items'];
    let itemData = null;

    for (const table of tables) {
      const { data: maybeItem, error: itemError } = await supabase
        .from(table)
        .select('user_id, title')
        .eq('id', claim.item_id)
        .maybeSingle();

      if (!itemError && maybeItem) {
        itemData = maybeItem;
        break;
      }
    }

    if (itemData) {
      // Notify item owner
      await notificationService.createNotification(
        itemData.user_id,
        "New Claim Request",
        `A user submitted a claim for item '${itemData.title}'`
      );
    }

    return data;
  },

  async getMyClaims() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Query 1. Fetch claims joining lost_items since there's a real foreign key
    const { data: claims, error } = await supabase
      .from('claim_requests')
      .select('*, lost_items(*)')
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!claims || claims.length === 0) return [];

    // Query 2. Retrieve referenced item details from found_items if lost_items is null
    const missingItemIds = claims
      .filter(c => !c.lost_items)
      .map(c => c.lost_item_id)
      .filter(Boolean);

    let foundItemsMap: Record<string, any> = {};
    if (missingItemIds.length > 0) {
      const { data: foundItems, error: foundErr } = await supabase
        .from('found_items')
        .select('*')
        .in('id', missingItemIds);

      if (!foundErr && foundItems) {
        foundItems.forEach(item => {
          foundItemsMap[item.id] = item;
        });
      }
    }

    // Map claim records with item reference for consistency
    return claims.map(claim => ({
      ...claim,
      item_type: claim.lost_items ? 'lost' : 'found',
      found_items: foundItemsMap[claim.lost_item_id] || null
    }));
  },

  async getAllClaims() {
    // Query 1. Fetch all claims joining lost_items and user profiles
    const { data: claims, error } = await supabase
      .from('claim_requests')
      .select('*, lost_items(*), users!claimant_id(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!claims || claims.length === 0) return [];

    // Query 2. Fetch associated found_items records if needed
    const missingItemIds = claims
      .filter(c => !c.lost_items)
      .map(c => c.lost_item_id)
      .filter(Boolean);

    let foundItemsMap: Record<string, any> = {};
    if (missingItemIds.length > 0) {
      const { data: foundItems, error: foundErr } = await supabase
        .from('found_items')
        .select('*')
        .in('id', missingItemIds);

      if (!foundErr && foundItems) {
        foundItems.forEach(item => {
          foundItemsMap[item.id] = item;
        });
      }
    }

    return claims.map(claim => ({
      ...claim,
      item_type: claim.lost_items ? 'lost' : 'found',
      found_items: foundItemsMap[claim.lost_item_id] || null
    }));
  },

  async updateClaimStatus(claimId: string, status: 'approved' | 'rejected' | 'returned') {
    const { data, error } = await supabase
      .from('claim_requests')
      .update({ status })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;

    // Notify claimant
    await notificationService.createNotification(
      data.claimant_id,
      `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your claim request for the item has been ${status}.`
    );

    return data;
  }
};
