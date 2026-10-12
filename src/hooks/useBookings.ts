import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  scheduled_time: string;
  created_at: string;
}

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Extracted fetch function for reuse
  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setBookings([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Run fetch when user changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Return MUST include all properties used by Dashboard
  return { 
    bookings, 
    loading, 
    refetch: fetchBookings 
  };
}