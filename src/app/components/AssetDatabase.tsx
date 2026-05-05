import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Download, Search, Trash2 } from 'lucide-react';
import type { Asset } from './AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AssetDatabaseProps {
  assets: Asset[];
  departments: Department[];
  onExportDatabaseCSV: () => void;
  onDeleteAsset: (id: string) => void;
  onDeleteAllAssets: () => void; // ← nouveau prop
}

const CATEGORY_CODES = [
  { code: 'ITE', name: 'IT Equipment' },
  { code: 'TDE', name: 'Technical Devices' },
  { code: 'STM', name: 'Storage Media' },
  { code: 'SDT', name: 'Sensitive Data' },
  { code: 'COM', name: 'Communication Equipment' }
];

export function AssetDatabase({ assets, departments, onExportDatabaseCSV, onDeleteAsset, onDeleteAllAssets }: AssetDatabaseProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getDeptCode = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.code || '';
  };

  const getCategoryCode = (category: string) => {
    const cat = CATEGORY_CODES.find(c => c.name === category);
    return cat?.code || category.substring(0, 3).toUpperCase();
  };

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchTerm.toLowerCase();
    return (
      asset.reference.toLowerCase().includes(searchLower) ||
      asset.subject.toLowerCase().includes(searchLower) ||
      getDeptCode(asset.departmentId).toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    const partsA = a.reference.split('-');
    const partsB = b.reference.split('-');
    const deptCmp = (partsA[0] || '').localeCompare(partsB[0] || '');
    if (deptCmp !== 0) return deptCmp;
    const catCmp = (partsA[1] || '').localeCompare(partsB[1] || '');
    if (catCmp !== 0) return catCmp;
    return (parseInt(partsA[2], 10) || 0) - (parseInt(partsB[2], 10) || 0);
  });

  const handleDelete = (assetId: string, reference: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la référence ${reference} ?\n\nCette référence sera réutilisée lors de la prochaine création d'asset avec le même département et la même catégorie.`)) {
      onDeleteAsset(assetId);
    }
  };

  const handleDeleteAll = () => {
    if (assets.length === 0) return;
    if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les ${assets.length} référence(s) ?\n\nCette action est irréversible.`)) {
      onDeleteAllAssets();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 relative mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#4A90E2' }} />
            <Input
              placeholder="Rechercher par département, catégorie ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDeleteAll}
              disabled={assets.length === 0}
              variant="outline"
              style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
              className="hover:bg-[#E74C3C] hover:text-white shadow-md"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer tous
            </Button>
            <Button onClick={onExportDatabaseCSV} style={{ backgroundColor: '#27AE60' }} className="shadow-md">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="p-3 rounded text-center mb-4" style={{ backgroundColor: '#FFF8DC', color: '#003366', border: '1px solid #F47B20' }}>
          <p className="text-sm">Cette base est alimentée automatiquement lorsque le <strong>Générateur de référence</strong> — ne pas modifier manuellement</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#003366', color: 'white' }}>
                <th className="p-3 text-left border" style={{ borderColor: 'white' }}>Département</th>
                <th className="p-3 text-left border" style={{ borderColor: 'white' }}>Catégorie</th>
                <th className="p-3 text-left border" style={{ borderColor: 'white' }}>Référence Asset</th>
                <th className="p-3 text-center border" style={{ borderColor: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center" style={{ color: '#4A90E2' }}>
                    Aucune référence générée. Utilisez le générateur pour créer des assets.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, idx) => (
                  <tr key={asset.id} style={{ backgroundColor: idx % 2 === 0 ? '#F5F7FA' : 'white' }}>
                    <td className="p-3 border" style={{ borderColor: '#ddd' }}>{getDeptCode(asset.departmentId)}</td>
                    <td className="p-3 border" style={{ borderColor: '#ddd' }}>{getCategoryCode(asset.category)}</td>
                    <td className="p-3 border font-medium" style={{ borderColor: '#ddd', color: '#003366' }}>{asset.reference}</td>
                    <td className="p-3 border text-center" style={{ borderColor: '#ddd' }}>
                      <Button
                        onClick={() => handleDelete(asset.id, asset.reference)}
                        variant="outline"
                        size="sm"
                        style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                        className="hover:bg-[#E74C3C] hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm" style={{ color: '#2C3E50' }}>
          Total des références : <strong>{filteredAssets.length}</strong>
        </div>
      </div>
    </div>
  );
}
