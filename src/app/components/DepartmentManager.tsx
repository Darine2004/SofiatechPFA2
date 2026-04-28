import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentManagerProps {
  departments: Department[];
  onAdd: (dept: Omit<Department, 'id'>) => void;
  onEdit: (id: string, dept: Omit<Department, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function DepartmentManager({ departments, onAdd, onEdit, onDelete }: DepartmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(editingId, formData);
      setEditingId(null);
    } else {
      onAdd(formData);
      setIsAdding(false);
    }
    setFormData({ name: '', code: '' });
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, code: dept.code });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', code: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: '#003366' }}>Gestion des Départements</h2>
          <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer et gérer les départements de l'organisation</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} style={{ backgroundColor: '#F47B20' }} className="shadow-md hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un département
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-6 shadow-md">
          <h3 className="mb-4" style={{ color: '#003366' }}>{editingId ? 'Modifier le département' : 'Nouveau département'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Nom du département</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Informatique"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: '#2C3E50' }}>Code</label>
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ex: IT"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" style={{ backgroundColor: '#F47B20' }} className="hover:opacity-90">
                {editingId ? 'Modifier' : 'Ajouter'}
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline">
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {departments.length === 0 ? (
          <Card className="p-8 text-center shadow-sm">
            <p style={{ color: '#4A90E2' }}>Aucun département créé. Commencez par ajouter un département.</p>
          </Card>
        ) : (
          departments.map((dept) => (
            <Card key={dept.id} className="p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="font-semibold text-lg" style={{ color: '#003366' }}>{dept.name}</div>
                <div className="text-sm mt-1" style={{ color: '#4A90E2' }}>Code: {dept.code}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(dept)}
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#4A90E2] hover:text-white hover:border-[#4A90E2]"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(dept.id)}
                  variant="outline"
                  size="sm"
                  style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                  className="hover:bg-[#E74C3C] hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
