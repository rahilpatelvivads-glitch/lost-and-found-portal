import { supabase } from "../lib/supabase";

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found' | 'returned';
  image_url: string | null;
  created_at: string;
  lost_location?: string;
  found_location?: string;
};

export const searchService = {
  async searchItems(query: string, filters: {
    status?: 'lost' | 'found' | 'returned' | 'all';
    category?: string;
    sortBy?: 'latest' | 'oldest';
  } = {}) {
    let lostQuery = supabase.from('lost_items').select('*');
    let foundQuery = supabase.from('found_items').select('*');
    let returnedQuery = supabase.from('returned_items').select('*');

    // Apply text search
    if (query) {
      const searchStr = `%${query}%`;
      lostQuery = lostQuery.or(`title.ilike.${searchStr},description.ilike.${searchStr},category.ilike.${searchStr},lost_location.ilike.${searchStr}`);
      foundQuery = foundQuery.or(`title.ilike.${searchStr},description.ilike.${searchStr},category.ilike.${searchStr},found_location.ilike.${searchStr}`);
      returnedQuery = returnedQuery.or(`title.ilike.${searchStr},description.ilike.${searchStr},category.ilike.${searchStr}`);
    }

    // Apply category filter
    if (filters.category && filters.category !== 'All') {
      lostQuery = lostQuery.eq('category', filters.category);
      foundQuery = foundQuery.eq('category', filters.category);
      returnedQuery = returnedQuery.eq('category', filters.category);
    }

    const [lostRes, foundRes, returnedRes] = await Promise.all([
      lostQuery, 
      foundQuery, 
      returnedQuery
    ]);

    // Handle potential errors (sometimes table might not exist in some environments)
    // We treat errors gracefully to show whatever we have
    
    const lostItems = lostRes.data || [];
    const foundItems = foundRes.data || [];
    const returnedItems = returnedRes.data || [];

    let allItems: SearchResult[] = [
      ...lostItems.map(item => ({ ...item, status: 'lost' })),
      ...foundItems.map(item => ({ 
        ...item, 
        status: item.status === 'returned' ? 'returned' : 'found' 
      })),
      ...returnedItems.map(item => ({ ...item, status: 'returned' }))
    ];

    // De-duplicate if an item is in both found_items and returned_items (depending on how logging is handled)
    const seen = new Set();
    allItems = allItems.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      allItems = allItems.filter(item => item.status === filters.status);
    }

    // Sort
    allItems.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return filters.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return allItems;
  }
};
