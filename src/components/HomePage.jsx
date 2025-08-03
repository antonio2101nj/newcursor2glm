import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Settings, Users, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

function HomePage({ user, userRole }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
    // O onAuthStateChange no App.jsx irá redirecionar para /auth
  };

  const handleViewChange = (view) => {
    navigate(`/${view}`);
  };

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

export default HomePage;