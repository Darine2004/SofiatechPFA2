import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { DepartmentManager } from './components/DepartmentManager';
import { AssetForm, type Asset } from './components/AssetForm';
import { AssetList } from './components/AssetList';
import { LoginPage } from './components/LoginPage';
import { ReferenceGenerator } from './components/ReferenceGenerator';
import { AssetDatabase } from './components/AssetDatabase';
import { Plus, LogOut } from 'lucide-react';
import logoImage from '../imports/image.png';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('sofiatech-auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('sofiatech-user') || '';
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('sofiatech-departments');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultDepartments: Department[] = [
      { id: crypto.randomUUID(), name: 'Research & Development', code: 'RD' },
      { id: crypto.randomUUID(), name: 'Quality (AMQ)', code: 'AMQ' },
      { id: crypto.randomUUID(), name: 'Hardware', code: 'HW' },
      { id: crypto.randomUUID(), name: 'Software', code: 'SW' }
    ];
    localStorage.setItem('sofiatech-departments', JSON.stringify(defaultDepartments));
    return defaultDepartments;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('sofiatech-assets');
    return saved ? JSON.parse(saved) : [];
  });

  const [sequences, setSequences] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sofiatech-sequences');
    return saved ? JSON.parse(saved) : {};
  });

  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    localStorage.setItem('sofiatech-departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('sofiatech-assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('sofiatech-sequences', JSON.stringify(sequences));
  }, [sequences]);

  const findNextAvailableNumber = (deptCode: string, categoryCode: string): number => {
    const prefix = `${deptCode}-${categoryCode}-`;
    const existingNumbers = assets
      .filter(a => a.reference.startsWith(prefix))
      .map(a => {
        const parts = a.reference.split('-');
        return parseInt(parts[2], 10);
      })
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (existingNumbers.length === 0) {
      return 1;
    }

    for (let i = 1; i <= existingNumbers.length; i++) {
      if (!existingNumbers.includes(i)) {
        return i;
      }
    }

    return existingNumbers[existingNumbers.length - 1] + 1;
  };

  const generateReference = (departmentId: string, categoryCode?: string): string => {
    const dept = departments.find(d => d.id === departmentId);
    if (!dept) return '';

    if (categoryCode) {
      const nextNumber = findNextAvailableNumber(dept.code, categoryCode);
      return `${dept.code}-${categoryCode}-${String(nextNumber).padStart(4, '0')}`;
    }

    const key = dept.code;
    const currentSeq = sequences[key] || 0;
    const nextSeq = currentSeq + 1;
    setSequences(prev => ({ ...prev, [key]: nextSeq }));
    return `${dept.code}-${String(nextSeq).padStart(4, '0')}`;
  };

  const handleGenerateReference = (deptCode: string, categoryCode: string) => {
    const dept = departments.find(d => d.code === deptCode);
    if (!dept) {
      alert('Département non trouvé');
      return;
    }

    const reference = generateReference(dept.id, categoryCode);

    const categoryMap: Record<string, string> = {
      'ITE': 'IT Equipment',
      'TDE': 'Technical Device',
      'STM': 'Storage Media',
      'SDT': 'Sensitive Data',
      'COM': 'Communication Equipment'
    };

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      departmentId: dept.id,
      reference,
      subject: `Asset ${reference}`,
      description: '',
      category: categoryMap[categoryCode] || categoryCode,
      property: 'SOFIATECH',
      location: '',
      responsible: '',
      owner: '',
      assignedTo: '',
      actualStatus: '',
      returnCondition: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      calibrationStatus: '',
      calibrationDeadline: '',
      status: 'Registered',
      priority: 'D - Restricted'
    };

    setAssets([...assets, newAsset]);
    alert(`Référence créée avec succès : ${reference}`);
  };

  const handleAddDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: crypto.randomUUID(),
    };
    setDepartments([...departments, newDept]);
  };

  const handleEditDepartment = (id: string, dept: Omit<Department, 'id'>) => {
    setDepartments(departments.map(d => d.id === id ? { ...d, ...dept } : d));
  };

  const handleDeleteDepartment = (id: string) => {
    if (assets.some(a => a.departmentId === id)) {
      alert('Impossible de supprimer un département contenant des assets');
      return;
    }
    setDepartments(departments.filter(d => d.id !== id));
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'reference' | 'status'> & { status?: string }) => {
    const categoryCodeMap: Record<string, string> = {
      'IT Equipment': 'ITE',
      'Technical Device': 'TDE',
      'Storage Media': 'STM',
      'Sensitive Data': 'SDT',
      'Communication Equipment': 'COM'
    };

    const categoryCode = categoryCodeMap[assetData.category] || 'XXX';
    const reference = generateReference(assetData.departmentId, categoryCode);

    const newAsset: Asset = {
      ...assetData,
      id: crypto.randomUUID(),
      reference,
      status: 'Registered',
      priority: assetData.priority || '',
    };
    setAssets([...assets, newAsset]);
    setIsAddingAsset(false);
  };

  const handleEditAsset = (assetData: Omit<Asset, 'id' | 'reference' | 'status'> & { reference: string; status?: string }) => {
    if (!editingAsset) return;
    setAssets(assets.map(a => a.id === editingAsset.id ? { ...a, ...assetData, status: 'Registered', priority: assetData.priority || '' } : a));
    setEditingAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet asset ?')) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const handleDeleteAssetFromDatabase = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const handleLogin = (username: string, password: string) => {
    if (username === 'DarineetNour' && password === 'sofiatech') {
      setIsAuthenticated(true);
      setCurrentUser(username);
      localStorage.setItem('sofiatech-auth', 'true');
      localStorage.setItem('sofiatech-user', username);
    } else {
      alert('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    localStorage.removeItem('sofiatech-auth');
    localStorage.removeItem('sofiatech-user');
  };

  const handleExportDatabaseCSV = () => {
    if (assets.length === 0) {
      alert('Aucune référence à exporter');
      return;
    }

    const headers = ['Département', 'Catégorie', 'Référence Asset'];

    const categoryCodeMap: Record<string, string> = {
      'IT Equipment': 'ITE',
      'Technical Device': 'TDE',
      'Storage Media': 'STM',
      'Sensitive Data': 'SDT',
      'Communication Equipment': 'COM'
    };

    const escapeCSVField = (field: string) => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = assets.map(asset => {
      const dept = departments.find(d => d.id === asset.departmentId);
      const categoryCode = categoryCodeMap[asset.category] || asset.category.substring(0, 3).toUpperCase();

      return [
        dept?.code || '',
        categoryCode,
        asset.reference
      ].map(escapeCSVField);
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sofiatech-references-database-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (departmentId?: string, selectedIds?: string[]) => {
    let assetsToExport = departmentId
      ? assets.filter(a => a.departmentId === departmentId)
      : assets;

    if (selectedIds && selectedIds.length > 0) {
      assetsToExport = assetsToExport.filter(a => selectedIds.includes(a.id));
    }

    if (assetsToExport.length === 0) {
      alert('Aucun asset à exporter');
      return;
    }

    const headers = [
      'Subject',
      'Asset Description',
      'Status',
      'Priority',
      'Asset Reference',
      'Asset Category',
      'Property',
      'Asset Location',
      'Asset Responsible',
      'Asset Owner',
      'Assigned To',
      'Asset Actual Status',
      'Asset Return Condition',
      'Acquisition Date',
      'Calibration Status',
      'Calibration Validity Deadline'
    ];

    const escapeCSVField = (field: string) => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = assetsToExport.map(asset => {
      return [
        asset.subject,
        asset.description,
        asset.status,
        asset.priority,
        asset.reference,
        asset.category,
        asset.property,
        asset.location,
        asset.responsible,
        asset.owner,
        asset.assignedTo,
        asset.actualStatus,
        asset.returnCondition,
        asset.acquisitionDate,
        asset.calibrationStatus,
        asset.calibrationDeadline
      ].map(escapeCSVField);
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sofiatech-assets-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <header className="border-b shadow-sm" style={{ backgroundColor: '#003366', color: 'white' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg">
                <img src={logoImage} alt="Sofiatech Logo" className="h-10 w-auto" />
              </div>
              <div>
                <h1 className="text-xl">Sofiatech Asset Manager</h1>
                <p className="text-sm opacity-90 mt-0.5">Gestion des équipements et matériels par département</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm opacity-90">Connecté en tant que</p>
                <p className="font-medium">{currentUser}</p>
              </div>
              <Button
                onClick={handleLogout}
                size="sm"
                style={{ backgroundColor: '#F47B20', color: 'white' }}
                className="hover:opacity-90"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1">
            <TabsTrigger value="generator" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">
              Générateur de Références
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">
              Base de Données
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">
              Gestion Assets
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">
              Départements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="mb-4">
              <h2 style={{ color: '#003366' }}>Générateur de Références Assets</h2>
              <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer automatiquement des références pour les nouveaux assets</p>
            </div>
            <ReferenceGenerator
              departments={departments}
              onGenerateReference={handleGenerateReference}
            />
          </TabsContent>

          <TabsContent value="database">
            <div className="mb-4">
              <h2 style={{ color: '#003366' }}>Base de Données — Références Assets</h2>
              <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Consultation de toutes les références générées</p>
            </div>
            <AssetDatabase
              assets={assets}
              departments={departments}
              onExportDatabaseCSV={handleExportDatabaseCSV}
              onDeleteAsset={handleDeleteAssetFromDatabase}
            />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            {!isAddingAsset && !editingAsset && (
              <div className="flex justify-between items-center">
                <div>
                  <h2 style={{ color: '#003366' }}>Gestion des Assets</h2>
                  <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer et gérer tous les équipements de l'organisation</p>
                </div>
                <Button onClick={() => setIsAddingAsset(true)} style={{ backgroundColor: '#F47B20' }} className="shadow-md hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel asset
                </Button>
              </div>
            )}

            {isAddingAsset && (
              <AssetForm
                departments={departments}
                onSubmit={handleAddAsset}
                onCancel={() => setIsAddingAsset(false)}
              />
            )}

            {editingAsset && (
              <AssetForm
                departments={departments}
                asset={editingAsset}
                onSubmit={handleEditAsset}
                onCancel={() => setEditingAsset(null)}
              />
            )}

            {!isAddingAsset && !editingAsset && (
              <AssetList
                assets={assets}
                departments={departments}
                onEdit={setEditingAsset}
                onDelete={handleDeleteAsset}
                onExportCSV={handleExportCSV}
              />
            )}
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManager
              departments={departments}
              onAdd={handleAddDepartment}
              onEdit={handleEditDepartment}
              onDelete={handleDeleteDepartment}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}