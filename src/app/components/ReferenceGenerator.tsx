import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Asset } from './AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface ReferenceGeneratorProps {
  departments: Department[];
  assets: Asset[];
  onGenerateReference: (deptCode: string, categoryCode: string) => void;
}

const DEPARTMENT_CODES = [
  { code: 'RD', name: 'Research & Development' },
  { code: 'AMQ', name: 'Quality (AMQ)' },
  { code: 'HW', name: 'Hardware' },
  { code: 'SW', name: 'Software' },
];

const CATEGORY_CODES = [
  { code: 'ITE', name: 'IT Equipment' },
  { code: 'TDE', name: 'Technical Devices' },
  { code: 'STM', name: 'Storage Media' },
  { code: 'SDT', name: 'Sensitive Data' },
  { code: 'COM', name: 'Communication Equipment' }
];

export function ReferenceGenerator({ departments, assets, onGenerateReference }: ReferenceGeneratorProps) {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saved, setSaved] = useState(false);

  // ── Calcul de la référence preview en temps réel ──────────────────────
  const previewReference = useMemo(() => {
    if (!selectedDept || !selectedCategory) return null;

    const prefix = `${selectedDept}-${selectedCategory}-`;
    const existingNumbers = assets
      .filter(a => a.reference.startsWith(prefix))
      .map(a => {
        const parts = a.reference.split('-');
        return parseInt(parts[2], 10);
      })
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    if (existingNumbers.length > 0) {
      for (let i = 1; i <= existingNumbers.length; i++) {
        if (!existingNumbers.includes(i)) { nextNumber = i; break; }
        nextNumber = existingNumbers[existingNumbers.length - 1] + 1;
      }
    }

    return `${selectedDept}-${selectedCategory}-${String(nextNumber).padStart(4, '0')}`;
  }, [selectedDept, selectedCategory, assets]);

  const handleSave = () => {
    if (selectedDept && selectedCategory) setSaved(true);
  };

  const handleGenerate = () => {
    if (selectedDept && selectedCategory) {
      onGenerateReference(selectedDept, selectedCategory);
      setSelectedDept('');
      setSelectedCategory('');
      setSaved(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-4 rounded" style={{ backgroundColor: '#003366', color: 'white' }}>
              <h3 className="text-center">GÉNÉRER UNE RÉFÉRENCE</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Département</label>
                <Select value={selectedDept} onValueChange={(v) => { setSelectedDept(v); setSaved(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_CODES.map((dept) => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.code} - {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 font-medium" style={{ color: '#2C3E50' }}>Catégorie</label>
                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSaved(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_CODES.map((cat) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {cat.code} - {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                style={{ backgroundColor: '#F47B20', color: 'white' }}
                disabled={!selectedDept || !selectedCategory}
              >
                📥 Sauvegarder Département et Catégorie
              </Button>
            </div>

            {/* ── Zone Référence générée ── */}
            <div className="rounded overflow-hidden border-2" style={{ borderColor: '#F47B20' }}>
              <div className="p-3" style={{ backgroundColor: '#F47B20', color: 'white' }}>
                <p className="text-center font-medium">Référence générée</p>
              </div>
              <div className="p-4 text-center" style={{ backgroundColor: '#FFF8F0' }}>
                {previewReference ? (
                  <div>
                    <p
                      className="text-2xl font-bold tracking-widest"
                      style={{ color: '#003366' }}
                    >
                      {previewReference}
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#717182' }}>
                      Cette référence sera assignée lors de l'enregistrement
                    </p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#717182' }}>
                    Sélectionnez un département et une catégorie pour voir la référence
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full py-6"
              style={{ backgroundColor: '#6B8E23', color: 'white' }}
              disabled={!saved}
            >
              ▶ Cliquez ici pour enregistrer
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="p-4" style={{ backgroundColor: '#003366', color: 'white' }}>
              <h4 className="text-center mb-4">Codes Départements</h4>
              <table className="w-full text-sm">
                <tbody>
                  {DEPARTMENT_CODES.map((dept, idx) => (
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