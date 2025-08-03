import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import AuthForm from './components/AuthForm';
import HomePage from './components/HomePage';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Componente para proteger rotas
function ProtectedRoute({ children, isAuthenticated, userRole, requiredRole }) {
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Componente principal da aplicação
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timeoutId;

    // Timeout de segurança
    timeoutId = setTimeout(() => {
      console.warn('Timeout de autenticação - finalizando carregamento');
      setLoading(false);
    }, 5000);

    const handleAuthStateChange = async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      try {
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);

          // Buscar role do usuário
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar role:', error);
            setUserRole(null);
          } else {
            console.log('Role encontrado:', profile?.role);
            setUserRole(profile?.role);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole(null);
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('Erro no handleAuthStateChange:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 text-xl">Carregando...</p>
          <p className="text-green-500 text-sm mt-2">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <AuthForm onAuthSuccess={handleAuthSuccess} />
        } 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <HomePage user={user} userRole={userRole} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute 
            isAuthenticated={isAuthenticated} 
            userRole={userRole} 
            requiredRole="admin"
          >
            <AdminPanel user={user} userRole={userRole} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/user" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserPanel user={user} userRole={userRole} />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;