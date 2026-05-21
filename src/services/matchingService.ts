import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";

export const matchingService = {
  async findMatchesForItem(itemId: string, type: 'lost' | 'found') {
    const sourceTable = type === 'lost' ? 'lost_items' : 'found_items';
    const targetTable = type === 'lost' ? 'found_items' : 'lost_items';

    // Get the source item
    const { data: item, error: itemError } = await supabase
      .from(sourceTable)
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) return;

    // Basic matching: same category and similar title
    // In a real app, you might use Postgres full-text search or vector similarity
    const { data: matches, error: matchError } = await supabase
      .from(targetTable)
      .select('*')
      .eq('category', item.category)
      .neq('status', 'returned');

    if (matchError || !matches) return;

    const similarMatches = matches.filter(m => {
      const title1 = item.title.toLowerCase();
      const title2 = m.title.toLowerCase();
      // Simple overlap check or similarity score
      const words1 = title1.split(' ');
      const words2 = title2.split(' ');
      const overlap = words1.filter(w => words2.includes(w)).length;
      return overlap >= 1; // At least one word in common for now
    });

    // Notify users
    for (const match of similarMatches) {
      const ownerId = type === 'lost' ? item.user_id : match.user_id;
      const finderId = type === 'lost' ? match.user_id : item.user_id;

      // Notify the person who lost the item
      await notificationService.createNotification(
        ownerId,
        "Potential Match Found",
        `We found a potential match for your lost ${item.category}: "${type === 'lost' ? match.title : item.title}".`
      );

      // Notify the person who found the item
      await notificationService.createNotification(
        finderId,
        "Potential Match Identified",
        `Your found item "${type === 'found' ? item.title : match.title}" might belong to someone who just reported a lost item.`
      );
    }

    return similarMatches;
  }
};
