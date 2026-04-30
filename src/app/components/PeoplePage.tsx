import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, User, Users } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AssetPerson {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  type: 'owner' | 'responsible';
}

interface PeoplePageProps {
  departments: Department[];
  people: AssetPerson[];
  onSavePeople: (people: AssetPerson[]) => void;
}

export function PeoplePage({ departments, people, onSavePeople }: PeoplePageProps) {
  const [filterDept, setFilterDept] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', departmentId: '', type: 'responsible' as 'owner' | 'responsible' });
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.departmentId) { setError('Nom et département sont requis'); return; }

    if (form.type === 'owner') {
      const existingOwner = people.find(p => p.departmentId === form.departmentId && p.type === 'owner');
      if (existingOwner) {
        setError(`Un Asset Owner existe déjà pour ce département : ${existingOwner.name}. Supprimez-le d'abord.`);
        return;
      }
    }

    const newPerson: AssetPerson = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      departmentId: form.departmentId,
      type: form.type,
    };
    onSavePeople([...people, newPerson]);
    setForm({ name: '', email: '', departmentId: '', type: 'responsible' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onSavePeople(people.filter(p => p.id !== id));
  };

  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.name || '';
  const getDeptCode = (deptId: string) => departments.find(d => d.id === deptId)?.code || '';

  const filtered = filterDept === 'all' ? people : people.filter(p => p.departmentId === filterDept);
  const owners = filtered.filter(p => p.type === 'owner');
  const responsibles = filtered.filter(p => p.type === 'responsible');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: '#003366' }}>Asset Owner & Asset Responsible</h2>
          <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Gérer les personnes responsables par département</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} style={{ backgroundColor: '#F47B20' }} className="shadow-md hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une personne
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-6 shadow-md">
          <h3 className="mb-4" style={{ color: '#003366' }}>Nouvelle personne</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Nom complet *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" />
              </div>
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@sofiatech.com" />
              </div>
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Département *</label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Type *</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'owner' | 'responsible' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Asset Owner (1 par département)</SelectItem>
                    <SelectItem value="responsible">Asset Responsible (plusieurs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <div className="p-3 rounded text-sm" style={{ backgroundColor: '#FFE5E5', color: '#E74C3C' }}>{error}</div>}
            <div className="flex gap-3">
              <Button type="submit" style={{ backgroundColor: '#F47B20' }}>Ajouter</Button>
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setError(''); }}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm" style={{ color: '#717182' }}>{filtered.length} personne(s)</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#003366', color: 'white' }}>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Département</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: '#4A90E2' }}>Aucune personne ajoutée.</td></tr>
            ) : (
              filtered.map((person, idx) => (
                <tr key={person.id} style={{ backgroundColor: idx % 2 === 0 ? '#F5F7FA' : 'white' }}>
                  <td className="p-3 font-medium" style={{ color: '#003366' }}>
                    {person.type === 'owner'
                      ? <><User className="w-4 h-4 inline mr-1" />{person.name}</>
                      : <><Users className="w-4 h-4 inline mr-1" />{person.name}</>
                    }
                  </td>
                  <td className="p-3 text-sm" style={{ color: '#2C3E50' }}>{person.email || '—'}</td>
                  <td className="p-3 text-sm" style={{ color: '#2C3E50' }}>{getDeptName(person.departmentId)} <span style={{ color: '#4A90E2' }}>({getDeptCode(person.departmentId)})</span></td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: person.type === 'owner' ? '#003366' : '#F47B20',
                        color: 'white'
                      }}>
                      {person.type === 'owner' ? 'Asset Owner' : 'Asset Responsible'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button onClick={() => handleDelete(person.id)} variant="outline" size="sm"
                      style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                      className="hover:bg-[#E74C3C] hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
