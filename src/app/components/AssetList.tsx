import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Pencil, Trash2, Download, Search } from 'lucide-react';
import type { Asset } from './AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AssetListProps {
  assets: Asset[];
  departments: Department[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onExportCSV: (departmentId?: string, selectedIds?: string[]) => void;
}

export function AssetList({ assets, departments, onEdit, onDelete, onExportCSV }: AssetListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? `${dept.name} (${dept.code})` : 'Unknown';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = filterDept === 'all' || asset.departmentId === filterDept;

    return matchesSearch && matchesDept;
  }).sort((a, b) => {
    // Sort by reference: split into parts [deptCode, categoryCode, number]
    const partsA = a.reference.split('-');
    const partsB = b.reference.split('-');
    // Compare dept code first, then category, then numeric sequence
    const deptCmp = (partsA[0] || '').localeCompare(partsB[0] || '');
    if (deptCmp !== 0) return deptCmp;
    const catCmp = (partsA[1] || '').localeCompare(partsB[1] || '');
    if (catCmp !== 0) return catCmp;
    return (parseInt(partsA[2], 10) || 0) - (parseInt(partsB[2], 10) || 0);
  });

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleExport = () => {
    if (selectedAssets.size > 0) {
      onExportCSV(filterDept === 'all' ? undefined : filterDept, Array.from(selectedAssets));
    } else {
      onExportCSV(filterDept === 'all' ? undefined : filterDept);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority.startsWith('A')) return '#E74C3C';
    if (priority.startsWith('B')) return '#F47B20';
    if (priority.startsWith('C')) return '#F39C12';
    if (priority.startsWith('D')) return '#4A90E2';
    return '#4A90E2';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#4A90E2' }} />
            <Input
              placeholder="Rechercher par référence, sujet ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les départements</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} style={{ backgroundColor: '#27AE60' }} className="shadow-md">
            <Download className="w-4 h-4 mr-2" />
            {selectedAssets.size > 0 ? `Export (${selectedAssets.size})` : 'Export Tous'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: '#2C3E50' }}>
          {filteredAssets.length} asset(s) trouvé(s)
          {selectedAssets.size > 0 && ` - ${selectedAssets.size} sélectionné(s)`}
        </div>
        {filteredAssets.length > 0 && (
          <Button
            onClick={toggleSelectAll}
            variant="outline"
            size="sm"
            style={{ color: '#F47B20', borderColor: '#F47B20' }}
          >
            {selectedAssets.size === filteredAssets.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredAssets.length === 0 ? (
          <Card className="p-8 text-center shadow-sm">
            <p style={{ color: '#4A90E2' }}>Aucun asset trouvé. Créez votre premier asset.</p>
          </Card>
        ) : (
          filteredAssets.map(asset => (
            <Card key={asset.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <Checkbox
                    checked={selectedAssets.has(asset.id)}
                    onCheckedChange={() => toggleAssetSelection(asset.id)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="px-3 py-1.5 rounded-lg font-semibold text-sm shadow-sm" style={{ backgroundColor: '#003366', color: 'white' }}>
                      {asset.reference}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-sm" style={{ backgroundColor: '#F5F7FA', color: '#4A90E2' }}>
                      {getDepartmentName(asset.departmentId)}
                    </span>
                    {asset.priority && (
                      <span className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: getPriorityColor(asset.priority), color: 'white' }}>
                        {asset.priority}
                      </span>
                    )}
                    {asset.status && (
                      <span className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#27AE60', color: 'white' }}>
                        {asset.status}
                      </span>
                    )}
                  </div>
                  <h4 className="mb-2 text-lg" style={{ color: '#003366' }}>{asset.subject}</h4>
                  {asset.description && (
                    <p className="text-sm mb-3 pb-3 border-b" style={{ color: '#2C3E50' }}>{asset.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {asset.category && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Catégorie:</span> <span style={{ color: '#2C3E50' }}>{asset.category}</span></div>}
                    {asset.property && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Propriété:</span> <span style={{ color: '#2C3E50' }}>{asset.property}</span></div>}
                    {asset.location && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Localisation:</span> <span style={{ color: '#2C3E50' }}>{asset.location}</span></div>}
                    {asset.responsible && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Responsable:</span> <span style={{ color: '#2C3E50' }}>{asset.responsible}</span></div>}
                    {asset.owner && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Propriétaire:</span> <span style={{ color: '#2C3E50' }}>{asset.owner}</span></div>}
                    {asset.assignedTo && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Assigné à:</span> <span style={{ color: '#2C3E50' }}>{asset.assignedTo}</span></div>}
                    {asset.actualStatus && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Statut actuel:</span> <span style={{ color: '#2C3E50' }}>{asset.actualStatus}</span></div>}
                    {asset.acquisitionDate && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Date acquisition:</span> <span style={{ color: '#2C3E50' }}>{asset.acquisitionDate}</span></div>}
                    {asset.calibrationStatus && <div><span className="font-medium" style={{ color: '#4A90E2' }}>Calibration:</span> <span style={{ color: '#2C3E50' }}>{asset.calibrationStatus}</span></div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => onEdit(asset)} variant="outline" size="sm" className="hover:bg-[#F47B20] hover:text-white hover:border-[#F47B20]">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(asset.id)}
                    variant="outline"
                    size="sm"
                    style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                    className="hover:bg-[#E74C3C] hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
