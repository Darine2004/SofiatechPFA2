import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import type { Asset } from './AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface CSVImporterProps {
  departments: Department[];
  onImport: (assets: (Omit<Asset, 'id' | 'status'> & { reference: string })[]) => void;
  onClose: () => void;
}

interface PreviewRow {
  row: number;
  data: Partial<Asset>;
  errors: string[];
}

const CSV_HEADERS = [
  'Département / Asset Location',
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
  'Calibration Validity Deadline',
];

const VALID_CATEGORIES = [
  'IT Equipment',
  'Technical Device',
  'Storage Media',
  'Communication Equipment',
  'Sensitive Data',
];

const VALID_PROPERTIES = ['SOFIATECH', 'Customer'];
const VALID_PRIORITIES = ['A - Critical', 'B - High', 'C - Medium', 'D - Restricted'];

export function CSVImporter({ departments, onImport, onClose }: CSVImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [importCount, setImportCount] = useState(0);

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(current.trim()); current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());
      rows.push(cols);
    }
    return rows;
  };

  // Résout le departmentId depuis le code de la référence (ex: "SW-ITE-0001" → code "SW")
  // ⚠️ Retourne '' si le code est inconnu — ne jamais forcer departments[0] (évite le bug QMA par défaut)
  const resolveDeptFromRef = (reference: string): string => {
    const deptCode = reference?.split('-')[0] || '';
    if (!deptCode) return '';
    const deptObj = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase());
    return deptObj?.id || ''; // '' si inconnu → sera signalé en erreur
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Remove BOM if present
      const clean = text.replace(/^\uFEFF/, '');
      const rows = parseCSV(clean);
      if (rows.length === 0) return;

      // Detect header row
      const headerRow = rows[0].map(h => h.trim());
      const hasHeader = headerRow.some(h =>
        CSV_HEADERS.map(x => x.toLowerCase()).includes(h.toLowerCase())
      );
      const dataRows = hasHeader ? rows.slice(1) : rows;

      // Map columns
      const colMap: Record<string, number> = {};
      if (hasHeader) {
        headerRow.forEach((h, i) => {
          const match = CSV_HEADERS.find(x => x.toLowerCase() === h.toLowerCase());
          if (match) colMap[match] = i;
        });
      } else {
        // Assume same order as CSV_HEADERS
        CSV_HEADERS.forEach((h, i) => { colMap[h] = i; });
      }

      const get = (row: string[], key: string) => row[colMap[key] ?? -1]?.trim() || '';

      const previews: PreviewRow[] = dataRows.map((row, idx) => {
        const errors: string[] = [];
        const subject = get(row, 'Subject');
        const category = get(row, 'Asset Category');
        const property = get(row, 'Property');
        const responsible = get(row, 'Asset Responsible');
        const owner = get(row, 'Asset Owner');
        const acquisitionDate = get(row, 'Acquisition Date');
        const priority = get(row, 'Priority');
        const description = get(row, 'Asset Description');

        const referenceFromCSV = get(row, 'Asset Reference');
        const deptLocation = get(row, 'Département / Asset Location');

        if (!subject) errors.push('Subject manquant');
        if (!referenceFromCSV) errors.push('Référence asset manquante');
        if (!description) errors.push('Description manquante');
        if (!category) errors.push('Catégorie manquante');
        else if (!VALID_CATEGORIES.includes(category))
          errors.push(`Catégorie invalide: "${category}"`);
        if (!property) errors.push('Property manquante');
        else if (!VALID_PROPERTIES.includes(property))
          errors.push(`Property invalide: "${property}"`);
        if (!responsible) errors.push('Responsable manquant');
        if (!owner) errors.push('Propriétaire manquant');
        if (!acquisitionDate) errors.push('Date acquisition manquante');
        if (priority && !VALID_PRIORITIES.includes(priority))
          errors.push(`Priorité invalide: "${priority}"`);

        // ── FIX : résoudre le departmentId depuis la référence, PAS depuis departments[0] ──
        const resolvedDeptId = resolveDeptFromRef(referenceFromCSV);
        const deptCodeFromRef = referenceFromCSV?.split('-')[0] || '';
        if (referenceFromCSV && !resolvedDeptId) {
          errors.push(`Département inconnu: "${deptCodeFromRef}" — vérifiez que ce code existe dans la liste des départements`);
        }

        const data: Partial<Asset> & { reference: string } = {
          subject,
          description,
          category,
          property,
          reference: referenceFromCSV,
          location: deptLocation || get(row, 'Asset Location'),
          responsible,
          owner,
          assignedTo: get(row, 'Assigned To'),
          actualStatus: get(row, 'Asset Actual Status'),
          returnCondition: get(row, 'Asset Return Condition'),
          acquisitionDate,
          calibrationStatus: get(row, 'Calibration Status'),
          calibrationDeadline: get(row, 'Calibration Validity Deadline'),
          priority: priority || 'D - Restricted',
          departmentId: resolvedDeptId, // ← Correction ici
        };

        return { row: idx + (hasHeader ? 2 : 1), data, errors };
      });

      setPreview(previews);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const validRows = preview.filter(p => p.errors.length === 0);
  const invalidRows = preview.filter(p => p.errors.length > 0);

  const handleImport = () => {
    const toImport = validRows.map(p => {
      const data = p.data as (Omit<Asset, 'id' | 'status'> & { reference: string });
      // Double sécurité : re-résoudre depuis la référence au moment de l'import
      const deptCodeFromRef = data.reference?.split('-')[0] || '';
      const deptObj = departments.find(d => d.code.toUpperCase() === deptCodeFromRef.toUpperCase());
      return {
        ...data,
        // ⚠️ Ne pas forcer departments[0] : si le code est inconnu, on garde '' (l'erreur aurait dû être catchée avant)
        departmentId: deptObj ? deptObj.id : (data.departmentId || ''),
      };
    });
    onImport(toImport);
    setImportCount(toImport.length);
    setStep('done');
  };

  return (
    <Card className="p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 style={{ color: '#003366' }}>Importer des Assets depuis CSV</h3>
          <p className="text-sm mt-1" style={{ color: '#4A90E2' }}>
            Importez plusieurs assets en une seule fois
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Étape 1 : Upload ── */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Zone de dépôt */}
          <div
            className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#4A90E2' }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: '#4A90E2' }} />
            <p className="font-medium" style={{ color: '#003366' }}>
              Glissez-déposez votre fichier CSV ici
            </p>
            <p className="text-sm mt-1" style={{ color: '#717182' }}>
              ou cliquez pour sélectionner
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Format attendu */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F8', border: '1px solid #4A90E2' }}>
            <p className="font-medium mb-2" style={{ color: '#003366' }}>
              <FileText className="w-4 h-4 inline mr-1" />
              Format CSV attendu (en-têtes) :
            </p>
            <p className="text-xs font-mono" style={{ color: '#2C3E50' }}>
              {CSV_HEADERS.join(', ')}
            </p>
            <p className="text-xs mt-2" style={{ color: '#717182' }}>
              💡 Vous pouvez utiliser l'export CSV de la Gestion Assets comme modèle.
            </p>
          </div>

          {/* Valeurs valides */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded" style={{ backgroundColor: '#F5F7FA' }}>
              <p className="font-medium mb-1" style={{ color: '#003366' }}>Catégories valides :</p>
              {VALID_CATEGORIES.map(c => <p key={c} style={{ color: '#2C3E50' }}>• {c}</p>)}
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: '#F5F7FA' }}>
              <p className="font-medium mb-1" style={{ color: '#003366' }}>Priorités valides :</p>
              {VALID_PRIORITIES.map(p => <p key={p} style={{ color: '#2C3E50' }}>• {p}</p>)}
              <p className="font-medium mt-2 mb-1" style={{ color: '#003366' }}>Property :</p>
              {VALID_PROPERTIES.map(p => <p key={p} style={{ color: '#2C3E50' }}>• {p}</p>)}
            </div>
          </div>
        </div>
      )}

      {/* ── Étape 2 : Prévisualisation ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
            <FileText className="w-5 h-5" style={{ color: '#4A90E2' }} />
            <span style={{ color: '#003366' }}>{fileName}</span>
            <span className="ml-auto text-sm" style={{ color: '#717182' }}>
              {preview.length} ligne(s) détectée(s)
            </span>
          </div>

          {/* Résumé */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(39,174,96,0.1)', border: '1px solid #27AE60' }}>
              <p className="text-2xl font-bold" style={{ color: '#27AE60' }}>{validRows.length}</p>
              <p className="text-sm" style={{ color: '#27AE60' }}>✅ Lignes valides</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid #E74C3C' }}>
              <p className="text-2xl font-bold" style={{ color: '#E74C3C' }}>{invalidRows.length}</p>
              <p className="text-sm" style={{ color: '#E74C3C' }}>❌ Lignes avec erreurs</p>
            </div>
          </div>

          {/* Erreurs */}
          {invalidRows.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {invalidRows.map(row => (
                <div key={row.row} className="p-2 rounded text-sm" style={{ backgroundColor: '#FFF5F5', border: '1px solid #E74C3C' }}>
                  <span className="font-medium" style={{ color: '#E74C3C' }}>Ligne {row.row} :</span>
                  <span style={{ color: '#2C3E50' }}> {row.errors.join(' | ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Aperçu des lignes valides */}
          {validRows.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#003366', color: 'white' }}>
                    <th className="p-2 text-left">Référence Asset</th>
                    <th className="p-2 text-left">Département (code)</th>
                    <th className="p-2 text-left">Département (nom)</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">Catégorie</th>
                    <th className="p-2 text-left">Responsable</th>
                    <th className="p-2 text-left">Priorité</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.map((row, i) => {
                    const ref = (row.data as any).reference || '';
                    const deptCodeFromRef = ref.split('-')[0] || '';
                    // ── FIX : recherche insensible à la casse ──
                    const deptObj = departments.find(d => d.code.toUpperCase() === deptCodeFromRef.toUpperCase());
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F5F7FA' : 'white' }}>
                        <td className="p-2 font-medium" style={{ color: '#003366' }}>{ref || '—'}</td>
                        <td className="p-2 font-medium" style={{ color: deptObj ? '#003366' : '#E74C3C' }}>
                          {deptCodeFromRef || '—'}
                          {!deptObj && deptCodeFromRef && <span className="text-xs ml-1" style={{ color: '#E74C3C' }}>⚠ inconnu</span>}
                        </td>
                        <td className="p-2" style={{ color: '#2C3E50' }}>{deptObj ? deptObj.name : <span style={{ color: '#717182' }}>—</span>}</td>
                        <td className="p-2" style={{ color: '#2C3E50' }}>{row.data.subject}</td>
                        <td className="p-2" style={{ color: '#2C3E50' }}>{row.data.category}</td>
                        <td className="p-2" style={{ color: '#2C3E50' }}>{row.data.responsible}</td>
                        <td className="p-2" style={{ color: '#2C3E50' }}>{row.data.priority}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0}
              style={{ backgroundColor: '#27AE60', color: 'white' }}
              className="hover:opacity-90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer {validRows.length} asset(s)
            </Button>
            <Button variant="outline" onClick={() => { setStep('upload'); setPreview([]); setFileName(''); }}>
              Choisir un autre fichier
            </Button>
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Succès ── */}
      {step === 'done' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#27AE60' }} />
          <h3 style={{ color: '#003366' }}>Importation réussie !</h3>
          <p className="mt-2" style={{ color: '#2C3E50' }}>
            <strong>{importCount}</strong> asset(s) ont été importés et synchronisés avec Firebase.
          </p>
          <Button onClick={onClose} className="mt-6" style={{ backgroundColor: '#003366', color: 'white' }}>
            Voir les assets
          </Button>
        </div>
      )}
    </Card>
  );
}
