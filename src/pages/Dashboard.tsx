import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserStats } from '../hooks/useUserStats';
import { useBookings } from '../hooks/useBookings';
import { Link } from 'react-router-dom';
import { BookingModal } from '../components/bookings/BookingModal';
import { supabase } from '../lib/supabaseClient';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { bookings, loading: bookingsLoading, refetch } = useBookings();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this service request?')) return;

    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      await refetch(); // Refresh list immediately
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleBookingSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // --- GUARDS ---

  if (statsLoading || bookingsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0056B3]"></div>
      <p className="text-sm text-gray-500 font-medium">Syncing your impact data...</p>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
        <p className="text-gray-600 mb-6">Please log in again to access your dashboard.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-[#0056B3] text-white rounded-lg font-medium hover:bg-[#004494] transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );

  // Determine if we should show onboarding banner
  const showOnboarding = stats.points === 0 && bookings.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back,{' '}
              <span className="text-[#0056B3]">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Recycler'}
              </span>!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here is your impact summary today.
            </p>
          </div>
          <button 
            onClick={logout}
            className="group inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-all"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* ===== ONBOARDING BANNER ===== */}
        {showOnboarding && (
          <div className="mb-8 p-6 bg-white border-l-4 border-[#0056B3] shadow-sm rounded-r-xl flex items-start gap-4 animate-fade-in-down">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0056B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Start Your Journey 👋</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                You haven't earned any points yet. Drop off recyclables at a kiosk or book a verified artisan to get started.
              </p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setIsBookingOpen(true)}
                  className="px-4 py-2 bg-[#28A745] text-white text-sm font-semibold rounded-lg hover:bg-[#218838] transition-colors shadow-sm"
                >
                  Book First Service
                </button>
                <button 
                  onClick={() => alert('Kiosk Map coming soon!')}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Find Nearest Kiosk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="KumoPoints Balance"
            value={Number(stats.points).toLocaleString()}
            unit="pts"
            accentColor="#0056B3"
            icon={<DollarIcon />}
          />
          <StatCard
            title="Active Bookings"
            value={String(bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length)}
            unit="scheduled"
            accentColor="#28A745"
            icon={<CalendarIcon />}
          />
          <StatCard
            title="Total Recycled"
            value={Number(stats.recycledWeight).toFixed(1)}
            unit="kg"
            accentColor="#F97316"
            icon={<ScaleIcon />}
          />
        </div>

        {/* ===== SERVICES LIST ===== */}
        <div className="bg-white shadow-sm rounded-xl mb-8 border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-semibold text-gray-900">Your Services</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {bookings.length} Total
            </span>
          </div>
          
          <div className="p-0">
            {bookings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">No active bookings</p>
                <p className="text-sm text-gray-500 mb-6">Need a plumber or electrician? We've got you covered.</p>
                <button 
                  onClick={() => setIsBookingOpen(true)}
                  className="inline-flex items-center px-5 py-2.5 bg-[#0056B3] text-white text-sm font-semibold rounded-lg hover:bg-[#004494] transition-colors shadow-md hover:shadow-lg"
                >
                  + Book Your First Service
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <li 
                    key={booking.id} 
                    className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Service Info */}
                    <div className="flex items-center gap-4">
                      <StatusDot status={booking.status} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {(booking.service_type || 'Unknown Service').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(booking.scheduled_time).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })} 
                          • {new Date(booking.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3 ml-9 sm:ml-0">
                      <StatusBadge status={booking.status} />
                      
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors underline decoration-dotted"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Need Something Done?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Connect with verified artisans or locate smart kiosks instantly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsBookingOpen(true)} 
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-[#28A745] hover:bg-[#218838] shadow-sm hover:shadow-md transition-all"
              >
                <PlusIcon />
                Book Service
              </button>
              <button 
                onClick={() => alert('Map Integration Coming Soon!')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <PinIcon />
                Find Kiosk
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== MODAL ===== */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)}
        onSuccess={handleBookingSuccess} 
      />
      
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, unit, accentColor, icon }: {
  title: string;
  value: string;
  unit: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div 
      className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative group"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-shrink-0 p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-baseline justify-end">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
              <span className="ml-1.5 text-sm font-medium text-gray-400">{unit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  let colorClass = "bg-gray-300";
  if (status === 'pending') colorClass = "bg-yellow-400";
  if (status === 'confirmed') colorClass = "bg-green-500";
  if (status === 'cancelled') colorClass = "bg-red-400";
  
  return <div className={`w-2.5 h-2.5 rounded-full ${colorClass} ring-2 ring-white`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    default: "bg-gray-50 text-gray-700 border-gray-200"
  };
  
  const styleKey = (styles as any)[status] || styles.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleKey}`}>
      {status.toUpperCase()}
    </span>
  );
}

// --- ICONS ---
const DollarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PinIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);