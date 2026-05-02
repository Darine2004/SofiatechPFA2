import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
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
  onResetPassword: (email: string, newPassword: string) => void;
}

// Code de récupération stocké en mémoire
let activeRecoveryCode = '';
let activeRecoveryEmail = '';

const sendRecoveryEmail = async (toEmail: string, code: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_hk8ufuc',
        template_id: 'template_12u8i4g',
        user_id: '4qL6XcLXHfczXu1xE',
        template_params: {
          to_email: toEmail,
          recovery_code: code,
          name: 'Utilisateur Sofiatech',
        }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
};

export function LoginPage({ users, onLogin, onResetPassword }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify' | 'newpass' | 'done'>('login');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Login ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    onLogin(email, password);
    setError('Email ou mot de passe incorrect');
  };

  // ── Step 1 : envoyer le code ──
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail) { setError('Veuillez entrer votre email'); return; }
    const user = users.find(u => u.email === forgotEmail);
    if (!user) { setError('Aucun compte trouvé avec cet email'); return; }

    setIsSending(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    activeRecoveryCode = code;
    activeRecoveryEmail = forgotEmail;

    const sent = await sendRecoveryEmail(forgotEmail, code);
    setIsSending(false);

    if (!sent) {
      setError("Erreur lors de l'envoi de l'email. Vérifiez votre connexion.");
      setMode('forgot');
      return;
    }

    setMode('verify');
  };

  // ── Step 2 : vérifier le code ──
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (enteredCode !== activeRecoveryCode) {
      setError('Code incorrect. Vérifiez votre email.');
      return;
    }
    setMode('newpass');
  };

  // ── Step 3 : nouveau mot de passe ──
  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 4) { setError('Mot de passe trop court (min 4 caractères)'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    onResetPassword(activeRecoveryEmail, newPassword);
    activeRecoveryCode = '';
    activeRecoveryEmail = '';
    setMode('done');
  };

  const resetForgot = () => {
    setMode('login');
    setForgotEmail('');
    setEnteredCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const Logo = () => (
    <div className="flex flex-col items-center mb-8">
      <div className="bg-white p-5 rounded-xl mb-6 shadow-md border-2" style={{ borderColor: '#003366' }}>
        <img src={logoImage} alt="Sofiatech Logo" className="h-16 w-auto" />
      </div>
      <h1 className="text-center text-2xl" style={{ color: '#003366' }}>Sofiatech Asset Manager</h1>
    </div>
  );

  const steps = ['Votre email', 'Vérification', 'Nouveau mot de passe'];
  const currentStep = mode === 'forgot' ? 0 : mode === 'verify' ? 1 : 2;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#F5F7FA' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#003366' }} />
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#F47B20' }} />
        <div className="absolute -bottom-32 left-1/3 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#4A90E2' }} />
      </div>

      {/* ── LOGIN ── */}
      {mode === 'login' && (
        <Card className="w-full max-w-md p-10 shadow-2xl relative z-10 border-t-4" style={{ borderTopColor: '#F47B20' }}>
          <Logo />
          <div className="mb-6 px-4 py-2 rounded-full text-center" style={{ backgroundColor: '#F47B20', color: 'white' }}>
            <p className="text-sm font-medium">Connexion à votre espace</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                <Mail className="w-4 h-4 inline mr-2" />Adresse email
              </label>
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="exemple@email.com" className="w-full border-2" style={{ borderColor: '#4A90E2' }} />
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                <Lock className="w-4 h-4 inline mr-2" />Mot de passe
              </label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Votre mot de passe" className="w-full border-2 pr-10" style={{ borderColor: '#4A90E2' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4A90E2' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => { setMode('forgot'); setError(''); }}
                className="text-sm hover:underline" style={{ color: '#F47B20' }}>
                Mot de passe oublié ?
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-lg text-center text-sm" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '2px solid #E74C3C' }}>
                {error}
              </div>
            )}
            <Button type="submit" className="w-full py-6 text-lg font-medium shadow-lg hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)', color: 'white' }}>
              Se connecter
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t-2 text-center" style={{ borderColor: '#F47B20' }}>
            <p className="text-sm font-medium" style={{ color: '#4A90E2' }}>© 2026 Sofiatech</p>
            <p className="text-xs mt-1" style={{ color: '#F47B20' }}>A Onetech company</p>
          </div>
        </Card>
      )}

      {/* ── FORGOT / VERIFY / NEWPASS ── */}
      {(mode === 'forgot' || mode === 'verify' || mode === 'newpass') && (
        <Card className="w-full max-w-md p-10 shadow-2xl relative z-10 border-t-4" style={{ borderTopColor: '#4A90E2' }}>
          <Logo />

          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: i <= currentStep ? '#003366' : '#E0E0E0',
                      color: i <= currentStep ? 'white' : '#999'
                    }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <p className="text-xs mt-1 text-center" style={{ color: i <= currentStep ? '#003366' : '#999', width: '70px' }}>{step}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4" style={{ backgroundColor: i < currentStep ? '#003366' : '#E0E0E0' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1 : Email */}
          {mode === 'forgot' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#E8F4F8', border: '1px solid #4A90E2', color: '#003366' }}>
                Entrez votre adresse email. Nous vous enverrons un code de vérification à 6 chiffres.
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                  <Mail className="w-4 h-4 inline mr-2" />Votre adresse email
                </label>
                <Input type="email" value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setError(''); }}
                  placeholder="exemple@email.com" className="w-full border-2" style={{ borderColor: '#4A90E2' }} />
              </div>
              {error && <div className="p-3 rounded text-sm text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '1px solid #E74C3C' }}>{error}</div>}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 py-5" style={{ backgroundColor: '#003366', color: 'white' }} disabled={isSending}>
                  {isSending ? 'Envoi en cours...' : '📧 Envoyer le code'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForgot}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2 : Code */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="p-4 rounded-lg text-sm text-center" style={{ backgroundColor: '#E8F8E8', border: '1px solid #27AE60', color: '#27AE60' }}>
                ✅ Code envoyé à <strong>{forgotEmail}</strong>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: '#003366' }}>Code de vérification (6 chiffres)</label>
                <Input value={enteredCode} onChange={(e) => { setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="_ _ _ _ _ _" className="w-full border-2 text-center text-2xl tracking-[0.5em] font-bold"
                  style={{ borderColor: '#4A90E2', color: '#003366' }} maxLength={6} />
              </div>
              {error && <div className="p-3 rounded text-sm text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '1px solid #E74C3C' }}>{error}</div>}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 py-5" style={{ backgroundColor: '#003366', color: 'white' }}
                  disabled={enteredCode.length !== 6}>
                  Vérifier le code →
                </Button>
                <Button type="button" variant="outline" onClick={() => { setMode('forgot'); setEnteredCode(''); setError(''); }}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-center text-sm" style={{ color: '#717182' }}>
                Vous n'avez pas reçu le code ?{' '}
                <button type="button" onClick={() => { setMode('forgot'); setEnteredCode(''); }} className="hover:underline" style={{ color: '#F47B20' }}>
                  Renvoyer
                </button>
              </p>
            </form>
          )}

          {/* Step 3 : Nouveau mot de passe */}
          {mode === 'newpass' && (
            <form onSubmit={handleSetNewPassword} className="space-y-5">
              <div className="p-4 rounded-lg text-sm text-center" style={{ backgroundColor: '#E8F8E8', border: '1px solid #27AE60', color: '#27AE60' }}>
                ✅ Code vérifié ! Définissez votre nouveau mot de passe.
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                  <Lock className="w-4 h-4 inline mr-2" />Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input type={showNew ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Minimum 4 caractères" className="w-full border-2 pr-10" style={{ borderColor: '#4A90E2' }} />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4A90E2' }}>
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: '#003366' }}>
                  <Lock className="w-4 h-4 inline mr-2" />Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Répétez le mot de passe" className="w-full border-2 pr-10"
                    style={{ borderColor: confirmPassword && confirmPassword === newPassword ? '#27AE60' : confirmPassword ? '#E74C3C' : '#4A90E2' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4A90E2' }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs mt-1" style={{ color: '#E74C3C' }}>Les mots de passe ne correspondent pas</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-xs mt-1" style={{ color: '#27AE60' }}>✓ Les mots de passe correspondent</p>
                )}
              </div>
              {error && <div className="p-3 rounded text-sm text-center" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C', border: '1px solid #E74C3C' }}>{error}</div>}
              <Button type="submit" className="w-full py-5" style={{ backgroundColor: '#27AE60', color: 'white' }}
                disabled={newPassword.length < 4 || newPassword !== confirmPassword}>
                ✓ Réinitialiser le mot de passe
              </Button>
            </form>
          )}
        </Card>
      )}

      {/* ── SUCCÈS ── */}
      {mode === 'done' && (
        <Card className="w-full max-w-md p-10 shadow-2xl relative z-10 border-t-4 text-center" style={{ borderTopColor: '#27AE60' }}>
          <Logo />
          <CheckCircle className="w-20 h-20 mx-auto mb-4" style={{ color: '#27AE60' }} />
          <h2 style={{ color: '#003366' }}>Mot de passe réinitialisé !</h2>
          <p className="mt-3 text-sm" style={{ color: '#2C3E50' }}>
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <Button onClick={resetForgot} className="mt-8 w-full py-5"
            style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)', color: 'white' }}>
            Se connecter
          </Button>
        </Card>
      )}
    </div>
  );
}
