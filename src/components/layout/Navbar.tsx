import { useAuth } from "../../hooks/useAuth";
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, loading, logout } = useAuth();

  // Helper to trigger modal via Global Event
  const openModal = (mode: "signup" | "login") => {
    window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
  };

  return (
    <header className="border-b p-4 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm">
      {/* Logo / Brand */}
      <Link to="/" className="no-underline hover:no-underline">
        <h1 className="font-bold text-xl tracking-tight">
          <span className="text-[#0056B3]">Kumo</span>
          <span className="text-[#28A745]">Cycle</span>
        </h1>
      </Link>
      
      {/* Navigation Actions */}
      <nav className="flex gap-4 items-center">
        {loading ? (
          <span className="text-sm text-gray-500 animate-pulse">Checking...</span>
        ) : user ? (
          <>
            {/* Logged In State */}
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-[#0056B3] hover:text-[#004494] transition-colors"
            >
              My Dashboard
            </Link>
            <button 
              onClick={logout} 
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Guest State */}
            <button 
              onClick={() => openModal('login')} 
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => openModal('signup')} 
              className="px-3 py-1 bg-[#0056B3] text-white rounded-lg text-sm font-medium hover:bg-[#004494] transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
}