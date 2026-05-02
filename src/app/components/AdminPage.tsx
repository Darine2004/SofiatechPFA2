import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Plus, Trash2, Shield, User, Eye, EyeOff } from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface AdminPageProps {
  users: UserAccount[];
  onSaveUsers: (users: UserAccount[]) => void;
}

const ADMIN_EMAIL = 'darineetnour@gmail.com';

export function AdminPage({ users, onSaveUsers }: AdminPageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newEmail || !newPassword) { setError('Remplissez tous les champs'); return; }
    const emailRegex = /^[a-zA-Z]+\.[a-zA-Z]+@sofia-technologies\.com$/;
    if (!emailRegex.test(newEmail)) { 
      setError('Email invalide. Format requis : prenom.nom@sofia-technologies.com'); 
      return; 
    }
    if (newPassword.length < 6) { setError('Mot de passe trop court (min 6 caractères)'); return; }
    if (users.find(u => u.email === newEmail)) { setError('Cet email existe déjà'); return; }

    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      email: newEmail,
      password: newPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    onSaveUsers([...users, newUser]);
    setNewEmail('');
    setNewPassword('');
    setIsAdding(false);
    setSuccess('Compte créé avec succès !');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (userId: string, email: string) => {
    if (email === ADMIN_EMAIL) { setError('Impossible de supprimer le compte admin'); return; }
    if (confirm(`Supprimer le compte ${email} ?`)) {
      onSaveUsers(users.filter(u => u.id !== userId));
    }
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: '#003366' }}>Gestion des Comptes Utilisateurs</h2>
          <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer et gérer les accès à l'application</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} style={{ backgroundColor: '#F47B20' }} className="shadow-md hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau compte
          </Button>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F8E8', color: '#27AE60', border: '1px solid #27AE60' }}>
          {success}
        </div>
      )}

      {isAdding && (
        <Card className="p-6 shadow-md">
          <h3 className="mb-4" style={{ color: '#003366' }}>Nouveau compte utilisateur</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Email</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="prenom.nom@sofia-technologies.com"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Mot de passe</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 rounded" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C' }}>{error}</div>
            )}
            <div className="flex gap-3">
              <Button type="submit" style={{ backgroundColor: '#F47B20' }}>Créer le compte</Button>
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setError(''); }}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#003366', color: 'white' }}>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Mot de passe</th>
              <th className="p-3 text-left">Rôle</th>
              <th className="p-3 text-left">Créé le</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ backgroundColor: idx % 2 === 0 ? '#F5F7FA' : 'white' }}>
                <td className="p-3" style={{ color: '#003366' }}>{user.email}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#2C3E50', fontFamily: 'monospace' }}>
                      {showPasswords[user.id] ? user.password : '••••••••'}
                    </span>
                    <button onClick={() => toggleShowPassword(user.id)} style={{ color: '#4A90E2' }}>
                      {showPasswords[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: user.role === 'admin' ? '#003366' : '#4A90E2',
                      color: 'white'
                    }}>
                    {user.role === 'admin' ? <><Shield className="w-3 h-3 inline mr-1" />Admin</> : <><User className="w-3 h-3 inline mr-1" />Utilisateur</>}
                  </span>
                </td>
                <td className="p-3 text-sm" style={{ color: '#717182' }}>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-3 text-center">
                  {user.email !== ADMIN_EMAIL && (
                    <Button
                      onClick={() => handleDelete(user.id, user.email)}
                      variant="outline" size="sm"
                      style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                      className="hover:bg-[#E74C3C] hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-sm" style={{ color: '#2C3E50' }}>
          Total : <strong>{users.length}</strong> compte(s)
        </div>
      </div>
    </div>
  );
}
