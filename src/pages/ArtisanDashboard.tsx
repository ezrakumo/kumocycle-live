import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

interface PendingBooking {
  id: string;
  service_type: string;
  scheduled_time: string;
  status: string;
}

export function ArtisanDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [artisanProfile, setArtisanProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // STEP 1: Load Artisan Profile FIRST
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('artisans')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        setArtisanProfile(data);
      } catch (err: any) {
        console.error("Profile load failed:", err);
        setError("Could not load artisan profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // STEP 2: Load Jobs ONLY AFTER Profile is Loaded
  useEffect(() => {
    if (!artisanProfile || !user) return; // Wait until we have a profile

    const fetchJobs = async () => {
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('status', 'pending')
          .eq('service_type', artisanProfile.specialty) // Match specialty strictly
          .order('scheduled_time', { ascending: true });

        if (error) throw error;
        
        setBookings(data || []);
      } catch (err) {
        console.error("Job fetch failed:", err);
      }
    };

    fetchJobs();
    
    // Optional: Subscribe to real-time updates for new jobs
    const channel = supabase.channel(`jobs_${artisanProfile.specialty}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `status=eq.pending&service_type=eq.${artisanProfile.specialty}` }, 
        (payload) => {
          console.log('New Job Arrived!', payload);
          setBookings(prev => [...prev, payload.new as PendingBooking]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [artisanProfile, user]);

  const acceptBooking = async (bookingId: string) => {
    if (!artisanProfile) return;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed', 
        artisan_id: artisanProfile.id 
      })
      .eq('id', bookingId);

    if (!error) {
      alert('✅ Job Accepted! The customer has been notified.');
      // Remove from local list immediately for snappy UX
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } else {
      alert('❌ Failed to accept job.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0056B3]"></div>
    </div>
  );

  if (!user) return <Link to="/">Please Log In</Link>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Artisan Job Board</h1>
        
        {!artisanProfile ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-yellow-800">Not Registered Yet</h3>
            <p className="text-yellow-700 mt-2">You do not have an active artisan profile. Please contact support to get verified.</p>
          </div>
        ) : (
          <>
            {/* Profile Summary Card */}
            <div className="mb-8 p-6 bg-white rounded-xl shadow-md border-l-4 border-[#28A745] flex justify-between items-center">
              <div>
                <h2 className="font-bold text-xl text-gray-900">{artisanProfile.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Specialty: <span className="capitalize font-semibold text-[#0056B3]">{artisanProfile.specialty}</span> • Rating: ⭐ {artisanProfile.rating}
                </p>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 uppercase tracking-wide">Available Jobs</span>
                <span className="text-2xl font-bold text-[#28A745]">{bookings.length}</span>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Incoming Requests</h3>
              
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                  <p className="text-gray-500 italic">No pending jobs for "{artisanProfile.specialty}" right now.</p>
                  <p className="text-xs text-gray-400 mt-2">Check back soon or ask customers to book!</p>
                </div>
              ) : (
                bookings.map((job) => (
                  <div key={job.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-[#0056B3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-lg font-bold capitalize text-gray-900">{job.service_type.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 Scheduled: {new Date(job.scheduled_time).toLocaleDateString()} at {new Date(job.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">ID: {job.id.substring(0,8)}...</p>
                    </div>
                    <button 
                      onClick={() => acceptBooking(job.id)}
                      className="w-full sm:w-auto px-6 py-3 bg-[#28A745] text-white font-bold rounded-lg hover:bg-[#218838] transition-colors shadow-sm whitespace-nowrap"
                    >
                      Accept Job
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}