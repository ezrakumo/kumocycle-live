import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // NEW

}

export function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Convert time string to ISO format for Postgres
      const isoDate = new Date(scheduledTime).toISOString();

      const { error } = await supabase.from('bookings').insert([
        {
          user_id: user.id,
          service_type: serviceType,
          scheduled_time: isoDate,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      setMessage('Booking request submitted! An artisan will confirm shortly.');
      setTimeout(() => {
        onClose();
        setServiceType('');
        setScheduledTime('');
        onSuccess?.(); // <--- CALL THIS
      }, 2000);

    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#28A745] to-[#0056B3] p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-xl font-bold"
          >
            ✕
          </button>
          
          <h2 className="text-2xl font-bold mb-1">Request Service</h2>
          <p className="text-sm opacity-90">Connect with verified artisans near you.</p>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium border ${message.includes('Failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Service Type</label>
            <select 
              required value={serviceType} onChange={(e) => setServiceType(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28A745] outline-none bg-white"
            >
              <option value="">Select a service...</option>
              <option value="plumbing">🔧 Plumbing Repair</option>
              <option value="electrical">⚡ Electrical Fixing</option>
              <option value="cleaning">🧹 Home Cleaning</option>
              <option value="waste_pickup">♻️ Large Waste Pickup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Time</label>
            <input 
              type="datetime-local" required value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28A745] outline-none"
            />
          </div>

          <button 
            type="submit" disabled={loading} 
            className="w-full py-3 mt-2 bg-[#28A745] text-white font-bold rounded-lg hover:bg-[#218838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Submitting...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}