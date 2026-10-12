import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';

// Simple Layout Wrapper to keep Navbar consistent across pages
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

// Protected Route Component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  if (!user) return <Navigate to="/" replace />; // Redirect to Home/Login if not authenticated
  
  return <>{children}</>;
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  // Listen for global events from Navbar/Home buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      setMode(custom.detail);
      setIsModalOpen(true);
    };
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Global Auth Modal Overlay */}
      <AuthModal 
        key={mode}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={mode} 
        onModeChange={setMode} 
      />
    </Router>
  );
}

export default App;