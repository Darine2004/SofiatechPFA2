import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { DepartmentManager } from './components/DepartmentManager';
import { AssetForm, type Asset } from './components/AssetForm';
import { AssetList } from './components/AssetList';
import { LoginPage } from './components/LoginPage';
import { ReferenceGenerator } from './components/ReferenceGenerator';
import { AssetDatabase } from './components/AssetDatabase';
import { AdminPage } from './components/AdminPage';
import { PeoplePage } from './components/PeoplePage';
import { CSVImporter } from './components/CSVImporter';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { Plus, LogOut, Wifi, WifiOff, Loader2, Shield } from 'lucide-react';
import logoImage from '../imports/image.png';

const ADMIN_EMAILS = ['nour.dhaouadi17@gmail.com', 'sahar.beji@sofia-technologies.com'];

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('sofiatech-auth') === 'true');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('sofiatech-user') || '');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>(() => (localStorage.getItem('sofiatech-role') as 'admin' | 'user') || 'user');

  const {
    assets, departments, sequences, users, people,
    isLoading, isConnected,
    saveAssets, saveDepartments, saveSequences, saveUsers, savePeople,
  } = useFirebaseSync();

  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isImportingCSV, setIsImportingCSV] = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────
  const handleLogin = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const role = user.role || 'user';
      setIsAuthenticated(true);
      setCurrentUser(email);
      setCurrentUserRole(role);
      localStorage.setItem('sofiatech-auth', 'true');
      localStorage.setItem('sofiatech-user', email);
      localStorage.setItem('sofiatech-role', role);
    } else {
      alert('Email ou mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setCurrentUserRole('user');
    localStorage.removeItem('sofiatech-auth');
    localStorage.removeItem('sofiatech-user');
    localStorage.removeItem('sofiatech-role');
  };

  const handleForgotPassword = (email: string) => {
    console.log(`Demande de récupération pour: ${email}`);
  };

  // ── Référence ───────────────────────────────────────────────────────────
  const findNextAvailableNumber = useCallback((deptCode: string, categoryCode: string): number => {
    const prefix = `${deptCode}-${categoryCode}-`;
    const existingNumbers = assets
      .filter(a => a.reference.startsWith(prefix))
      .map(a => parseInt(a.reference.split('-')[2], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    if (existingNumbers.length === 0) return 1;
    for (let i = 1; i <= existingNumbers.length; i++) {
      if (!existingNumbers.includes(i)) return i;
    }
    return existingNumbers[existingNumbers.length - 1] + 1;
  }, [assets]);

  const generateReference = useCallback((departmentId: string, categoryCode?: string): string => {
    const dept = departments.find(d => d.id === departmentId);
    if (!dept) return '';
    if (categoryCode) {
      const nextNumber = findNextAvailableNumber(dept.code, categoryCode);
      return `${dept.code}-${categoryCode}-${String(nextNumber).padStart(4, '0')}`;
    }
    const key = dept.code;
    const currentSeq = sequences[key] || 0;
    const nextSeq = currentSeq + 1;
    saveSequences({ ...sequences, [key]: nextSeq });
    return `${dept.code}-${String(nextSeq).padStart(4, '0')}`;
  }, [departments, sequences, findNextAvailableNumber, saveSequences]);

  // ── Générateur ──────────────────────────────────────────────────────────
  const handleGenerateReference = useCallback((deptCode: string, categoryCode: string, subject: string, property: string) => {
    const dept = departments.find(d => d.code === deptCode);
    if (!dept) { alert('Département non trouvé'); return; }

    const categoryMap: Record<string, string> = {
      'ITE': 'IT Equipment', 'TDE': 'Technical Device',
      'STM': 'Storage Media', 'SDT': 'Sensitive Data', 'COM': 'Communication Equipment'
    };

    const reference = generateReference(dept.id, categoryCode);
    const owner = people.find(p => p.departmentId === dept.id && p.type === 'owner');

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      departmentId: dept.id,
      reference,
      subject: subject || `Asset ${reference}`,
      description: '',
      category: categoryMap[categoryCode] || categoryCode,
      property: property || 'SOFIATECH',
      location: dept.name,
      responsible: '',
      owner: owner?.name || '',
      assignedTo: '',
      actualStatus: '',
      returnCondition: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      calibrationStatus: '',
      calibrationDeadline: '',
      status: 'Registered',
      priority: 'D - Restricted'
    };

    saveAssets([...assets, newAsset]);
    alert(`Référence créée : ${reference}`);
  }, [departments, assets, people, generateReference, saveAssets]);

  // ── Départements ────────────────────────────────────────────────────────
  const handleAddDepartment = useCallback((dept: Omit<Department, 'id'>) => {
    saveDepartments([...departments, { ...dept, id: crypto.randomUUID() }]);
  }, [departments, saveDepartments]);

  const handleEditDepartment = useCallback((id: string, dept: Omit<Department, 'id'>) => {
    saveDepartments(departments.map(d => d.id === id ? { ...d, ...dept } : d));
  }, [departments, saveDepartments]);

  const handleDeleteDepartment = useCallback((id: string) => {
    if (assets.some(a => a.departmentId === id)) { alert('Impossible de supprimer un département contenant des assets'); return; }
    saveDepartments(departments.filter(d => d.id !== id));
  }, [assets, departments, saveDepartments]);

  // ── Assets ──────────────────────────────────────────────────────────────
  const handleAddAsset = useCallback((assetData: Omit<Asset, 'id' | 'reference' | 'status'> & { status?: string }) => {
    const categoryCodeMap: Record<string, string> = {
      'IT Equipment': 'ITE', 'Technical Device': 'TDE',
      'Storage Media': 'STM', 'Sensitive Data': 'SDT', 'Communication Equipment': 'COM'
    };
    const reference = generateReference(assetData.departmentId, categoryCodeMap[assetData.category] || 'XXX');
    saveAssets([...assets, { ...assetData, id: crypto.randomUUID(), reference, status: 'Registered', priority: assetData.priority || '' }]);
    setIsAddingAsset(false);
  }, [assets, generateReference, saveAssets]);

  const handleEditAsset = useCallback((assetData: any) => {
    if (!editingAsset) return;
    saveAssets(assets.map(a => a.id === editingAsset.id ? { ...a, ...assetData, status: 'Registered' } : a));
    setEditingAsset(null);
  }, [editingAsset, assets, saveAssets]);

  const handleDeleteAsset = useCallback((id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet asset ?')) saveAssets(assets.filter(a => a.id !== id));
  }, [assets, saveAssets]);

  const handleDeleteAssetFromDatabase = useCallback((id: string) => {
    saveAssets(assets.filter(a => a.id !== id));
  }, [assets, saveAssets]);

  const handleImportCSV = useCallback((assetsData: any[]) => {
    const newAssets: Asset[] = assetsData.map(assetData => ({
      ...assetData, id: crypto.randomUUID(), status: 'Registered',
    }));
    saveAssets([...assets, ...newAssets]);
    setIsImportingCSV(false);
  }, [assets, saveAssets]);

  // ── Export CSV ──────────────────────────────────────────────────────────
  const escape = (field: string) => {
    const str = String(field || '');
    return (str.includes(',') || str.includes('"') || str.includes('\n')) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const handleExportDatabaseCSV = () => {
    if (assets.length === 0) { alert('Aucune référence à exporter'); return; }
    const catMap: Record<string, string> = { 'IT Equipment': 'ITE', 'Technical Device': 'TDE', 'Storage Media': 'STM', 'Sensitive Data': 'SDT', 'Communication Equipment': 'COM' };
    const rows = assets.map(a => {
      const dept = departments.find(d => d.id === a.departmentId);
      return [dept?.code || '', catMap[a.category] || a.category.substring(0, 3).toUpperCase(), a.reference].map(escape);
    });
    const csv = [['Département', 'Catégorie', 'Référence Asset'].join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `sofiatech-references-${new Date().toISOString().split('T')[0]}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (departmentId?: string, selectedIds?: string[]) => {
    let toExport = departmentId ? assets.filter(a => a.departmentId === departmentId) : assets;
    if (selectedIds?.length) toExport = toExport.filter(a => selectedIds.includes(a.id));
    if (toExport.length === 0) { alert('Aucun asset à exporter'); return; }
    const headers = ['Subject', 'Asset Description', 'Status', 'Priority', 'Asset Reference', 'Asset Category', 'Property', 'Asset Location', 'Asset Responsible', 'Asset Owner', 'Assigned To', 'Asset Actual Status', 'Asset Return Condition', 'Acquisition Date', 'Calibration Status', 'Calibration Validity Deadline'];
    const rows = toExport.map(a => [a.subject, a.description, a.status, a.priority, a.reference, a.category, a.property, a.location, a.responsible, a.owner, a.assignedTo, a.actualStatus, a.returnCondition, a.acquisitionDate, a.calibrationStatus, a.calibrationDeadline].map(escape));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `sofiatech-assets-${new Date().toISOString().split('T')[0]}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPage users={users} onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FA' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#003366' }} />
          <p style={{ color: '#003366' }} className="text-lg font-medium">Connexion à Firebase...</p>
        </div>
      </div>
    );
  }

  const firebaseUser = users.find(u => u.email === currentUser);
  const isAdmin = firebaseUser?.role === 'admin' || ADMIN_EMAILS.includes(currentUser);

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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: isConnected ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)', color: isConnected ? '#27AE60' : '#E74C3C', border: `1px solid ${isConnected ? '#27AE60' : '#E74C3C'}` }}>
                {isConnected ? <><Wifi className="w-3.5 h-3.5" /> Synchronisé</> : <><WifiOff className="w-3.5 h-3.5" /> Hors ligne</>}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#F47B20', color: 'white', fontSize: '11px' }}>
                  <Shield className="w-3 h-3" /> Admin
                </div>
              )}
              <div className="text-right">
                <p className="text-sm opacity-90">Connecté</p>
                <p className="font-medium text-sm">{currentUser}</p>
              </div>
              <Button onClick={handleLogout} size="sm" style={{ backgroundColor: '#F47B20', color: 'white' }} className="hover:opacity-90">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="generator" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">Générateur</TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">Base de Données</TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">Gestion Assets</TabsTrigger>
            <TabsTrigger value="people" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">Owner & Responsible</TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-[#003366] data-[state=active]:text-white">Départements</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="data-[state=active]:bg-[#F47B20] data-[state=active]:text-white">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="generator">
            <div className="mb-4">
              <h2 style={{ color: '#003366' }}>Générateur de Références Assets</h2>
              <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer automatiquement des références pour les nouveaux assets</p>
            </div>
            <ReferenceGenerator departments={departments} assets={assets} people={people} onGenerateReference={handleGenerateReference} />
          </TabsContent>

          <TabsContent value="database">
            <div className="mb-4">
              <h2 style={{ color: '#003366' }}>Base de Données — Références Assets</h2>
            </div>
            <AssetDatabase assets={assets} departments={departments} onExportDatabaseCSV={handleExportDatabaseCSV} onDeleteAsset={handleDeleteAssetFromDatabase} />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            {!isAddingAsset && !editingAsset && !isImportingCSV && (
              <div className="flex justify-between items-center">
                <div>
                  <h2 style={{ color: '#003366' }}>Gestion des Assets</h2>
                  <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>Créer et gérer tous les équipements</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsImportingCSV(true)} variant="outline" style={{ borderColor: '#4A90E2', color: '#4A90E2' }}>
                    <Plus className="w-4 h-4 mr-2" />Importer CSV
                  </Button>
                  <Button onClick={() => setIsAddingAsset(true)} style={{ backgroundColor: '#F47B20' }} className="shadow-md hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />Nouvel asset
                  </Button>
                </div>
              </div>
            )}
            {isImportingCSV && <CSVImporter departments={departments} onImport={handleImportCSV} onClose={() => setIsImportingCSV(false)} />}
            {isAddingAsset && <AssetForm departments={departments} people={people} onSubmit={handleAddAsset} onCancel={() => setIsAddingAsset(false)} />}
            {editingAsset && <AssetForm departments={departments} people={people} asset={editingAsset} onSubmit={handleEditAsset} onCancel={() => setEditingAsset(null)} />}
            {!isAddingAsset && !editingAsset && !isImportingCSV && (
              <AssetList assets={assets} departments={departments} onEdit={setEditingAsset} onDelete={handleDeleteAsset} onExportCSV={handleExportCSV} />
            )}
          </TabsContent>

          <TabsContent value="people">
            <PeoplePage departments={departments} people={people} onSavePeople={savePeople} />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManager departments={departments} onAdd={handleAddDepartment} onEdit={handleEditDepartment} onDelete={handleDeleteDepartment} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPage users={users} onSaveUsers={saveUsers} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
