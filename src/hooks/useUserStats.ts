import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

interface UserStats {
  points: number;
  activeBookings: number;
  recycledWeight: number;
}

export function useUserStats() {
  const { user } = useAuth();
  // Initialize with safe defaults so UI never breaks
  const [stats, setStats] = useState<UserStats>({ 
    points: 0, 
    activeBookings: 0, 
    recycledWeight: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // 1. Fetch Profile Data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points_balance, total_recycled_kg')
          .eq('id', user.id)
          .single();

        // If profileError is PGRST116 (No rows found), we just keep defaults (0s).
        // We only throw if it's a real network/db error.
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn("Profile fetch warning:", profileError.message);
        }

        // 2. COUNT Active Bookings
        const { count: activeCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'confirmed']); 

        if (bookingError) throw bookingError;

        // Update State safely
        setStats({
          points: profileData?.points_balance || 0,
          activeBookings: activeCount || 0,
          recycledWeight: profileData?.total_recycled_kg || 0,
        });

      } catch (error) {
        console.error("Failed to load stats:", error);
        // Keep current state or reset to 0s on critical failure
        setStats({ points: 0, activeBookings: 0, recycledWeight: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading };
}