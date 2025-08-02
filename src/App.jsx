import React, { useState, useEffect } from 'react';
import './App.css';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import AuthForm from './components/AuthForm';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Settings, Users, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Recuperar view do localStorage ou URL
    const savedView = localStorage.getItem('planVitalidad_currentView');
    const urlParams = new URLSearchParams(window.location.search);
    const urlView = urlParams.get('view');
    return urlView || savedView || 'home';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Salvar view atual no localStorage e URL
  useEffect(() => {
    localStorage.setItem('planVitalidad_currentView', currentView);
    
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location);
    if (currentView === 'home') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', currentView);
    }
    window.history.replaceState({}, '', url);
  }, [currentView]);

  // Escutar mudanças na URL (botão voltar do navegador)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('view') || 'home';
      setCurrentView(urlView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isInitialized = false;
    let timeoutId;

    // Timeout de segurança para evitar carregamento infinito
    timeoutId = setTimeout(() => {
      console.warn('Timeout de autenticação - finalizando carregamento');
      setLoading(false);
    }, 10000); // 10 segundos

    const handleSession = async (session) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
        console.log('Sessão encontrada, buscando perfil...');
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Erro ao buscar role do usuário:", profileError);
            setUserRole(null);
          } else if (profile) {
            console.log("Role do usuário encontrado:", profile.role);
            setUserRole(profile.role);
          }
        } catch (error) {
          console.error("Erro na busca do perfil:", error);
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        setCurrentView('home');
        localStorage.removeItem('planVitalidad_currentView');
      }
      
      clearTimeout(timeoutId);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange: Evento disparado:', event);
      
      // Evitar processar INITIAL_SESSION se já inicializamos
      if (event === 'INITIAL_SESSION' && isInitialized) {
        return;
      }
      
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        isInitialized = true;
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        await handleSession(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAuthSuccess = () => {
    // onAuthStateChange will handle setting isAuthenticated and user/role
    setCurrentView('home');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      setCurrentView('home');
      localStorage.removeItem('planVitalidad_currentView');
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const renderAuthForm = () => {
    return <AuthForm type={authMode} onLoginSuccess={setAuthMode} onAuthSuccess={handleAuthSuccess} />;
  };

  const renderMainApp = () => {
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

    // Se não estiver autenticado, sempre mostrar tela de login
    if (!isAuthenticated) {
      return renderAuthForm();
    }

    if (currentView === 'admin') {
      return <AdminPanel user={user} userRole={userRole} onBack={handleBackToHome} />;
    } else if (currentView === 'user') {
      return <UserPanel user={user} userRole={userRole} onBack={handleBackToHome} />;
    } else {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                PLAN DE VITALIDAD
              </h1>
              <p className="text-green-600 text-lg">
                Sistema de Gestão de Conteúdo para Saúde e Bem-estar
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {userRole === 'admin' && (
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewChange('admin')}>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Settings className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-green-800">Painel Administrativo</CardTitle>
                    <CardDescription>
                      Gerencie e publique conteúdos de saúde, vídeos educativos e documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleViewChange('admin')}>
                      Acessar Painel Admin
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewChange('user')}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-green-800">Painel do Usuário</CardTitle>
                  <CardDescription>
                    Acesse conteúdos, vídeos e documentos sobre saúde e bem-estar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleViewChange('user')}>
                    Acessar Painel Usuário
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-green-600 text-sm">
                Versão de teste - Focada em upload e visualização de arquivos
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        {renderMainApp()}
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;