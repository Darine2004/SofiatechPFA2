import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Lock, User } from 'lucide-react';
import logoImage from '../../imports/image.png';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#F5F7FA' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#003366' }}></div>
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#F47B20' }}></div>
        <div className="absolute -bottom-32 left-1/3 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#4A90E2' }}></div>
      </div>

      <Card className="w-full max-w-md p-10 shadow-2xl relative z-10 border-t-4" style={{ borderTopColor: '#F47B20' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-5 rounded-xl mb-6 shadow-md border-2" style={{ borderColor: '#003366' }}>
            <img src={logoImage} alt="Sofiatech Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-center text-2xl" style={{ color: '#003366' }}>Sofiatech Asset Manager</h1>
          <div className="mt-3 px-4 py-2 rounded-full" style={{ backgroundColor: '#F47B20', color: 'white' }}>
            <p className="text-sm font-medium">Connexion à votre espace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
              <User className="w-4 h-4 inline mr-2" />
              Nom d'utilisateur
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              className="w-full border-2 focus:border-[#4A90E2]"
              style={{ borderColor: '#4A90E2' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
              <Lock className="w-4 h-4 inline mr-2" />
              Mot de passe
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full border-2 focus:border-[#4A90E2]"
              style={{ borderColor: '#4A90E2' }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '2px solid #E74C3C' }}>
              <strong>{error}</strong>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-lg font-medium shadow-lg hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)', color: 'white' }}
          >
            Se connecter
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2" style={{ borderColor: '#F47B20' }}>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: '#4A90E2' }}>© 2026 Sofiatech</p>
            <p className="text-xs mt-1" style={{ color: '#F47B20' }}>A Onetech company</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
