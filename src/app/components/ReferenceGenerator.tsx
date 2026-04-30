import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Asset } from './AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AssetPerson {
  id: string;
  name: string;
  departmentId: string;
  type: 'owner' | 'responsible';
}

interface ReferenceGeneratorProps {
  departments: Department[];
  assets: Asset[];
  people: AssetPerson[];
  onGenerateReference: (deptCode: string, categoryCode: string, subject: string, property: string) => void;
}

const CATEGORY_CODES = [
  { code: 'ITE', name: 'IT Equipment' },
  { code: 'TDE', name: 'Technical Devices' },
  { code: 'STM', name: 'Storage Media' },
  { code: 'SDT', name: 'Sensitive Data' },
  { code: 'COM', name: 'Communication Equipment' }
];

const PROPERTIES = ['SOFIATECH', 'Customer'];

export function ReferenceGenerator({ departments, assets, people, onGenerateReference }: ReferenceGeneratorProps) {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [property, setProperty] = useState('SOFIATECH');
  const [saved, setSaved] = useState(false);

  // ── Référence preview ──
  const previewReference = useMemo(() => {
    if (!selectedDept || !selectedCategory) return null;
    const prefix = `${selectedDept}-${selectedCategory}-`;
    const existingNumbers = assets
      .filter(a => a.reference.startsWith(prefix))
      .map(a => parseInt(a.reference.split('-')[2], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let next = 1;
    for (let i = 1; i <= existingNumbers.length; i++) {
      if (!existingNumbers.includes(i)) { next = i; break; }
      next = existingNumbers[existingNumbers.length - 1] + 1;
    }
    return `${selectedDept}-${selectedCategory}-${String(next).padStart(4, '0')}`;
  }, [selectedDept, selectedCategory, assets]);

  // ── Auto-fill depuis département ──
  const selectedDeptObj = departments.find(d => d.code === selectedDept);
  const deptOwner = selectedDeptObj ? people.find(p => p.departmentId === selectedDeptObj.id && p.type === 'owner') : null;
  const autoLocation = selectedDeptObj?.name || '';

  const handleReset = () => {
    setSelectedDept(''); setSelectedCategory(''); setSubject(''); setProperty('SOFIATECH'); setSaved(false);
  };

  const handleGenerate = () => {
    if (selectedDept && selectedCategory && subject) {
      onGenerateReference(selectedDept, selectedCategory, subject, property);
      handleReset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="p-4 rounded" style={{ backgroundColor: '#003366', color: 'white' }}>
              <h3 className="text-center">GÉNÉRER UNE RÉFÉRENCE</h3>
            </div>

            {/* Département */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Département *</label>
              <Select value={selectedDept} onValueChange={(v) => { setSelectedDept(v); setSaved(false); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.code}>{dept.code} - {dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Catégorie *</label>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSaved(false); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_CODES.map((cat) => (
                    <SelectItem key={cat.code} value={cat.code}>{cat.code} - {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Subject *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nom de l'asset (ex: Laptop Dell XPS)"
              />
            </div>

            {/* Property */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Property</label>
              <Select value={property} onValueChange={setProperty}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setSaved(true)}
              className="w-full"
              style={{ backgroundColor: '#F47B20', color: 'white' }}
              disabled={!selectedDept || !selectedCategory || !subject}
            >
              📥 Sauvegarder la sélection
            </Button>

            {/* Auto-filled info */}
            {selectedDeptObj && (
              <div className="p-3 rounded text-sm space-y-1" style={{ backgroundColor: '#E8F4F8', border: '1px solid #4A90E2' }}>
                <p style={{ color: '#003366' }}><strong>Asset Location (auto) :</strong> {autoLocation}</p>
                <p style={{ color: '#003366' }}><strong>Asset Owner (auto) :</strong> {deptOwner ? deptOwner.name : <span style={{ color: '#E74C3C' }}>Aucun owner défini pour ce département</span>}</p>
              </div>
            )}

            {/* Référence preview */}
            <div className="rounded overflow-hidden border-2" style={{ borderColor: '#F47B20' }}>
              <div className="p-3" style={{ backgroundColor: '#F47B20', color: 'white' }}>
                <p className="text-center font-medium">Référence générée</p>
              </div>
              <div className="p-4 text-center" style={{ backgroundColor: '#FFF8F0' }}>
                {previewReference ? (
                  <div>
                    <p className="text-2xl font-bold tracking-widest" style={{ color: '#003366' }}>{previewReference}</p>
                    <p className="text-xs mt-2" style={{ color: '#717182' }}>Référence qui sera assignée à cet asset</p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#717182' }}>Sélectionnez département et catégorie</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full py-6"
              style={{ backgroundColor: '#6B8E23', color: 'white' }}
              disabled={!saved || !subject}
            >
              ▶ Enregistrer l'asset
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="p-4" style={{ backgroundColor: '#003366', color: 'white' }}>
              <h4 className="text-center mb-4">Codes Départements</h4>
              <table className="w-full text-sm">
                <tbody>
                  {departments.map((dept, idx) => (
                    <tr key={idx} className="border-b border-white/20">
                      <td className="py-2 px-2 font-medium">{dept.code}</td>
                      <td className="py-2 px-2">{dept.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-4" style={{ backgroundColor: '#F47B20', color: 'white' }}>
              <h4 className="text-center mb-4">Codes Catégories</h4>
              <table className="w-full text-sm">
                <tbody>
                  {CATEGORY_CODES.map((cat, idx) => (
                    <tr key={idx} className="border-b border-white/20">
                      <td className="py-2 px-2 font-medium">{cat.code}</td>
                      <td className="py-2 px-2">{cat.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="p-4 rounded text-center" style={{ backgroundColor: '#E8F4F8', color: '#003366', border: '2px solid #003366' }}>
              <p className="font-medium">Règle de codification</p>
              <p className="text-lg font-bold mt-2">[DEPT] — [CAT] — [XXXX]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
