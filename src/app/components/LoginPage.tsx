import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import logoImage from '../../imports/image.png';

interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface LoginPageProps {
  users: UserAccount[];
  onLogin: (email: string, password: string) => void;
  onForgotPassword: (email: string) => void;
}

const ADMIN_EMAIL = 'nour.dhaouadi17@gmail.com';
const RECOVERY_CODES: Record<string, string> = {};

export function LoginPage({ users, onLogin, onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    onLogin(email, password);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail) { setError('Veuillez entrer votre email'); return; }
    const user = users.find(u => u.email === forgotEmail);
    if (!user) { setError('Email non trouvé'); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    RECOVERY_CODES[forgotEmail] = code;
    onForgotPassword(forgotEmail);
    setRecoveryCode(code);
    setMessage(`Un code de récupération a été envoyé à ${ADMIN_EMAIL}`);
    setMode('reset');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (enteredCode !== recoveryCode) { setError('Code incorrect'); return; }
    if (!newPassword || newPassword.length < 6) { setError('Mot de passe trop court (min 6 caractères)'); return; }
    setMessage('Mot de passe réinitialisé avec succès !');
    setTimeout(() => { setMode('login'); setMessage(''); setEnteredCode(''); setNewPassword(''); setForgotEmail(''); }, 2000);
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
            <p className="text-sm font-medium">
              {mode === 'login' ? 'Connexion à votre espace' : mode === 'forgot' ? 'Récupération du mot de passe' : 'Réinitialisation'}
            </p>
          </div>
        </div>

        {/* ── Mode Login ── */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                <Mail className="w-4 h-4 inline mr-2" />
                Adresse email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full border-2 focus:border-[#4A90E2]"
                style={{ borderColor: '#4A90E2' }}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full border-2 focus:border-[#4A90E2] pr-10"
                  style={{ borderColor: '#4A90E2' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4A90E2' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setMode('forgot')}
                className="text-sm hover:underline" style={{ color: '#F47B20' }}>
                Mot de passe oublié ?
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '2px solid #E74C3C' }}>
                <strong>{error}</strong>
              </div>
            )}
            <Button type="submit" className="w-full py-6 text-lg font-medium shadow-lg hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)', color: 'white' }}>
              Se connecter
            </Button>
          </form>
        )}

        {/* ── Mode Mot de passe oublié ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-6">
            <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#E8F4F8', color: '#003366', border: '1px solid #4A90E2' }}>
              Entrez votre email. Un code de récupération sera affiché et envoyé à l'administrateur <strong>{ADMIN_EMAIL}</strong>.
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                <Mail className="w-4 h-4 inline mr-2" />
                Votre adresse email
              </label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full border-2"
                style={{ borderColor: '#4A90E2' }}
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '2px solid #E74C3C' }}>
                <strong>{error}</strong>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" style={{ backgroundColor: '#F47B20', color: 'white' }}>
                Envoyer le code
              </Button>
              <Button type="button" variant="outline" onClick={() => { setMode('login'); setError(''); }}>
                Retour
              </Button>
            </div>
          </form>
        )}

        {/* ── Mode Reset ── */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-6">
            {message && (
              <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#E8F8E8', color: '#27AE60', border: '1px solid #27AE60' }}>
                {message}
              </div>
            )}
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#FFF8DC', border: '2px solid #F47B20' }}>
              <p className="text-sm mb-1" style={{ color: '#2C3E50' }}>Votre code de récupération :</p>
              <p className="text-3xl font-bold tracking-widest" style={{ color: '#003366' }}>{recoveryCode}</p>
              <p className="text-xs mt-1" style={{ color: '#717182' }}>Partagez ce code avec l'administrateur</p>
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>Code de récupération</label>
              <Input
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="Entrez le code à 6 chiffres"
                className="w-full border-2 text-center text-xl tracking-widest"
                style={{ borderColor: '#4A90E2' }}
                maxLength={6}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>Nouveau mot de passe</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full border-2"
                style={{ borderColor: '#4A90E2' }}
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '2px solid #E74C3C' }}>
                <strong>{error}</strong>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" style={{ backgroundColor: '#27AE60', color: 'white' }}>
                Réinitialiser
              </Button>
              <Button type="button" variant="outline" onClick={() => { setMode('login'); setError(''); }}>
                Retour
              </Button>
            </div>
          </form>
        )}

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
