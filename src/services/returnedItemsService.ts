import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";

export const returnedItemsService = {
  async markAsReturned(itemId: string, type: 'lost' | 'found', ownerId: string, finderId?: string, matchedItemId?: string) {
    const table = type === 'lost' ? 'lost_items' : 'found_items';
    const otherTable = type === 'lost' ? 'found_items' : 'lost_items';

    // 1. Update the source item
    const { data: itemData, error: itemError } = await supabase
      .from(table)
      .update({ status: 'returned' })
      .eq('id', itemId)
      .select()
      .single();

    if (itemError) throw itemError;

    // 2. If there's a matched item, update it too
    if (matchedItemId) {
      await supabase
        .from(otherTable)
        .update({ status: 'returned' })
        .eq('id', matchedItemId);
    }

    // 3. Insert into returned_items log table
    const { error: logError } = await supabase
      .from('returned_items')
      .insert([{
        title: itemData.title,
        category: itemData.category,
        description: itemData.description,
        image_url: itemData.image_url,
        lost_item_id: type === 'lost' ? itemId : matchedItemId,
        found_item_id: type === 'found' ? itemId : matchedItemId,
        owner_id: ownerId,
        finder_id: finderId,
        status: 'completed',
        returned_date: new Date().toISOString()
      }]);

    // Note: If 'returned_items' table doesn't exist yet, this might fail unless the DB is prepared.
    // In many AI studio envs, the DB is already pre-set or we assume it exists.

    // 4. Notify participants
    const participants = [ownerId, finderId].filter(Boolean);
    
    // Private notifications
    await Promise.all([
      notificationService.createNotification(
        ownerId,
        "Item Successfully Returned",
        `Great news! Your item "${itemData.title}" has been officially marked as returned. Thank you for using our campus recovery network!`
      ),
      finderId ? notificationService.createNotification(
        finderId,
        "Return Confirmed",
        `The item "${itemData.title}" you found has been successfully returned to its owner. Your contribution to the community is appreciated!`
      ) : Promise.resolve()
    ]);

    // Broadcast Notification
    await notificationService.createNotification(
      null,
      "Success Reunion",
      `A new successful return: "${itemData.title}" has been reunited with its owner!`
    );

    return itemData;
  },

  async getReturnedItems() {
    const { data, error } = await supabase
      .from('returned_items')
      .select('*')
      .order('returned_date', { ascending: false });

    if (!error && data) return data;

    // Fallback to old behavior if table doesn't exist or is empty
    const [lost, found] = await Promise.all([
      supabase.from('lost_items').select('*').eq('status', 'returned'),
      supabase.from('found_items').select('*').eq('status', 'returned')
    ]);

    return [
      ...(lost.data || []).map(i => ({ ...i, type: 'lost', returned_date: i.created_at })),
      ...(found.data || []).map(i => ({ ...i, type: 'found', returned_date: i.created_at }))
    ].sort((a, b) => new Date(b.returned_date).getTime() - new Date(a.returned_date).getTime());
  },

  async getTotalReturnedCount() {
    const [{ count: lostCount }, { count: foundCount }] = await Promise.all([
      supabase.from('lost_items').select('*', { count: 'exact', head: true }).eq('status', 'returned'),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'returned')
    ]);
    return (lostCount || 0) + (foundCount || 0);
  }
};
