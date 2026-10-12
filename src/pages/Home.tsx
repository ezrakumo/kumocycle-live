import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/Button";

interface Artisan {
  id: string;
  full_name: string;
  specialty: string;
  rating_avg: number;
  location_lga: string;
  hourly_rate_ngn: number;
  is_verified: boolean;
}

export function Home() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtisans() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("artisans")
        .select("*")
        .eq("is_verified", true)
        .order("rating_avg", { ascending: false })
        .limit(3);

      if (!error && data) setArtisans(data);
      setLoading(false);
    }
    fetchArtisans();
  }, []);

  return (
    <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
      {/* HERO */}
      <section className="text-center max-w-3xl mx-auto mb-20">
        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-[#0056B3] text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100">
          Abuja Pilot Launch
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Turn Waste Into Wealth.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0056B3] to-[#28A745]">
            Recycle. Earn. Fix.
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Join Nigeria's first AI-powered circular economy platform. Drop off
          recyclables at our smart kiosks, earn KumoPoints instantly, and redeem
          them for cash or verified home services.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            Get Started Free
          </Button>
          <Button variant="secondary" size="lg">
            Find a Kiosk
          </Button>
        </div>
      </section>

      {/* ARTISANS PREVIEW */}
      <section className="bg-gray-50 -mx-4 px-4 py-16 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Top Verified Artisans Near You
        </h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500 animate-pulse">
            Loading experts...
          </div>
        ) : artisans.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No artisans found yet. Come back soon!
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {artisans.map((a) => (
              <div
                key={a.id}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl font-bold text-green-700">
                    {a.full_name.charAt(0)}
                  </div>
                  {a.is_verified && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md uppercase">
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {a.full_name}
                </h3>
                <p className="text-[#0056B3] font-semibold mb-4">
                  {a.specialty}
                </p>

                <div className="mt-auto space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    Rating: <strong>{a.rating_avg.toFixed(1)}</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    Location: {a.location_lga}, Abuja
                  </p>
                  <p className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    NGN {a.hourly_rate_ngn.toLocaleString()} / hr
                  </p>
                </div>

                <Button variant="outline" className="w-full mt-6">
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
